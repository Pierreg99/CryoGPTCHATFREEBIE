import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['hero-v2.svg', 'capabilities.svg', 'architecture-v2.svg'];
const allAssets = [...files, 'architecture.svg', 'banner-clean.svg', 'banner-neon.svg', 'banner-product.svg'];
const read = file => readFileSync(path.join(root, file), 'utf8');

function validateSimpleSvg(source) {
  assert.match(source, /^<svg\b[\s\S]*<\/svg>$/);
  assert.match(source, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(source, /viewBox="0 0 [0-9]+ [0-9]+"/);
  assert.match(source, /<title\b[^>]*>[^<]+<\/title>/);
  assert.match(source, /<desc\b[^>]*>[^<]+<\/desc>/);
  assert.doesNotMatch(source, /<script\b|<foreignObject\b|\bonload\s*=|\bonerror\s*=|xlink:href|https?:\/\/(?!www\.w3\.org)/i);
  // Ensure no accidental raw '&' can break XML parsing.
  assert.doesNotMatch(source, /&(?!amp;|lt;|gt;|quot;|apos;|#[0-9]+;|#x[0-9a-fA-F]+;)/);
  // Lightweight tag matching, no external XML dependencies required by npm test.
  const tags = [...source.matchAll(/<\/?([A-Za-z][A-Za-z0-9:-]*)\b[^>]*>/g)].map(m => m[0]);
  const stack = [];
  for (const tag of tags) {
    const name = tag.match(/^<\/?([A-Za-z][A-Za-z0-9:-]*)/)[1];
    if (tag.startsWith('</')) assert.equal(stack.pop(), name, 'unbalanced XML tag ' + tag);
    else if (!tag.endsWith('/>')) stack.push(name);
  }
  assert.deepEqual(stack, []);
  const ids = new Set([...source.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  for (const [, ref] of source.matchAll(/url\(#([^)]+)\)/g)) assert.equal(ids.has(ref), true, 'undefined SVG paint reference: ' + ref);
}

test('new README assets are self-contained, accessible and structurally valid SVG', () => {
  for (const name of allAssets) validateSimpleSvg(read('assets/readme/' + name));
});

test('README references checked-in visuals and keeps design alternatives', () => {
  const readme = read('README.md');
  for (const name of files) assert.ok(readme.includes('assets/readme/' + name), name);
  for (const name of ['banner-clean.svg', 'banner-neon.svg', 'banner-product.svg']) {
    assert.ok(readme.includes(name), 'design variant missing: ' + name);
  }
  assert.doesNotMatch(readme, /Alpha 0\.3 kann bereits/);
  assert.match(readme, /Cloud-Anfrage/);
  assert.match(readme, /Godot MCP/);
  assert.match(readme, /GitHub/);
});
