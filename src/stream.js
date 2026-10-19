// Read Ollama's newline-delimited JSON stream using only web-standard APIs.
// The same parser works in modern browsers and Node.js unit tests.
export async function consumeOllamaStream(body, { onToken = () => {}, signal, maxCharacters = 12000 } = {}) {
  if (!body || typeof body.getReader !== 'function') throw new Error('Kein Antwort-Stream verfügbar.');
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = '', result = '', completed = false;
  function processLine(line) {
    if (!line.trim()) return;
    let event;
    try { event = JSON.parse(line); }
    catch { throw new Error('Ollama hat ungültiges Stream-JSON gesendet.'); }
    if (!event || typeof event !== 'object') throw new Error('Ungültiges Stream-Ereignis.');
    if (typeof event.error === 'string') throw new Error(event.error.slice(0, 200));
    const token = event.message?.content;
    if (token !== undefined && typeof token !== 'string') throw new Error('Ungültiger Ollama-Textbaustein.');
    if (token) {
      result += token;
      if (result.length > maxCharacters) throw new Error('Antwort ist zu lang. Bitte eine kürzere Antwort anfordern.');
      onToken(result, token);
    }
    if (event.done === true) completed = true;
  }
  function feed(text) {
    pending += text;
    let newline;
    while ((newline = pending.indexOf('\n')) !== -1) {
      const line = pending.slice(0, newline).trim();
      pending = pending.slice(newline + 1);
      if (line.length > 1024 * 1024) throw new Error('Stream-Ereignis zu groß.');
      processLine(line);
    }
    if (pending.length > 1024 * 1024) throw new Error('Stream-Ereignis zu groß.');
  }
  try {
    while (!completed) {
      if (signal?.aborted) throw signal.reason || new DOMException('Abgebrochen', 'AbortError');
      const next = await reader.read();
      if (next.done) {
        feed(decoder.decode());
        if (pending.trim()) processLine(pending.trim());
        break;
      }
      feed(decoder.decode(next.value, { stream: true }));
    }
    if (!completed) throw new Error('Ollama hat die Antwort unvollständig übertragen.');
    return result;
  } finally {
    // Release the connection even when Ollama reports "done" before closing its stream.
    try { await reader.cancel(); } catch { /* stream may already be cancelled */ }
    reader.releaseLock();
  }
}
