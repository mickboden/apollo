import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cli = (...a) => spawnSync(process.execPath, [join(root, 'scripts/cli.mjs'), ...a], { encoding: 'utf8' });
const COMMANDS = 'doctor progress context profile project learn lint render motion privacy board migrate locate eval-deck'.split(' ');

test('cli --help exits 0 and lists every command', () => {
  const r = cli('--help');
  assert.equal(r.status, 0);
  for (const c of COMMANDS) assert.match(r.stdout, new RegExp(`\\b${c}\\b`), c);
});

test('unknown command exits 2', () => {
  assert.equal(cli('frobnicate').status, 2);
});

test('plugin.json is valid', () => {
  const p = JSON.parse(readFileSync(join(root, '.claude-plugin/plugin.json'), 'utf8'));
  assert.equal(p.name, 'apollo');
  assert.equal(p.license, 'Apache-2.0');
  assert.match(p.version, /^\d+\.\d+\.\d+$/);
});
