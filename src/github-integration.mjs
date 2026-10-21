// Optional, read-only GitHub bridge. Never accepts user-controlled hosts or credentials.
const REPO_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?\/[a-z\d_.-]{1,100}$/i;
const FILE_PATTERN = /^[a-z\d_@.-]+(?:\/[a-z\d_@.-]+)*$/i;
const MAX_FILE_BYTES = 256 * 1024;
const MAX_PREVIEW = 3500;
const DEFAULT_TIMEOUT_MS = 7000;

export function configuredRepositories(raw = process.env.CRYO_GITHUB_REPOS || '') {
  return [...new Set(String(raw).split(',').map(v => v.trim()).filter(v => REPO_PATTERN.test(v)))].slice(0, 12);
}

function allowedRepo(repo, allowlist) {
  if (typeof repo !== 'string' || !REPO_PATTERN.test(repo) || !allowlist.includes(repo)) {
    throw Object.assign(new Error('Repository ist nicht freigegeben.'), { status: 403 });
  }
  return repo;
}

function allowedPath(path) {
  if (typeof path !== 'string' || path.length > 160 || !FILE_PATTERN.test(path) || path.split('/').some(segment => segment === '.' || segment === '..') || !/\.(md|txt|json|ya?ml)$/i.test(path)) {
    throw Object.assign(new Error('Dateipfad nicht erlaubt.'), { status: 400 });
  }
  return path;
}

async function apiJson(url, fetchImpl, signal) {
  let response;
  try {
    response = await fetchImpl(url, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'CryoGPTCHATFREEBIE-local-bridge', 'X-GitHub-Api-Version': '2022-11-28' },
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(DEFAULT_TIMEOUT_MS)]) : AbortSignal.timeout(DEFAULT_TIMEOUT_MS)
    });
  } catch {
    throw Object.assign(new Error('GitHub ist momentan nicht erreichbar.'), { status: 503 });
  }
  if (!response.ok) {
    // Do not relay untrusted upstream error bodies to the browser.
    const status = response.status === 404 ? 404 : response.status === 403 || response.status === 429 ? 429 : 502;
    throw Object.assign(new Error(status === 404 ? 'Datei nicht gefunden oder Repository nicht öffentlich.' : 'GitHub-Anfrage fehlgeschlagen oder Rate-Limit erreicht.'), { status });
  }
  try { return await response.json(); }
  catch { throw Object.assign(new Error('Ungültige Antwort von GitHub.'), { status: 502 }); }
}

export async function readGithubFile({ repo, path, allowlist = configuredRepositories(), fetchImpl = fetch, signal }) {
  allowedRepo(repo, allowlist);
  allowedPath(path);
  // Fixed API origin. No arbitrary URLs, no private token, no write capability.
  const url = `https://api.github.com/repos/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
  const file = await apiJson(url, fetchImpl, signal);
  if (file?.type !== 'file' || file.encoding !== 'base64' || typeof file.content !== 'string' || !Number.isInteger(file.size) || file.size < 0 || file.size > MAX_FILE_BYTES) {
    throw Object.assign(new Error('Datei hat kein unterstütztes Textformat oder ist zu groß.'), { status: 422 });
  }
  let content;
  try {
    content = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.from(file.content.replace(/\s+/g, ''), 'base64'));
  } catch {
    throw Object.assign(new Error('Datei enthält keinen gültigen UTF-8-Text.'), { status: 422 });
  }
  if (Buffer.byteLength(content, 'utf8') > MAX_FILE_BYTES) {
    throw Object.assign(new Error('Datei überschreitet das Größenlimit.'), { status: 422 });
  }
  return { repo, path, content };
}

export async function githubPreview(options) {
  const { repo, path, content } = await readGithubFile(options);
  return { repo, path, text: content.slice(0, MAX_PREVIEW), truncated: content.length > MAX_PREVIEW, readonly: true };
}

export async function searchGithubSkills({ repo, query = '', allowlist = configuredRepositories(), fetchImpl = fetch, signal }) {
  if (typeof query !== 'string' || query.length > 100) throw Object.assign(new Error('Suchbegriff zu lang.'), { status: 400 });
  const { content } = await readGithubFile({ repo, path: 'skills/catalog.json', allowlist, fetchImpl, signal });
  let catalog;
  try { catalog = JSON.parse(content); }
  catch { throw Object.assign(new Error('Skill-Katalog enthält kein gültiges JSON.'), { status: 422 }); }
  const skills = Array.isArray(catalog) ? catalog : catalog?.skills;
  if (!Array.isArray(skills)) throw Object.assign(new Error('Unbekanntes Skill-Katalogformat.'), { status: 422 });
  const needle = query.trim().toLocaleLowerCase('de-DE');
  const matches = skills.filter(s => s && typeof s === 'object')
    .map(s => ({ slug: String(s.slug || '').slice(0, 100), name: String(s.name || s.slug || '').slice(0, 100), description: String(s.description || '').slice(0, 350) }))
    .filter(s => s.name && (!needle || `${s.name} ${s.slug} ${s.description}`.toLocaleLowerCase('de-DE').includes(needle)));
  return { repo, total: skills.length, matches: matches.length, results: matches.slice(0, 12), readonly: true, executable: false };
}
