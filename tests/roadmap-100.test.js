import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roadmap = readFileSync(path.join(root, 'docs/roadmap/ROADMAP-100.md'), 'utf8');
const research = readFileSync(path.join(root, 'docs/roadmap/RESEARCH.md'), 'utf8');
const readme = readFileSync(path.join(root, 'README.md'), 'utf8');

test('Exactly 100 unique consecutive milestones from v0.1 through v10.0', () => {
  const labels = [...roadmap.matchAll(/^#### (?:✅|🟡|⬜) v([0-9]+\.[0-9]) · /gm)].map(x => x[1]);
  const expected = Array.from({ length: 100 }, (_, i) => ((i + 1) / 10).toFixed(1));
  assert.equal(labels.length, 100);
  assert.deepEqual(labels, expected);
});

test('Each milestone specifies an artifact and acceptance gate', () => {
  const entries = roadmap.split(/^#### (?:✅|🟡|⬜) v[0-9]+\.[0-9] · .*$/gm).slice(1);
  assert.equal(entries.length, 100);
  for (const entry of entries) {
    assert.match(entry, /^\n\n\*\*Lieferobjekt:\*\*/);
    assert.match(entry, /\*\*Abnahme:\*\*/);
  }
});

test('README links roadmap and source audit without claiming future delivery', () => {
  assert.match(readme, /docs\/roadmap\/ROADMAP-100\.md/);
  assert.match(readme, /docs\/roadmap\/RESEARCH\.md/);
  assert.match(research, /keine.*Release-Tags|keine GitHub Releases/i);
  assert.match(roadmap, /keine.+Zusage|kein Versprechen/);
});
