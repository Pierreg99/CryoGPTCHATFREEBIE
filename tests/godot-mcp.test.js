import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { setTimeout as sleep } from 'node:timers/promises';
import { godotMcpConfigured, callGodotMcp } from '../src/godot-mcp-client.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = path.join(repo, 'tests/fixtures/mock-godot-mcp.mjs');

async function projectFixture(t) {
  const project = await mkdtemp(path.join(os.tmpdir(), 'cryo-godot-'));
  await writeFile(path.join(project, 'project.godot'), '[application]\nconfig/name="Mock"\n');
  t.after(() => rm(project, { recursive: true, force: true }));
  return project;
}
async function freePort() {
  const srv = net.createServer();
  await new Promise(resolve => srv.listen(0, '127.0.0.1', resolve));
  const port = srv.address().port;
  await new Promise(resolve => srv.close(resolve));
  return port;
}
async function waitServer(port, child) {
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error('Server exited unexpectedly');
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/godot/status`, { signal: AbortSignal.timeout(400) });
      if (res.ok) return;
    } catch { /* starting */ }
    await sleep(50);
  }
  throw new Error('Local test server did not start');
}

test('MCP inspector accepts only two manually-approved informational tools', { timeout: 10000 }, async t => {
  const projectPath = await projectFixture(t);
  assert.equal(godotMcpConfigured({ GODOT_MCP_ENTRY: entry, GODOT_PROJECT_PATH: projectPath }), true);
  assert.equal(await callGodotMcp('get_godot_version', { entry, projectPath }), 'Godot Engine v4.4.mock');
  assert.match(await callGodotMcp('get_project_info', { entry, projectPath }), /Mock project:/);
  await assert.rejects(() => callGodotMcp('create_scene', { entry, projectPath }), /nicht freigegeben/);
  await assert.rejects(() => callGodotMcp('get_project_info', { entry, projectPath: '/this/location/does/not/exist' }), /GODOT_PROJECT_PATH/);
});

test('Godot MCP inspection API requires same-origin and disallows mutation tools', { timeout: 12000 }, async t => {
  const projectPath = await projectFixture(t);
  const port = await freePort();
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: repo,
    env: { ...process.env, PORT: String(port), GODOT_MCP_ENTRY: entry, GODOT_PROJECT_PATH: projectPath },
    stdio: 'ignore'
  });
  t.after(() => child.kill('SIGTERM'));
  await waitServer(port, child);
  const base = `http://127.0.0.1:${port}`;
  const status = await fetch(base + '/api/godot/status');
  assert.deepEqual(await status.json(), { configured: true, mode: 'manual-inspection' });

  const badOrigin = await fetch(base + '/api/godot/inspect', {
    method: 'POST', headers: { Origin: 'https://example.invalid', 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool: 'get_godot_version' })
  });
  assert.equal(badOrigin.status, 403);

  const request = tool => fetch(base + '/api/godot/inspect', {
    method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool })
  });
  assert.equal((await request('create_scene')).status, 400);
  const version = await request('get_godot_version');
  assert.equal(version.status, 200);
  assert.equal((await version.json()).output, 'Godot Engine v4.4.mock');
  const info = await request('get_project_info');
  assert.equal(info.status, 200);
  assert.match((await info.json()).output, /Mock project:/);
});
