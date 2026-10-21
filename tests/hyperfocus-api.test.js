import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
async function freePort() {
  const server = net.createServer();
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const port = server.address().port;
  await new Promise(done => server.close(done));
  return port;
}
test('Hyperfocus REST: preview token required; disabled repos, origin spoofing and cloud rejected', { timeout: 12000 }, async t => {
  const port = await freePort();
  const base = 'http://127.0.0.1:' + port;
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: root,
    env: {
      ...process.env, PORT: String(port),
      CRYO_GITHUB_REPOS: 'Pierreg99/CryoGPTCHATFREEBIE',
      OPENAI_API_KEY: '', CRYO_OPENAI_MODELS: ''
    },
    stdio: 'ignore'
  });
  t.after(() => child.kill('SIGTERM'));
  let started = false;
  for (let i = 0; i < 70; i++) {
    try { if ((await fetch(base + '/api/integrations')).ok) { started = true; break; } }
    catch { /* startup */ }
    await sleep(40);
  }
  assert.equal(started, true);
  const post = (url, body, origin = base) => fetch(base + url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': origin },
    body: JSON.stringify(body)
  });
  const goal = 'Einen sicheren lokalen Fokusplan mit messbarem Testziel formulieren.';
  const valid = { goal, repo: 'Pierreg99/CryoGPTCHATFREEBIE', minutes: 15 };
  assert.equal((await post('/api/hyperfocus/plan', valid, 'https://foreign.example')).status, 403);
  assert.equal((await post('/api/hyperfocus/plan', { ...valid, repo: 'unknown/project' })).status, 403);
  assert.equal((await post('/api/hyperfocus/plan', { ...valid, model: 'openai:gpt-4.1-mini' })).status, 400);
  assert.equal((await post('/api/hyperfocus/run', { ticket: 'deadbeef' })).status, 400);
  assert.equal((await post('/api/hyperfocus/run', { ticket: 'a'.repeat(48) })).status, 409);
  const res = await post('/api/hyperfocus/plan', valid);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.match(data.ticket, /^[0-9a-f]{48}$/);
  assert.deepEqual(data.preview.actions.map(x => x.operation), ['read-readme', 'build-offline-brief']);
  assert.equal(data.preview.requiresConfirmation, true);
  assert.equal(data.preview.permissions.includes('kein GitHub-Write'), true);
  // This test never redeems a valid token; that would contact live GitHub.
});
