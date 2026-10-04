// Saved settings come from localStorage and must never break the game.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const store = {};
globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } };
const load = async (raw) => {
  if (raw === undefined) delete store['smotritel.settings']; else store['smotritel.settings'] = raw;
  return (await import('../src/core/settings.js?' + Math.random())).settings;
};
const DEFAULTS = { sens: 1, volume: 0.8, showFps: false, renderScale: 1 };

test('missing / corrupted storage -> defaults', async () => {
  for (const raw of [undefined, 'garbage', 'null', '[1,2]', '"str"']) assert.deepEqual(await load(raw), DEFAULTS, raw);
});
test('bad values fall back, numbers are clamped to slider ranges', async () => {
  assert.deepEqual(await load('{"volume":"abc","sens":"2","renderScale":7,"showFps":"yes","junk":1}'),
    { sens: 2, volume: 0.8, showFps: false, renderScale: 1 });
  assert.deepEqual(await load('{"volume":null,"sens":-5,"renderScale":0.75,"showFps":true}'),
    { sens: 0.1, volume: 0.8, showFps: true, renderScale: 0.75 });
});
