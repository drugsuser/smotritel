// Entry point: builds the world, wires input, runs the loop.
import * as THREE from 'three';
import { render, scene, renderer, camera } from './core/engine.js';
import { state } from './core/state.js';
import './world/sky.js';
import './world/rocks.js';
import { updateSea } from './world/sea.js';
import { updateLighthouse } from './world/lighthouse.js';
import { updateLamproom } from './world/lamproom.js';
import { player, updatePlayer } from './player/player.js';
import { hideMenu } from './ui/menu.js';
import { setPrompt, updateFps } from './ui/hud.js';
import { findHovered, interactables, removeInteractable } from './interaction/interactables.js';
import { inventory, updateHand, SLOTS } from './items/inventory.js';
import './props/table.js';

// ---------- input ----------
let hovered = null;
addEventListener('keydown', (e) => {
  if (state.paused || e.repeat) return; // held key = one action, not auto-repeat toggling
  if (e.code === 'KeyE' && hovered) hovered.interact();
  if (e.code === 'KeyF') inventory.use();
  const n = /^Digit([1-9])$/.exec(e.code); if (n && +n[1] <= SLOTS) inventory.select(+n[1] - 1);
});
addEventListener('mousedown', (e) => { if (!state.paused && e.button === 0 && document.pointerLockElement) inventory.use(); });

// ---------- debug: #shot,yaw=1.2,pitch=-0.3,grab ----------
if (location.hash.includes('shot')) {
  hideMenu();
  const m = location.hash.match(/yaw=([-\d.]+)/); if (m) player.yaw = +m[1];
  const p = location.hash.match(/pitch=([-\d.]+)/); if (p) player.pitch = +p[1];
}
if (location.hash.includes('grab')) {
  for (const d of interactables.slice()) if (d.itemId === 'flashlight') { removeInteractable(d); scene.remove(d.object); }
  inventory.add('flashlight'); inventory.use();
}

// compile every shader up front -> no hitch when an object first comes into view
renderer.compile(scene, camera);

// ---------- loop ----------
const clock = new THREE.Clock();
// Each system runs in its own try/catch: a bug in one (e.g. a sound) must not freeze the whole
// game. Every distinct error is logged once with its stack, then the loop just keeps going.
const reported = new Set();
function safe(name, fn) {
  try { fn(); } catch (e) {
    const key = name + ': ' + (e?.message ?? e);
    if (!reported.has(key)) { reported.add(key); console.error('[frame] ' + key, e); }
  }
}
function frame() {
  requestAnimationFrame(frame); // schedule first, so even an uncaught error can't stop the loop
  const realDt = clock.getDelta(), dt = Math.min(realDt, 0.05), t = clock.elapsedTime;
  safe('fps', () => updateFps(realDt));
  safe('player', () => updatePlayer(dt));
  safe('interact', () => { hovered = state.paused ? null : findHovered(); setPrompt(hovered?.prompt()); }); // raycast only while playing
  safe('hand', () => updateHand(dt));
  safe('sea', () => updateSea(t));
  safe('lighthouse', () => updateLighthouse(t));
  safe('lamproom', () => updateLamproom(dt, player));
  safe('render', render);
}
frame();
