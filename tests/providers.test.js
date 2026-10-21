import test from 'node:test';
import assert from 'node:assert/strict';
import { configuredOpenaiModels, validateOpenaiChoice, callOpenai, normalizeOpenaiStream } from '../src/providers.mjs';

const env = { OPENAI_API_KEY: 'local-test-only', CRYO_OPENAI_MODELS: 'gpt-4.1-mini,gpt-4.1' };
const messages = [{ role: 'user', content: 'Hallo' }];

test('Cloud ist ohne API-Key UND Modell-Freigabeliste deaktiviert', () => {
  assert.deepEqual(configuredOpenaiModels({}), []);
  assert.deepEqual(configuredOpenaiModels({ OPENAI_API_KEY: 'abc' }), []);
  assert.deepEqual(configuredOpenaiModels({ ...env, CRYO_OPENAI_MODELS: 'gpt-4.1-mini,../../etc, gpt-4.1-mini' }), ['gpt-4.1-mini']);
});

test('Nur serverseitig erlaubte Modelle sind auswählbar', () => {
  assert.equal(validateOpenaiChoice('openai:gpt-4.1-mini', env), 'gpt-4.1-mini');
  assert.throws(() => validateOpenaiChoice('openai:unauthorized', env), { status: 400 });
  assert.throws(() => validateOpenaiChoice('ollama:qwen', env), { status: 400 });
});

test('Ablehnung nicht erlaubter Modelle erfolgt ohne API-Zugriff', async () => {
  let called = false;
  await assert.rejects(() => callOpenai({
    choice: 'openai:other', messages, env,
    fetchImpl: async () => { called = true; throw new Error('no'); }
  }), { status: 400 });
  assert.equal(called, false);
});

test('Cloud-Komplettantwort enthält keine Schlüssel im zurückgegebenen Ergebnis', async () => {
  let call;
  const answer = await callOpenai({
    choice: 'openai:gpt-4.1-mini', messages, env,
    fetchImpl: async (url, opts) => {
      call = { url, opts };
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'Guten Morgen' } }] }) };
    }
  });
  assert.equal(answer, 'Guten Morgen');
  assert.equal(call.url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(call.opts.headers.Authorization, 'Bearer local-test-only');
  assert.equal(JSON.parse(call.opts.body).store, false);
  assert.deepEqual(JSON.parse(call.opts.body).messages, messages);
  assert.equal(answer.includes('local-test-only'), false);
});

function sse(parts) {
  return new ReadableStream({
    start(controller) {
      for (const p of parts) controller.enqueue(new TextEncoder().encode(p));
      controller.close();
    }
  });
}

test('SSE wird auch bei getrennten Netzwerk-Chunks in sicheres NDJSON konvertiert', async () => {
  const body = sse([
    'data: {"choices":[{"delta":{"content":"Ha',
    'llo "}}]}\n\n',
    'data: {"choices":[{"delta":{"content":"Welt"}}]}\n\n',
    'data: [DO',
    'NE]\n\n'
  ]);
  const result = [];
  for await (const line of normalizeOpenaiStream(body)) result.push(JSON.parse(line));
  assert.deepEqual(result, [
    { message: { content: 'Hallo ' }, done: false },
    { message: { content: 'Welt' }, done: false },
    { done: true }
  ]);
});

test('Fehlendes [DONE], kaputte Streams und überlange Ausgabe werden abgewiesen', async () => {
  for (const body of [
    sse(['data: {"choices":[{"delta":{"content":"A"}}]}\n\n']),
    sse(['data: {bad}\n\n']),
    sse(['data: {"choices":[{"delta":{"content":"' + 'X'.repeat(14000) + '"}}]}\n\n', 'data: [DONE]\n\n'])
  ]) {
    await assert.rejects(async () => {
      for await (const _ of normalizeOpenaiStream(body)) { /* drain */ }
    });
  }
});

test('Upstream-Fehler werden ohne API-Bodies oder interne Details gemeldet', async () => {
  await assert.rejects(() => callOpenai({
    choice: 'openai:gpt-4.1-mini', messages, env,
    fetchImpl: async () => ({ ok: false, status: 429, text: async () => 'SECRET MESSAGE' })
  }), { status: 429 });
});
