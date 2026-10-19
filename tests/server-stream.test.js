import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { consumeOllamaStream } from '../src/stream.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
async function availablePort() {
  const listener = net.createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  return port;
}
async function waitReady(port, child) {
  for (let i = 0; i < 60; i++) {
    if (child.exitCode !== null) throw new Error('Chat-Server hat sich vorzeitig beendet');
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/status`, { signal: AbortSignal.timeout(400) });
      if (response.ok) return;
    } catch { /* server starting */ }
    await sleep(60);
  }
  throw new Error('Chat-Server wurde nicht rechtzeitig erreichbar.');
}
const ndjson = event => JSON.stringify(event) + '\n';

test('Server streamt Ollama-Nachrichten und beendet die Modellanfrage bei Abbruch', { timeout: 15000 }, async t => {
  let upstreamDisconnected = false;
  const fakeOllama = http.createServer(async (req, res) => {
    if (req.url === '/api/tags') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ models: [{ name: 'mock-model' }] }));
      return;
    }
    if (req.url !== '/api/chat') { res.writeHead(404).end(); return; }
    let body = '';
    for await (const chunk of req) body += chunk.toString();
    const payload = JSON.parse(body);
    if (payload.stream === false) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: { content: 'Antwort synchron' } }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/x-ndjson' });
    res.write(ndjson({ message: { content: 'Hallo ' }, done: false }));
    if (payload.messages[0]?.content === 'stop') {
      const interval = setInterval(() => {
        if (!res.destroyed) res.write(ndjson({ message: { content: '.' }, done: false }));
      }, 70);
      res.once('close', () => { upstreamDisconnected = true; clearInterval(interval); });
      return;
    }
    await sleep(30);
    if (!res.destroyed) res.end(ndjson({ message: { content: 'Welt' }, done: false }) + ndjson({ done: true }));
  });
  await new Promise(resolve => fakeOllama.listen(0, '127.0.0.1', resolve));
  const fakePort = fakeOllama.address().port;
  const port = await availablePort();
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: root,
    env: { ...process.env, PORT: String(port), OLLAMA_URL: `http://127.0.0.1:${fakePort}` },
    stdio: 'ignore'
  });
  t.after(async () => {
    child.kill('SIGTERM');
    fakeOllama.closeAllConnections();
    await new Promise(resolve => fakeOllama.close(resolve));
  });
  await waitReady(port, child);
  const url = `http://127.0.0.1:${port}/api/chat/stream`;
  const makeBody = content => JSON.stringify({ model: 'mock-model', messages: [{ role: 'user', content }] });
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: makeBody('hello') });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/x-ndjson/);
  assert.equal(await consumeOllamaStream(response.body), 'Hallo Welt');
  const legacy = await fetch(`http://127.0.0.1:${port}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: makeBody('hello') });
  assert.equal((await legacy.json()).message, 'Antwort synchron');
  const invalid = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: makeBody('hello').replace('mock-model', 'nonexistent') });
  assert.equal(invalid.status, 400);

  const controller = new AbortController();
  const abortedResponse = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: makeBody('stop')
  });
  assert.equal(abortedResponse.status, 200);
  const reader = abortedResponse.body.getReader();
  const first = await reader.read();
  assert.equal(first.done, false);
  controller.abort();
  await assert.rejects(() => reader.read(), /aborted|AbortError|operation/i);
  for (let i = 0; i < 30 && !upstreamDisconnected; i++) await sleep(50);
  assert.equal(upstreamDisconnected, true, 'Abbruch am Browser muss Ollama-Stream schließen');
});
