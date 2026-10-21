import test from 'node:test';
import assert from 'node:assert/strict';
import { configuredRepositories, githubPreview, readGithubFile, searchGithubSkills } from '../src/github-integration.mjs';

const repo = 'Pierreg99/CryoGPTCHATFREEBIE';
const allowlist = [repo];
function fakeApi(data, status = 200) {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return { ok: status === 200, status, json: async () => ({
      type: 'file', encoding: 'base64', size: Buffer.byteLength(data), content: Buffer.from(data).toString('base64')
    }) };
  };
  return { fetchImpl, requests };
}

test('Repository-Freigabeliste akzeptiert ausschließlich gültige explizite Einträge', () => {
  assert.deepEqual(configuredRepositories(' Pierreg99/CryoGPTCHATFREEBIE,wrong input,Pierreg99/CryoGPTCHATFREEBIE,horos/fork '), [repo, 'horos/fork']);
  assert.deepEqual(configuredRepositories(''), []);
});

test('Read-only GitHub Vorschau beschränkt Ausgabe und nutzt ausschließlich festen API-Host', async () => {
  const remote = fakeApi('A'.repeat(4000));
  const preview = await githubPreview({ repo, path: 'README.md', allowlist, fetchImpl: remote.fetchImpl });
  assert.equal(preview.text.length, 3500);
  assert.equal(preview.truncated, true);
  assert.equal(preview.readonly, true);
  assert.equal(remote.requests[0].url, 'https://api.github.com/repos/Pierreg99/CryoGPTCHATFREEBIE/contents/README.md');
  assert.equal(remote.requests[0].options.headers.Authorization, undefined);
});

test('Fremde Repos, Traversal und manipulierte URLs werden vor Netzwerkaufruf blockiert', async () => {
  const remote = fakeApi('hello');
  for (const [r, p] of [
    ['evil/foreign', 'README.md'], [repo, '../.env'], [repo, 'docs/../README.md'],
    [repo, 'https://evil.example/README.md'], [repo, '.env'], [repo, 'server.mjs'], [repo, 'test%2FREADME.md']
  ]) {
    await assert.rejects(() => readGithubFile({ repo: r, path: p, allowlist, fetchImpl: remote.fetchImpl }));
  }
  assert.equal(remote.requests.length, 0);
});

test('Katalogsuche liefert nur Treffer, keine ausführbaren Skills', async () => {
  const skills = { count: 3, skills: [
    { slug: 'agent-profile-builder', description: 'Build agent profiles' },
    { slug: 'better-design', description: 'Improve UI layouts' },
    { slug: 'agi3-skill-curator', description: 'Search and route skills' }
  ] };
  const remote = fakeApi(JSON.stringify(skills));
  const result = await searchGithubSkills({ repo, query: 'design', allowlist, fetchImpl: remote.fetchImpl });
  assert.equal(result.total, 3);
  assert.equal(result.matches, 1);
  assert.equal(result.results[0].name, 'better-design');
  assert.equal(result.executable, false);
});

test('GitHub API-Fehler werden ohne Upstream-Inhalte gemeldet', async () => {
  const remote = fakeApi('error', 404);
  await assert.rejects(() => readGithubFile({ repo, path: 'README.md', allowlist, fetchImpl: remote.fetchImpl }), { status: 404 });
});

test('Übergröße und manipulierte Katalogformate werden abgewiesen', async () => {
  const huge = fakeApi('X'.repeat(270000));
  await assert.rejects(() => readGithubFile({ repo, path: 'README.md', allowlist, fetchImpl: huge.fetchImpl }), { status: 422 });
  const bad = fakeApi('{bad json');
  await assert.rejects(() => searchGithubSkills({ repo, allowlist, fetchImpl: bad.fetchImpl }), { status: 422 });
});
