import { spawn } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { prepareScene } from './godot-scene-plan.mjs';

const PERMITTED = new Set(['get_godot_version', 'get_project_info', 'create_scene']);

export function godotMcpConfigured(env = process.env) {
  const entry = env.GODOT_MCP_ENTRY;
  const project = env.GODOT_PROJECT_PATH;
  return typeof entry === 'string' && path.isAbsolute(entry) && existsSync(entry)
    && typeof project === 'string' && path.isAbsolute(project)
    && existsSync(path.join(project, 'project.godot'));
}

/**
 * Explicit, user-triggered MCP inspection. No model may supply tool names,
 * script paths, or project directories. MCP processes are short-lived.
 *
 * IMPORTANT: The third-party MCP process itself is trusted code, even when
 * only inspecting. Run it only from a reviewed, locally installed checkout.
 */
export async function callGodotMcp(tool, {
  entry = process.env.GODOT_MCP_ENTRY,
  projectPath = process.env.GODOT_PROJECT_PATH,
  godotPath = process.env.GODOT_PATH,
  scene = null,
  timeoutMs = 25000
} = {}) {
  if (!PERMITTED.has(tool)) throw new Error('Dieses Godot-MCP-Werkzeug ist nicht freigegeben.');
  if (!entry || !path.isAbsolute(entry) || !existsSync(entry)) {
    throw new Error('GODOT_MCP_ENTRY muss auf einen installierten absoluten build/index.js-Pfad zeigen.');
  }
  if (!projectPath || !path.isAbsolute(projectPath) || !existsSync(path.join(projectPath, 'project.godot'))) {
    throw new Error('GODOT_PROJECT_PATH muss auf einen vorhandenen Godot-Projektordner zeigen.');
  }
  const realProjectPath = realpathSync(projectPath);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30000) throw new Error('Ungültiges Zeitlimit.');

  if (tool === 'create_scene' && process.env.GODOT_SCENE_WRITES !== 'true') {
    throw new Error('Godot-Szenenerstellung ist nur mit GODOT_SCENE_WRITES=true möglich.');
  }
  const validatedScene = tool === 'create_scene'
    ? prepareScene(realProjectPath, scene?.sceneName, scene?.rootNodeType)
    : null;
  const params = validatedScene
    ? { projectPath: realProjectPath, scenePath: validatedScene.scenePath, rootNodeType: validatedScene.rootNodeType }
    : tool === 'get_project_info' ? { projectPath: realProjectPath } : {};
  const env = {};
  for (const key of ['PATH', 'HOME', 'USERPROFILE', 'APPDATA', 'TMP', 'TMPDIR', 'SystemRoot', 'WINDIR']) {
    if (process.env[key]) env[key] = process.env[key];
  }
  if (godotPath) env.GODOT_PATH = godotPath;
  env.DEBUG = 'false';

  return new Promise((resolve, reject) => {
    // node only, no shell or npx. Never download a package on the user's behalf.
    const child = spawn(process.execPath, [entry], { cwd: realProjectPath, env, stdio: ['pipe', 'pipe', 'pipe'] });
    let settled = false, buffer = '';
    const stop = (error, output) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill('SIGTERM');
      if (error) reject(error);
      else resolve(output);
    };
    const timer = setTimeout(() => stop(new Error('Godot MCP hat das Zeitlimit überschritten.')), timeoutMs);
    const send = message => {
      if (settled) return;
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', ...message }) + '\n');
    };
    child.on('error', () => stop(new Error('Godot MCP konnte nicht gestartet werden.')));
    child.stdin.on('error', () => stop(new Error('Kommunikation mit Godot MCP fehlgeschlagen.')));
    child.on('exit', () => stop(new Error('Godot MCP wurde vorzeitig beendet.')));
    child.stdout.on('data', chunk => {
      buffer += chunk.toString('utf8');
      if (Buffer.byteLength(buffer, 'utf8') > 256000) {
        stop(new Error('Godot MCP hat zu viele Daten zurückgegeben.'));
        return;
      }
      let i;
      while (!settled && (i = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, i).trim();
        buffer = buffer.slice(i + 1);
        if (!line) continue;
        let packet;
        try { packet = JSON.parse(line); }
        catch { stop(new Error('Godot MCP hat ein ungültiges Protokoll gesendet.')); break; }
        if (packet.id === 1) {
          if (packet.error) { stop(new Error('Godot MCP Initialisierung fehlgeschlagen.')); break; }
          send({ method: 'notifications/initialized', params: {} });
          send({ id: 2, method: 'tools/call', params: { name: tool, arguments: params } });
        }
        if (packet.id === 2) {
          if (packet.error || packet.result?.isError) {
            stop(new Error('Godot MCP meldet einen Fehler: ' + String(packet.result?.content?.[0]?.text || packet.error?.message || 'Unbekannt').slice(0, 500)));
            break;
          }
          const items = packet.result?.content;
          if (!Array.isArray(items)) { stop(new Error('Godot MCP lieferte keine Textausgabe.')); break; }
          const message = items.filter(item => item?.type === 'text' && typeof item.text === 'string').map(item => item.text).join('\n');
          if (message.length > 24000) { stop(new Error('Godot-Projektantwort überschreitet das Ausgabelimit.')); break; }
          stop(null, message);
        }
      }
    });
    send({
      id: 1, method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'CryoGPTCHATFREEBIE', version: '0.4.0' } }
    });
  });
}
