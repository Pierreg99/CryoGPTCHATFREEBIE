import http from 'node:http';
import { callGodotMcp, godotMcpConfigured } from './src/godot-mcp-client.mjs';
import { prepareScene } from './src/godot-scene-plan.mjs';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { callOpenai, configuredOpenaiModels, normalizeOpenaiStream } from './src/providers.mjs';
import { configuredRepositories, githubPreview, searchGithubSkills } from './src/github-integration.mjs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const pendingScenePlans = new Map();
let activeGodotProcesses = 0;
const MAX_GODOT_PROCESSES = 2;
async function runGodotTool(...args) {
  if (activeGodotProcesses >= MAX_GODOT_PROCESSES) {
    const error = new Error('Godot MCP ist ausgelastet. Bitte abgeschlossene Abfragen abwarten.');
    error.status = 429;
    throw error;
  }
  activeGodotProcesses++;
  try { return await callGodotMcp(...args); }
  finally { activeGodotProcesses--; }
}
const port = Number(process.env.PORT || 4173);
const ollama = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8' };
const allow = new Set(['/index.html', '/src/app.js', '/src/integrations.js', '/src/agent-ui.js', '/src/core.js', '/src/stream.js', '/src/storage.js', '/src/styles.css', '/assets/logo.svg']);

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
    if ((url.pathname === '/api/godot/scene/preview' || url.pathname === '/api/godot/scene/create') && req.method === 'POST') {
      if (process.env.GODOT_SCENE_WRITES !== 'true' || !godotMcpConfigured()) {
        return json(res, 503, { error: 'Szenenbearbeitung muss lokal eingerichtet und ausdrücklich aktiviert sein.' });
      }
      if (req.headers.origin !== `http://127.0.0.1:${port}`) {
        return json(res, 403, { error: 'Nur die lokale Bedienoberfläche darf Godot-Werkzeuge aufrufen.' });
      }
      if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) return json(res, 415, { error: 'JSON erwartet.' });
      let data;
      try { data = await parseRequest(req); }
      catch { return json(res, 400, { error: 'Ungültiges JSON oder zu große Eingabe.' }); }
      if (url.pathname.endsWith('/preview')) {
        let plan;
        try { plan = prepareScene(process.env.GODOT_PROJECT_PATH, data?.sceneName, data?.rootNodeType); }
        catch (error) { return json(res, 400, { error: String(error.message) }); }
        // Drop expired plans and keep memory usage bounded.
        const now = Date.now();
        for (const [key, value] of pendingScenePlans) if (value.expiresAt < now) pendingScenePlans.delete(key);
        if (pendingScenePlans.size >= 25) return json(res, 429, { error: 'Zu viele offene Voransichten.' });
        const ticket = randomBytes(24).toString('hex');
        const expiresAt = now + 120000;
        pendingScenePlans.set(ticket, { sceneName: plan.sceneName, rootNodeType: plan.rootNodeType, expiresAt });
        return json(res, 200, { ticket, summary: plan.summary, expiresAt });
      }
      if (!data || typeof data.ticket !== 'string' || !/^[0-9a-f]{48}$/.test(data.ticket)) {
        return json(res, 400, { error: 'Ungültige Bestätigung.' });
      }
      const pending = pendingScenePlans.get(data.ticket);
      pendingScenePlans.delete(data.ticket); // one-shot; consume even after validation failure
      if (!pending || pending.expiresAt < Date.now()) return json(res, 409, { error: 'Voransicht abgelaufen. Bitte neu prüfen.' });
      let plan;
      try { plan = prepareScene(process.env.GODOT_PROJECT_PATH, pending.sceneName, pending.rootNodeType); }
      catch (error) { return json(res, 409, { error: String(error.message) }); }
      try {
        const output = await runGodotTool('create_scene', {
          scene: { sceneName: plan.sceneName, rootNodeType: plan.rootNodeType }
        });
        // External tool responses alone cannot prove a scene was actually created.
        if (!existsSync(plan.absolutePath)) return json(res, 502, { error: 'MCP meldet Erfolg, aber die Szenendatei fehlt. Bitte Projekt prüfen.' });
        return json(res, 200, { scenePath: plan.scenePath, rootNodeType: plan.rootNodeType, output });
      } catch (error) {
        return json(res, error.status === 429 ? 429 : 502, { error: String(error.message || 'Godot-Szenenerstellung fehlgeschlagen.').slice(0, 600) });
      }
    }
    if (url.pathname === '/api/godot/status' && req.method === 'GET') {
      return json(res, 200, {
        configured: godotMcpConfigured(),
        mode: 'manual-inspection',
        ...(process.env.GODOT_SCENE_WRITES === 'true' ? { canCreateScenes: godotMcpConfigured() } : {})
      });
    }
    if (url.pathname === '/api/godot/inspect' && req.method === 'POST') {
      // Require a same-origin browser click; do not expose generic MCP tool calls.
      if (req.headers.origin !== `http://127.0.0.1:${port}`) return json(res, 403, { error: 'Nur die lokale Bedienoberfläche darf Godot-Werkzeuge aufrufen.' });
      if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) return json(res, 415, { error: 'JSON erwartet.' });
      if (!godotMcpConfigured()) return json(res, 503, { error: 'Godot MCP ist nicht eingerichtet.' });
      let request;
      try { request = await parseRequest(req); }
      catch { return json(res, 400, { error: 'Ungültige Anfrage.' }); }
      if (!request || typeof request !== 'object' || !['get_godot_version', 'get_project_info'].includes(request.tool)) {
        return json(res, 400, { error: 'Dieses Godot-Werkzeug ist nicht freigegeben.' });
      }
      try {
        return json(res, 200, { tool: request.tool, output: await runGodotTool(request.tool) });
      } catch (error) {
        return json(res, error.status === 429 ? 429 : 502, { error: String(error.message || 'Godot-Abfrage fehlgeschlagen.').slice(0, 600) });
      }
    }
    if (url.pathname === '/api/status' && req.method === 'GET') {
      let models = [], online = false;
      try { models = await getModels(); online = true; } catch { /* Ollama is optional */ }
      const openai = configuredOpenaiModels();
      return json(res, 200, {
        online, models,
        providers: { ollama: { online, models }, openai: { enabled: openai.length > 0, models: openai } }
      });
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
    if (url.pathname === '/api/agent/execute' && req.method === 'POST') {
      if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) return json(res, 415, { error: 'JSON erwartet.' });
      const origin = req.headers.origin;
      if (origin && origin !== `http://127.0.0.1:${port}`) return json(res, 403, { error: 'Fremder Ursprung nicht erlaubt.' });
      let body;
      try { body = await parseRequest(req); } catch { return json(res, 400, { error: 'Ungültige Agentenanfrage.' }); }
      const { operation, repo, query = '' } = body;
      if (typeof repo !== 'string' || typeof operation !== 'string' || typeof query !== 'string' || query.length > 100) return json(res, 400, { error: 'Ungültige Agentenparameter.' });
      try {
        if (operation === 'read-readme') {
          return json(res, 200, { operation, result: await githubPreview({ repo, path: 'README.md' }), readonly: true });
        }
        if (operation === 'search-skills') {
          return json(res, 200, { operation, result: await searchGithubSkills({ repo, query }), readonly: true });
        }
        return json(res, 400, { error: 'Aktion nicht freigegeben.' });
      } catch (error) {
        return json(res, Number.isInteger(error.status) ? error.status : 500, { error: error.message || 'Agentenschritt fehlgeschlagen.' });
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
      const controller = new AbortController();
      const onDisconnect = () => controller.abort();
      res.once('close', onDisconnect);
      try {
        if (model.startsWith('openai:')) {
          // This cloud path is reachable only for explicitly configured models.
          const upstream = await callOpenai({
            choice: model, messages, stream: streaming,
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(120000)])
          });
          if (controller.signal.aborted) return;
          if (!streaming) return json(res, 200, { message: upstream });
          res.writeHead(200, {
            'Content-Type': 'application/x-ndjson; charset=utf-8',
            'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no'
          });
          try {
            for await (const event of normalizeOpenaiStream(upstream)) {
              if (controller.signal.aborted) break;
              res.write(event);
            }
          } catch {
            if (!res.destroyed && !controller.signal.aborted) {
              res.write(JSON.stringify({ error: 'Cloud-Stream unterbrochen oder ungültig.' }) + '\n');
            }
          }
          if (!res.destroyed) res.end();
          return;
        }
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
      } catch (error) {
        if (!res.destroyed && !res.headersSent) {
          const code = model.startsWith('openai:') && Number.isInteger(error.status) ? error.status : 503;
          return json(res, code, { error: model.startsWith('openai:') ? (error.message || 'Cloud-Anfrage fehlgeschlagen.') : 'Ollama ist nicht erreichbar oder antwortet nicht rechtzeitig.' });
        }
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
