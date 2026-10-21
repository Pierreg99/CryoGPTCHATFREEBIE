import http from 'node:http';
import { configuredRepositories, githubPreview, searchGithubSkills } from './src/github-integration.mjs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const ollama = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8' };
const allow = new Set(['/index.html', '/src/app.js', '/src/core.js', '/src/stream.js', '/src/storage.js', '/src/styles.css', '/assets/logo.svg']);

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function getModels() {
  const r = await fetch(`${ollama}/api/tags`, { signal: AbortSignal.timeout(2800) });
  if (!r.ok) throw new Error('Ollama antwortet mit HTTP ' + r.status);
  const data = await r.json();
  return Array.isArray(data.models) ? data.models.map(m => m.name).filter(x => typeof x === 'string') : [];
}

async function parseRequest(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 200000) throw new Error('Nachricht zu groß');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'");
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (url.pathname === '/api/status' && req.method === 'GET') {
      try { return json(res, 200, { online: true, models: await getModels() }); }
      catch { return json(res, 200, { online: false, models: [] }); }
    }
    if (url.pathname === '/api/integrations' && req.method === 'GET') {
      return json(res, 200, { github: { readonly: true, repositories: configuredRepositories() }, skills: { readonly: true, executable: false } });
    }
    if (url.pathname === '/api/integrations/github' && req.method === 'GET') {
      try {
        const result = await githubPreview({ repo: url.searchParams.get('repo') || '', path: url.searchParams.get('path') || '' });
        return json(res, 200, result);
      } catch (error) {
        return json(res, Number.isInteger(error.status) ? error.status : 500, { error: error.message || 'GitHub-Integration fehlgeschlagen.' });
      }
    }
    if (url.pathname === '/api/integrations/skills' && req.method === 'GET') {
      try {
        const result = await searchGithubSkills({ repo: url.searchParams.get('repo') || '', query: url.searchParams.get('q') || '' });
        return json(res, 200, result);
      } catch (error) {
        return json(res, Number.isInteger(error.status) ? error.status : 500, { error: error.message || 'Skill-Suche fehlgeschlagen.' });
      }
    }
    if ((url.pathname === '/api/chat' || url.pathname === '/api/chat/stream') && req.method === 'POST') {
      if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) return json(res, 415, { error: 'JSON erwartet.' });
      const origin = req.headers.origin;
      if (origin && origin !== `http://127.0.0.1:${port}`) return json(res, 403, { error: 'Fremder Ursprung nicht erlaubt.' });
      let body;
      try { body = await parseRequest(req); }
      catch { return json(res, 400, { error: 'Ungültiges JSON oder zu große Eingabe.' }); }
      const { model, messages } = body;
      if (typeof model !== 'string' || !model.trim() || model.length > 100 || !Array.isArray(messages) || !messages.length || messages.length > 24 || !messages.every(m => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string' && m.content.length <= 12000)) {
        return json(res, 400, { error: 'Ungültige Anfrage.' });
      }
      const streaming = url.pathname === '/api/chat/stream';
      // Abort in-flight Ollama generation when the browser stops or disconnects.
      const controller = new AbortController();
      const onDisconnect = () => controller.abort();
      res.once('close', onDisconnect);
      try {
        const available = await getModels();
        if (controller.signal.aborted) return;
        if (!available.includes(model)) return json(res, 400, { error: 'Das Modell ist nicht lokal installiert.' });
        const r = await fetch(`${ollama}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages, stream: streaming }),
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(120000)])
        });
        if (controller.signal.aborted) return;
        if (!r.ok) return json(res, 502, { error: 'Ollama konnte die Antwort nicht erzeugen.' });
        if (streaming) {
          if (!r.body) return json(res, 502, { error: 'Ollama bietet keinen Antwort-Stream.' });
          res.writeHead(200, {
            'Content-Type': 'application/x-ndjson; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Accel-Buffering': 'no'
          });
          let bytes = 0;
          try {
            for await (const chunk of r.body) {
              if (controller.signal.aborted) break;
              bytes += chunk.byteLength;
              if (bytes > 512000) {
                res.write(JSON.stringify({ error: 'Stream überschreitet das Sicherheitslimit.' }) + '\n');
                controller.abort();
                break;
              }
              res.write(chunk);
            }
          } catch {
            if (!res.destroyed && !controller.signal.aborted) {
              res.write(JSON.stringify({ error: 'Verbindung zum Modell während der Antwort unterbrochen.' }) + '\n');
            }
          }
          if (!res.destroyed) res.end();
          return;
        }
        const response = await r.json();
        if (typeof response.message?.content !== 'string') return json(res, 502, { error: 'Ungültige Ollama-Antwort.' });
        return json(res, 200, { message: response.message.content });
      } catch {
        if (!res.destroyed && !res.headersSent) return json(res, 503, { error: 'Ollama ist nicht erreichbar oder antwortet nicht rechtzeitig.' });
      } finally {
        res.off('close', onDisconnect);
      }
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Methode nicht erlaubt.' });
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); }
    catch { return json(res, 400, { error: 'Ungültiger Pfad.' }); }
    if (pathname === '/') pathname = '/index.html';
    if (!allow.has(pathname)) return json(res, 404, { error: 'Nicht gefunden.' });
    const content = await readFile(path.join(root, pathname.slice(1)));
    res.writeHead(200, { 'Content-Type': mime[path.extname(pathname)] || 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch {
    json(res, 500, { error: 'Interner Serverfehler.' });
  }
});

server.listen(port, '127.0.0.1', () => console.log(`CryoGPTCHATFREEBIE läuft auf http://127.0.0.1:${port}`));
