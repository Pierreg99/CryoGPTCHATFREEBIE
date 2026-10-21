import test from 'node:test';
import assert from 'node:assert/strict';
import { validateHyperfocusPlan, previewHyperfocusPlan, runHyperfocus, buildOfflineBrief } from '../src/hyperfocus.mjs';

const allowlist = ['Pierreg99/CryoGPTCHATFREEBIE', 'Pierreg99/cryo-omega-AI-Agentic-Learn-Packages'];
const input = {
  goal: 'Erarbeite einen überprüfbaren Fokusplan für die sichere Skill-Suche.',
  repo: allowlist[0],
  skillRepo: allowlist[1],
  query: 'agent',
  minutes: 15,
  model: ''
};

test('Plan is read-only, deterministic and has maximum three steps', () => {
  const plan = validateHyperfocusPlan(input, { allowlist });
  assert.deepEqual(plan.actions.map(x => x.type), ['read-readme', 'search-skills', 'build-offline-brief']);
  assert.equal(previewHyperfocusPlan(plan).requiresConfirmation, true);
  assert.equal(previewHyperfocusPlan(plan).permissions.includes('kein GitHub-Write'), true);
  assert.equal(plan.minutes, 15);
});

test('Reject unknown repos, autonomous cloud, invalid budgets and excessively large goals', () => {
  for (const mutation of [
    { repo: 'other/repo' }, { skillRepo: 'other/repo' }, { model: 'openai:gpt-4.1' },
    { minutes: 99 }, { goal: 'short' }, { goal: 'x'.repeat(601) },
    { query: '\u0000' }
  ]) {
    assert.throws(() => validateHyperfocusPlan({ ...input, ...mutation }, { allowlist }));
  }
  assert.equal(validateHyperfocusPlan({ ...input, model: 'qwen2.5:3b' }, { allowlist }).actions.length, 3);
});

test('Offline autopilot performs exact allowlisted reads then generates a timeboxed brief', async () => {
  const plan = validateHyperfocusPlan(input, { allowlist });
  const calls = [];
  const result = await runHyperfocus(plan, {
    previewFn: async args => { calls.push({ type: 'readme', args }); return { text: 'Eine lokale KI-App mit Node.js und Tests.', truncated: false }; },
    skillsFn: async args => {
      calls.push({ type: 'skills', args });
      return { total: 114, matches: 1, results: [{ name: 'agent-workflow', description: 'Sicherer Agentenablauf' }] };
    },
    fetchImpl: async () => { throw new Error('Cloud/Model was contacted unexpectedly'); }
  });
  assert.deepEqual(calls.map(x => x.type), ['readme', 'skills']);
  assert.equal(calls[0].args.repo, allowlist[0]);
  assert.equal(calls[1].args.repo, allowlist[1]);
  assert.equal(result.writes, 0);
  assert.equal(result.mode, 'offline');
  assert.match(result.brief, /ORIENTIEREN/);
  assert.match(result.brief, /UMSETZEN/);
  assert.match(result.brief, /PRÜFEN/);
  assert.match(result.brief, /agent-workflow/);
});

test('Optional Ollama synthesis validates model allowlist and never asks to execute tools', async () => {
  const plan = validateHyperfocusPlan({ ...input, model: 'qwen2.5:3b' }, { allowlist });
  let payload, endpoint;
  const result = await runHyperfocus(plan, {
    previewFn: async () => ({ text: 'README', truncated: false }),
    skillsFn: async () => ({ matches: 1, results: [{ name: 'agent', description: 'read-only' }] }),
    modelsFn: async () => ['qwen2.5:3b'],
    fetchImpl: async (url, opts) => {
      endpoint = url; payload = JSON.parse(opts.body);
      return { ok: true, json: async () => ({ message: { content: '1. Prüfen\n2. Bauen\n3. Testen' } }) };
    }
  });
  assert.equal(endpoint, 'http://127.0.0.1:11434/api/chat');
  assert.equal(payload.model, 'qwen2.5:3b');
  assert.equal(payload.stream, false);
  assert.equal(payload.tools, undefined);
  assert.equal(payload.messages[0].role, 'system');
  assert.equal(result.mode, 'ollama');
  assert.equal(result.brief.includes('Testen'), true);
  assert.equal(result.writes, 0);
});

test('A model not installed locally stops without calling any model endpoint', async () => {
  let sent = false;
  const plan = validateHyperfocusPlan({ ...input, model: 'bad-model' }, { allowlist });
  await assert.rejects(() => runHyperfocus(plan, {
    previewFn: async () => ({ text: 'README' }),
    skillsFn: async () => ({ results: [] }),
    modelsFn: async () => ['installed'],
    fetchImpl: async () => { sent = true; }
  }), /nicht lokal verfügbar/);
  assert.equal(sent, false);
});

test('Cancellation interrupts before a second GitHub read or model inference', async () => {
  const controller = new AbortController();
  let skillsCalled = false;
  const plan = validateHyperfocusPlan(input, { allowlist });
  await assert.rejects(() => runHyperfocus(plan, {
    previewFn: async () => { controller.abort(); return { text: 'Public README' }; },
    skillsFn: async () => { skillsCalled = true; }
    ,signal: controller.signal
  }), /abgebrochen/);
  assert.equal(skillsCalled, false);
});

test('Offline brief handles missing optional skill repository without inventing results', () => {
  const plan = validateHyperfocusPlan({ ...input, skillRepo: '' }, { allowlist });
  const result = buildOfflineBrief(plan, { readme: { text: 'README' } });
  assert.match(result, /Keine passenden Skill-Einträge geladen/);
  assert.match(result, /Zeitbudget: 15 Minuten/);
});
