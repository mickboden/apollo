// Superpowers is an optional upstream: referenced only conditionally, never in the Tweak lane, and doctor reports it as information.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { runChecks, formatChecks, superpowersCheck, SUPERPOWERS_SKILLS } from '../scripts/lib/doctor.mjs';
import { locateSkill } from '../scripts/lib/migrate.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const tmp = () => mkdtempSync(join(tmpdir(), 'apollo-sp-'));
const walk = (d) => readdirSync(join(root, d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.md') ? [join(d, e.name)] : []));
// Every Markdown file Apollo loads or ships (the Impeccable-derived screens core never names Superpowers).
const FILES = [...walk('skills'), ...walk('agents'), 'README.md', 'CREDITS.md'];
const lines = (p) => read(p).split('\n').filter((l) => /superpowers/i.test(l));
// A fake Claude Code plugin cache with the Superpowers skills, the way `claude plugin install` lays them out.
const fakeSuperpowers = (skills = SUPERPOWERS_SKILLS) => {
  const home = tmp();
  for (const s of skills) {
    const d = join(home, '.claude/plugins/cache/superpowers-marketplace/superpowers/5.0.0/skills', s);
    mkdirSync(d, { recursive: true }); writeFileSync(join(d, 'SKILL.md'), `---\nname: ${s}\n---\n`);
  }
  return home;
};

test('every Superpowers reference in the package is conditional ("if installed")', () => {
  // Sections that open with a conditional sentence cover every line under them.
  const sectionOf = (f, l) => { const t = read(f); const i = t.indexOf(l); return t.lastIndexOf('\n#', i); };
  const conditionalSection = (f, l) => {
    const head = read(f).slice(sectionOf(f, l), sectionOf(f, l) + 400);
    return /### Upstream skills\n\nApollo works on its own\. When these are installed/.test(head) || /## Process skills: Superpowers\n\nWhen the Superpowers plugin is installed/.test(head);
  };
  const unconditional = [];
  for (const f of FILES) {
    for (const l of lines(f)) {
      if (/^#/.test(l) || conditionalSection(f, l)) continue;
      if (/Superpowers\*\* by Jesse Vincent/.test(l)) continue; // credit line
      if (!/if installed|is installed\b|whether the optional Superpowers|^When installed, these skills/i.test(l)) unconditional.push(`${f}: ${l.trim().slice(0, 100)}`);
    }
  }
  assert.deepEqual(unconditional, []);
  const up = read('skills/director/references/upstream.md');
  assert.match(up, /## Process skills: Superpowers\n\nWhen the Superpowers plugin is installed/);
  assert.match(up, /Not installed: Apollo's own steps cover each point/);
});

test('upstream.md maps every approved Superpowers skill and states the conflict rule', () => {
  const up = read('skills/director/references/upstream.md');
  for (const s of SUPERPOWERS_SKILLS) assert.match(up, new RegExp(`^\\|[^\\n]*\`${s}\``, 'm'), s);
  assert.match(up, /\*\*Apollo's rules win\.\*\*/);
  assert.match(up, /never adds a question round in Tweak or Fix/);
  assert.match(up, /never raises a fix-loop cap/);
  assert.match(up, /never holds up a hand-over/);
});

test('Tweak stays free of Superpowers: tweak.md has none; SKILL.md only excludes Tweak, in a few lines', () => {
  assert.doesNotMatch(read('skills/director/references/lanes/tweak.md'), /superpowers/i);
  const sk = lines('skills/director/SKILL.md');
  assert.ok(sk.length <= 5, `SKILL.md has ${sk.length} Superpowers lines; keep the always-loaded file lean`);
  assert.ok(sk.join(' ').length <= 1600, 'Superpowers lines in SKILL.md stay short');
  for (const l of sk.filter((x) => /Tweak/.test(x))) assert.match(l, /never in Tweak|outside Tweak|beyond Tweak|in Tweak or Fix/, l);
  assert.ok(sk.some((l) => /never in Tweak|outside Tweak/.test(l)), 'SKILL.md says Superpowers does not apply to Tweak');
});

test('process skills land where the approved mapping puts them', () => {
  const sk = read('skills/director/SKILL.md');
  assert.match(sk, /New, Explore and multi-screen builds run `superpowers:brainstorming` and `superpowers:writing-plans`[^\n]*never as an extra round/);
  assert.match(sk, /`superpowers:dispatching-parallel-agents` and `superpowers:subagent-driven-development`/);
  assert.match(sk, /`superpowers:receiving-code-review`[^\n]*override with its written reason/);
  assert.match(sk, /## 8\. Hand-over[\s\S]*`superpowers:verification-before-completion`[\s\S]*Push, deploy or publish only on an explicit go/);
  assert.match(sk, /`superpowers:using-git-worktrees`[^\n]*`superpowers:finishing-a-development-branch`/);
  assert.match(read('skills/director/references/lanes/fix.md'), /superpowers:systematic-debugging/);
  assert.match(read('skills/director/references/gates.md'), /## The loop[\s\S]*superpowers:receiving-code-review[\s\S]*superpowers:systematic-debugging[^\n]*Neither skill raises the cap/);
  assert.match(read('skills/director/references/lanes/new.md'), /superpowers:brainstorming[^\n]*a clear brief gets none[^\n]*superpowers:writing-plans/);
  assert.match(read('skills/director/references/lanes/explore.md'), /superpowers:brainstorming[^\n]*without an extra question round/);
  assert.match(read('agents/screens.md'), /only if the project already has them[^\n]*superpowers:test-driven-development/);
  assert.match(read('agents/screens.md'), /Loop at most twice yourself[^\n]*superpowers:systematic-debugging/);
  for (const n of ['refine', 'replicate', 'review', 'tweak']) assert.doesNotMatch(read(`skills/director/references/lanes/${n}.md`), /brainstorming|writing-plans/, n);
});

test('Superpowers never raises a loop cap: no lane or gate allows more than 2 loops', () => {
  for (const f of ['skills/director/references/gates.md', 'skills/director/references/upstream.md', 'skills/director/SKILL.md']) {
    assert.doesNotMatch(read(f), /at most 3|3 loops|three loops|more loops/i, f);
  }
});

test('README lists superpowers under Upstream skills with the conflict rule', () => {
  const r = read('README.md');
  const section = r.split('### Upstream skills')[1].split('\n## ')[0];
  assert.match(section, /^- \*\*process:\*\* superpowers \(systematic-debugging[^\n]*\)\. Apollo's lanes, loop caps, taste, profile and gates still win: it never adds a question round to a Tweak or Fix, never raises a loop cap and never holds up a hand-over\.$/m);
});

test('locate accepts a plugin namespace and requires that plugin inside the cache', () => {
  const home = fakeSuperpowers(['systematic-debugging']);
  assert.match(locateSkill('superpowers:systematic-debugging', { home }), /superpowers\/5\.0\.0\/skills\/systematic-debugging$/);
  assert.match(locateSkill('systematic-debugging', { home }), /systematic-debugging$/);
  assert.equal(locateSkill('other-plugin:systematic-debugging', { home }), null);
  assert.equal(locateSkill('superpowers:brainstorming', { home }), null);
  assert.equal(locateSkill('superpowers:', { home }), null);
  const loose = tmp(); mkdirSync(join(loose, '.claude/skills/brainstorming'), { recursive: true }); writeFileSync(join(loose, '.claude/skills/brainstorming/SKILL.md'), 'x');
  assert.equal(locateSkill('superpowers:brainstorming', { home: loose }), join(loose, '.claude/skills/brainstorming'));
});

test('doctor: Superpowers installed is reported as info with a count, never blocking', async () => {
  const home = fakeSuperpowers();
  const c = superpowersCheck({ home });
  assert.equal(c.status, 'info'); assert.equal(c.blocking, false);
  assert.match(c.detail, new RegExp(`installed: ${SUPERPOWERS_SKILLS.length} of ${SUPERPOWERS_SKILLS.length}`));
  const partial = superpowersCheck({ home: fakeSuperpowers(['systematic-debugging', 'brainstorming']) });
  assert.match(partial.detail, /installed: 2 of 10/);
  const checks = await runChecks({ env: { APOLLO_PROFILES_DIR: tmp(), HOME: home }, chrome: false, findChromeFn: () => '/fake/chrome' });
  const sp = checks.find((x) => x.name === 'superpowers');
  assert.equal(sp.status, 'info');
  assert.match(formatChecks(checks), /info {2}superpowers {3}installed/);
  assert.match(formatChecks(checks), /doctor: ready/);
});

test('doctor: Superpowers missing is info, not a warning or failure; a broken lookup is still info', async () => {
  const home = tmp();
  const checks = await runChecks({ env: { APOLLO_PROFILES_DIR: tmp(), HOME: home }, chrome: false, findChromeFn: () => '/fake/chrome' });
  const sp = checks.find((x) => x.name === 'superpowers');
  assert.equal(sp.status, 'info'); assert.equal(sp.blocking, false); assert.equal(sp.fix, '');
  assert.match(sp.detail, /not installed \(optional/);
  assert.ok(!checks.some((x) => x.blocking));
  const broken = superpowersCheck({ home, locateFn: () => { throw new Error('EACCES'); } });
  assert.equal(broken.status, 'info'); assert.equal(broken.blocking, false); assert.match(broken.detail, /could not check/);
});

test('cli doctor --json includes the superpowers check for both cases', () => {
  for (const [home, re] of [[tmp(), /not installed/], [fakeSuperpowers(), /installed: 10 of 10/]]) {
    const r = spawnSync(process.execPath, [join(root, 'scripts/cli.mjs'), 'doctor', '--json', '--skip-chrome'], { encoding: 'utf8', env: { ...process.env, HOME: home, APOLLO_PROFILES_DIR: tmp() } });
    const sp = JSON.parse(r.stdout).find((x) => x.name === 'superpowers');
    assert.equal(sp.status, 'info'); assert.match(sp.detail, re);
  }
});
