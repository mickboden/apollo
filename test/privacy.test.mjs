import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scanPrivacy } from '../scripts/lib/privacy.mjs';
import { profilesRoot } from '../scripts/lib/profiles.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const AT = '@';
const tmp = () => mkdtempSync(join(tmpdir(), 'apollo-priv-'));
const one = (content, opts = {}) => { const d = tmp(); writeFileSync(join(d, 'f.md'), content); return scanPrivacy(d, opts); };

test('email', () => {
  const f = one(`Contact: someone${AT}company.io please`);
  assert.equal(f[0].rule, 'email');
  assert.equal(f[0].line, 1);
});

test('package versions are not emails', () => {
  assert.deepEqual(one(`load react${AT}18.3.1 from the CDN`), []);
});

test('attribution email still flags (no allow-list in v1)', () => {
  assert.equal(one(`Co-Authored-By: Bot <noreply${AT}anthropic.com>`)[0].rule, 'email');
});

test('home-path', () => {
  for (const p of ['/' + 'Users/alex/projects', '/' + 'home/alex/x', 'C:\\' + 'Users\\alex\\x']) assert.equal(one(`see ${p}`)[0]?.rule, 'home-path', p);
});

test('api-key', () => {
  for (const k of ['sk-' + 'a'.repeat(24), 'ghp_' + 'b'.repeat(32), 'AKIA' + 'C'.repeat(16), 'xox' + 'b-123-abc']) assert.equal(one(`key ${k}`)[0]?.rule, 'api-key', k);
});

test('denylist words match case-insensitively', () => {
  const d = tmp();
  const deny = join(d, 'deny.txt');
  writeFileSync(deny, '# comment\nNorthwind\nsecret-client.io\n\n');
  const f = one('We built this for NORTHWIND.\nHosted on secret-client.io today.\nThe weather is calm.', { denylistPath: deny });
  assert.deepEqual(f.map((x) => [x.rule, x.line]), [['denylist', 1], ['denylist', 2]]);
});

test('missing denylist warns and continues', () => {
  const r = spawnSync(process.execPath, [join(here, '../scripts/cli.mjs'), 'privacy', tmp()], { encoding: 'utf8', env: { ...process.env, APOLLO_PROFILES_DIR: tmp() } });
  assert.equal(r.status, 0);
  assert.match(r.stderr, /no denylist/);
});

test('ignored folders are skipped', () => {
  const d = tmp();
  for (const sub of ['node_modules', '.git']) { spawnSync('mkdir', ['-p', join(d, sub)]); writeFileSync(join(d, sub, 'x.md'), `a${AT}b.com`); }
  assert.deepEqual(scanPrivacy(d), []);
});

test('package self-scan is clean', () => {
  const deny = join(profilesRoot(), 'private-denylist.txt');
  const allow = join(profilesRoot(), 'private-allowlist.txt');
  const f = scanPrivacy(repoRoot, { ...(existsSync(deny) && { denylistPath: deny }), ...(existsSync(allow) && { allowlistPath: allow }) });
  assert.deepEqual(f.map((x) => `${x.rule} ${x.file}:${x.line}`), []);
});
