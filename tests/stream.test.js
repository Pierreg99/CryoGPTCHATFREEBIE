import test from 'node:test';
import assert from 'node:assert/strict';
import { consumeOllamaStream } from '../src/stream.js';

const encoded = text => new TextEncoder().encode(text);
function bodyFrom(parts) {
  return new ReadableStream({
    start(controller) {
      for (const part of parts) controller.enqueue(encoded(part));
      controller.close();
    }
  });
}

test('NDJSON-Ausgabe wird über geteilte Netzwerkpakete korrekt aufgebaut', async () => {
  const frames = [
    JSON.stringify({ message: { content: 'Hal' }, done: false }) + '\n',
    JSON.stringify({ message: { content: 'lo 🌍' }, done: false }) + '\n',
    JSON.stringify({ done: true }) + '\n'
  ].join('');
  // Deliberately split a UTF-8 multibyte sequence across chunks.
  const bytes = encoded(frames);
  const chunks = [bytes.subarray(0, 12), bytes.subarray(12, 52), bytes.subarray(52, 67), bytes.subarray(67)];
  const seen = [];
  const answer = await consumeOllamaStream(new ReadableStream({
    start(c) { for (const chunk of chunks) c.enqueue(chunk); c.close(); }
  }), { onToken: (full, token) => seen.push({ full, token }) });
  assert.equal(answer, 'Hallo 🌍');
  assert.deepEqual(seen.map(x => x.full), ['Hal', 'Hallo 🌍']);
});

test('ungültige JSON-Linien werden abgelehnt', async () => {
  await assert.rejects(() => consumeOllamaStream(bodyFrom(['{"message":\n'])), /Stream-JSON/);
});

test('ein vorzeitig beendeter Stream zählt nicht als fertige Antwort', async () => {
  await assert.rejects(() => consumeOllamaStream(bodyFrom([
    JSON.stringify({ message: { content: 'teilweise' }, done: false }) + '\n'
  ])), /unvollständig/);
});

test('Fehlermeldungen aus dem Modellstream werden angezeigt', async () => {
  await assert.rejects(() => consumeOllamaStream(bodyFrom([
    JSON.stringify({ error: 'Modell wurde entladen' }) + '\n'
  ])), /Modell wurde entladen/);
});

test('Antwortlimits verhindern unendlich lange Nachrichten', async () => {
  await assert.rejects(() => consumeOllamaStream(bodyFrom([
    JSON.stringify({ message: { content: 'sehr lang' }, done: false }) + '\n',
    JSON.stringify({ done: true }) + '\n'
  ]), { maxCharacters: 4 }), /zu lang/);
});

test('leere Abschlussmeldung wird als gültiger Stream akzeptiert', async () => {
  const answer = await consumeOllamaStream(bodyFrom([JSON.stringify({ done: true }) + '\n']));
  assert.equal(answer, '');
});
