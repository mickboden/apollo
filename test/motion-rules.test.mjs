import { test } from 'node:test';
import assert from 'node:assert/strict';
import { violationsFor, isOneAxisReveal, axisScales, transformExtent } from '../scripts/lib/motion.mjs';

const anim = (o) => ({ name: 'a', properties: ['transform'], durationMs: 200, delayMs: 0, easing: 'cubic-bezier(.22,1,.36,1)', keyframeEasings: [], transforms: [], exemption: null, ...o });
const rules = (v) => v.map((x) => x.rule);

test('axisScales reads matrix, scale, scaleX and scaleY', () => {
  assert.deepEqual(axisScales(['matrix(0, 0, 0, 1, 0, 0)', 'scaleY(0.5)', 'scale(2, 3)', 'none']), [{ sx: 0, sy: 1 }, { sx: 1, sy: 0.5 }, { sx: 2, sy: 3 }, { sx: 1, sy: 1 }]);
});

test('isOneAxisReveal: a line drawing along one axis yes; zooms, overshoots and two-axis grows no', () => {
  assert.ok(isOneAxisReveal(['scaleX(0)', 'scaleX(1)']));
  assert.ok(isOneAxisReveal(['matrix(1, 0, 0, 0, 0, 0)', 'matrix(1, 0, 0, 1, 0, 0)']));
  assert.ok(!isOneAxisReveal(['scale(0.6)', 'scale(1)']));
  assert.ok(!isOneAxisReveal(['scaleX(0)', 'scaleX(1.2)']));
  assert.ok(!isOneAxisReveal(['scale(0, 0.5)', 'scale(1, 1)']));
  assert.ok(!isOneAxisReveal(['scaleX(1)']));
});

test('calm: a one-axis scale reveal within 240ms is allowed; a uniform zoom is still a scale violation', () => {
  assert.deepEqual(violationsFor([anim({ transforms: ['scaleX(0)', 'scaleX(1)'] })], 'calm'), []);
  assert.ok(rules(violationsFor([anim({ transforms: ['scale(0.6)', 'scale(1)'] })], 'calm')).includes('scale'));
  assert.ok(rules(violationsFor([anim({ transforms: ['scaleX(0)', 'scaleX(1)'], durationMs: 400 })], 'calm')).includes('duration'));
});

test('calm: width/height animate only for a marked data reveal, and the message says how to fix it', () => {
  const plain = violationsFor([anim({ properties: ['width'], transforms: [] })], 'calm');
  assert.ok(rules(plain).includes('property'));
  assert.match(plain[0].detail, /scaleX\/scaleY|data-motion="reveal"/);
  assert.deepEqual(violationsFor([anim({ properties: ['height'], transforms: [], exemption: 'reveal', durationMs: 900 })], 'calm'), []);
});

test('still is unchanged: no transform at all', () => {
  assert.ok(rules(violationsFor([anim({ transforms: ['scaleX(0)', 'scaleX(1)'], durationMs: 120 })], 'still')).includes('property'));
});

test('transformExtent now sees vertical matrix scale too', () => {
  assert.equal(transformExtent(['matrix(1, 0, 0, 0.5, 0, 0)']).scaleMin, 0.5);
});
