// Optional server-side OpenAI provider. Credentials never leave this module.
const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const MODEL_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,79}$/;

export class ProviderError extends Error {
  constructor(message, status = 502) { super(message); this.status = status; }
}

export function configuredOpenaiModels(env = process.env) {
  if (!env.OPENAI_API_KEY?.trim()) return [];
  return [...new Set(String(env.CRYO_OPENAI_MODELS || '')
    .split(',').map(x => x.trim()).filter(x => MODEL_RE.test(x)))].slice(0, 12);
}

export function validateOpenaiChoice(choice, env = process.env) {
  if (typeof choice !== 'string' || !choice.startsWith('openai:')) {
    throw new ProviderError('Unbekannter OpenAI-Modellbezeichner.', 400);
  }
  const name = choice.slice('openai:'.length);
  if (!configuredOpenaiModels(env).includes(name)) {
    throw new ProviderError('Dieses Cloud-Modell ist auf dem Server nicht freigegeben.', 400);
  }
  return name;
}

export async function callOpenai({ choice, messages, stream = false, signal, fetchImpl = fetch, env = process.env }) {
  const model = validateOpenaiChoice(choice, env);
  let response;
  try {
    response = await fetchImpl(ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.OPENAI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, messages, stream, store: false, max_completion_tokens: 1536 }),
      signal
    });
  } catch {
    throw new ProviderError('OpenAI-Server konnte nicht erreicht werden.', 503);
  }
  if (!response.ok) {
    const status = response.status === 429 ? 429 : response.status === 401 || response.status === 403 ? 502 : 502;
    throw new ProviderError(status === 429 ? 'Cloud-Anbieter: Anfragelimit erreicht.' : 'Cloud-Anbieter: Anfrage fehlgeschlagen.', status);
  }
  if (stream) {
    if (!response.body) throw new ProviderError('Cloud-Anbieter liefert keinen Stream.');
    return response.body;
  }
  let data;
  try { data = await response.json(); }
  catch { throw new ProviderError('Ungültige Cloud-Antwort.'); }
  const answer = data?.choices?.[0]?.message?.content;
  if (typeof answer !== 'string' || answer.length > 12000) throw new ProviderError('Cloud-Antwort ist leer oder zu lang.');
  return answer;
}

// Normalize OpenAI Server-Sent Events to the already supported Ollama NDJSON wire format.
// No tool calls are accepted; this endpoint is plain chat only.
export async function* normalizeOpenaiStream(body, { maxCharacters = 12000 } = {}) {
  const decoder = new TextDecoder();
  let pending = '', characters = 0, complete = false, totalBytes = 0;
  const parse = line => {
    if (!line.startsWith('data:')) return null;
    const payload = line.slice(5).trim();
    if (payload === '[DONE]') return { done: true };
    let event;
    try { event = JSON.parse(payload); }
    catch { throw new ProviderError('Cloud-Stream enthält ungültige Ereignisse.'); }
    if (event?.error) throw new ProviderError('Cloud-Anbieter hat den Stream abgebrochen.');
    const token = event?.choices?.[0]?.delta?.content;
    if (token === undefined || token === null) return null;
    if (typeof token !== 'string') throw new ProviderError('Cloud-Stream enthält ungültigen Text.');
    characters += token.length;
    if (characters > maxCharacters) throw new ProviderError('Cloud-Antwort überschreitet die Längenbegrenzung.');
    return { token };
  };
  for await (const chunk of body) {
    totalBytes += chunk.byteLength;
    if (totalBytes > 1024 * 1024) throw new ProviderError('Cloud-Stream überschreitet das Größenlimit.');
    pending += decoder.decode(chunk, { stream: true });
    if (pending.length > 256 * 1024) throw new ProviderError('Cloud-Stream-Ereignis ist zu groß.');
    let index;
    while ((index = pending.indexOf('\n')) !== -1) {
      const line = pending.slice(0, index).trim();
      pending = pending.slice(index + 1);
      const event = parse(line);
      if (event?.token) yield JSON.stringify({ message: { content: event.token }, done: false }) + '\n';
      if (event?.done) {
        complete = true;
        yield JSON.stringify({ done: true }) + '\n';
        return;
      }
    }
  }
  pending += decoder.decode();
  const last = parse(pending.trim());
  if (last?.done) {
    complete = true;
    yield JSON.stringify({ done: true }) + '\n';
  }
  if (!complete) throw new ProviderError('Cloud-Stream wurde unvollständig beendet.');
}
