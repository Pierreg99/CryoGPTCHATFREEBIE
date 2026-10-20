import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { prepareScene } from '../src/godot-scene-plan.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = path.join(root, 'tests/fixtures/mock-godot-mcp.mjs');
async function fixture(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'cryo-scenes-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(path.join(dir, 'project.godot'), '[application]\nconfig/name="Mock"\n');
  await mkdir(path.join(dir, 'scenes/cryogptchat'), { recursive: true });
  return dir;
}
async function port() {
  const listener = net.createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const number = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  return number;
}
async function serve(t, dir, allowWrites) {
  const number = await port();
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: root,
    env: {
      ...process.env, PORT: String(number),
      GODOT_MCP_ENTRY: entry, GODOT_PROJECT_PATH: dir,
      GODOT_SCENE_WRITES: allowWrites ? 'true' : 'false'
    },
    stdio: 'ignore'
  });
  t.after(() => child.kill('SIGTERM'));
  const base = 'http://127.0.0.1:' + number;
  for (let i = 0; i < 70; i++) {
    if (child.exitCode !== null) throw new Error('HTTP server exited');
    try { if ((await fetch(base + '/api/godot/status', { signal: AbortSignal.timeout(300) })).ok) return base; }
    catch { /* boot */ }
    await sleep(60);
  }
  throw new Error('HTTP server did not start');
}
function post(base, endpoint, payload, origin = base) {
  return fetch(base + endpoint, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

test('scene name/root and symlink validation stop paths outside scoped folder', async t => {
  const dir = await fixture(t);
  assert.equal(prepareScene(dir, 'FirstLevel', 'Node3D').scenePath, 'scenes/cryogptchat/FirstLevel.tscn');
  for (const name of ['../escape', '/tmp/x', 'a/b', 'foo.tscn', '', 'with space', 'a'.repeat(41)]) {
    assert.throws(() => prepareScene(dir, name, 'Node3D'), /Szenenname/);
  }
  assert.throws(() => prepareScene(dir, 'Safe', 'GDScript'), /Node2D/);
  await writeFile(path.join(dir, 'scenes/cryogptchat/Duplicate.tscn'), 'existing');
  assert.throws(() => prepareScene(dir, 'Duplicate', 'Node2D'), /existiert bereits/);
  const outside = await mkdtemp(path.join(os.tmpdir(), 'cryo-outside-'));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await mkdir(path.join(dir, 'scenes', 'symlink-test'), { recursive: true });
  const dir2 = await mkdtemp(path.join(os.tmpdir(), 'cryo-symlink-'));
  t.after(() => rm(dir2, { recursive: true, force: true }));
  await writeFile(path.join(dir2, 'project.godot'), '[application]');
  await mkdir(path.join(dir2, 'scenes'));
  await symlink(outside, path.join(dir2, 'scenes/cryogptchat'));
  assert.throws(() => prepareScene(dir2, 'Safe', 'Node2D'), /symbolische Links/);
});

test('server only creates a scene after preview ticket; ticket cannot be reused', { timeout: 14000 }, async t => {
  const dir = await fixture(t);
  const base = await serve(t, dir, true);
  const target = path.join(dir, 'scenes/cryogptchat/AlphaLevel.tscn');
  const preview = await post(base, '/api/godot/scene/preview', { sceneName: 'AlphaLevel', rootNodeType: 'Node2D' });
  assert.equal(preview.status, 200);
  const details = await preview.json();
  assert.match(details.summary, /AlphaLevel\.tscn/);
  assert.equal(existsSync(target), false, 'preview must not create any files');
  const created = await post(base, '/api/godot/scene/create', { ticket: details.ticket });
  assert.equal(created.status, 200);
  assert.equal((await created.json()).scenePath, 'scenes/cryogptchat/AlphaLevel.tscn');
  assert.equal(existsSync(target), true);
  assert.match(await readFile(target, 'utf8'), /Node2D/);
  assert.equal((await post(base, '/api/godot/scene/create', { ticket: details.ticket })).status, 409);
  assert.equal((await post(base, '/api/godot/scene/preview', { sceneName: 'AlphaLevel', rootNodeType: 'Node2D' })).status, 400);
  assert.equal((await post(base, '/api/godot/scene/preview', { sceneName: '../escape', rootNodeType: 'Node3D' })).status, 400);
  assert.equal((await post(base, '/api/godot/scene/preview', { sceneName: 'B', rootNodeType: 'BadClass' })).status, 400);
  assert.equal((await post(base, '/api/godot/scene/preview', { sceneName: 'B', rootNodeType: 'Control' }, 'https://evil.invalid')).status, 403);
});

test('writing is disabled unless GODOT_SCENE_WRITES=true', { timeout: 10000 }, async t => {
  const dir = await fixture(t);
  const base = await serve(t, dir, false);
  assert.equal((await post(base, '/api/godot/scene/preview', { sceneName: 'Hidden', rootNodeType: 'Node3D' })).status, 503);
  assert.equal(existsSync(path.join(dir, 'scenes/cryogptchat/Hidden.tscn')), false);
});
