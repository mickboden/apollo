// Small seeded random helpers (mulberry32), so generated cases and A/B sides are reproducible.
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Turn any string or number into a 32-bit seed (FNV-1a).
export function seedOf(x) {
  let h = 0x811c9dc5;
  for (const ch of String(x)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

export const pick = (rand, xs) => xs[Math.floor(rand() * xs.length)];

export function shuffle(rand, xs) {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Pick one item, preferring those with the lowest weight (for example: used least often so far).
export function pickLeastUsed(rand, xs, usage) {
  const min = Math.min(...xs.map((x) => usage(x)));
  return pick(rand, xs.filter((x) => usage(x) === min));
}
