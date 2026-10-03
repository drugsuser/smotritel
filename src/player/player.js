// First-person player on the gallery: look, walk, collisions.
import * as THREE from 'three';
import { camera, cvs } from '../core/engine.js';
import { state, keys } from '../core/state.js';
import { settings } from '../core/settings.js';
import { colliders } from '../core/colliders.js';
import { stepSound } from '../core/audio.js';
import { FLOOR_Y } from '../world/lighthouse.js';

export const player = { a: Math.PI * 0.5, r: 3.4, yaw: 2.6, pitch: -0.2, bob: 0, moving: false };
const BASE_SENS = 0.0022;
const SPEED = 1.8, EYE = 1.6;
const STEP_RATE = 1.7 * Math.PI; // head-bob speed; one footstep per PI -> 1.7 steps/s, stride ~1.06 m
const R_MIN = 3.0, R_MAX = 4.95; // walkable ring between lamp room and railing

export function look(dx, dy) {
  const k = BASE_SENS * settings.sens;
  player.yaw -= dx * k; player.pitch = THREE.MathUtils.clamp(player.pitch - dy * k, -1.45, 1.45);
}

let dragging = false;
cvs.addEventListener('mousedown', () => dragging = true);
addEventListener('mouseup', () => dragging = false);
addEventListener('mousemove', (e) => {
  if (state.paused) return;
  if (document.pointerLockElement === cvs || dragging) look(e.movementX, e.movementY);
});

const pos = new THREE.Vector3(Math.cos(player.a) * player.r, 0, Math.sin(player.a) * player.r);
const fw = new THREE.Vector3(), right = new THREE.Vector3(), mv = new THREE.Vector3(); // reused every frame
export function updatePlayer(dt) {
  if (state.paused) { for (const k in keys) keys[k] = false; }
  const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  const s = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  fw.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  right.set(-fw.z, 0, fw.x);
  mv.copy(fw).multiplyScalar(f).addScaledVector(right, s);
  player.moving = mv.lengthSq() > 0;
  if (player.moving) {
    mv.normalize().multiplyScalar(SPEED * dt); pos.add(mv);
    const before = Math.floor(player.bob / Math.PI);
    player.bob += dt * STEP_RATE;
    if (Math.floor(player.bob / Math.PI) !== before) stepSound(); // one step per half bob cycle
  }
  const r = Math.hypot(pos.x, pos.z);
  if (r > 0) pos.multiplyScalar(THREE.MathUtils.clamp(r, R_MIN, R_MAX) / r);
  for (const c of colliders) {
    const dx = pos.x - c.x, dz = pos.z - c.z, d = Math.hypot(dx, dz), min = c.r + 0.25;
    if (d < min && d > 0) { pos.x = c.x + dx / d * min; pos.z = c.z + dz / d * min; }
  }
  camera.position.set(pos.x, FLOOR_Y + EYE + (player.moving ? Math.sin(player.bob) * 0.05 : 0), pos.z);
  camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
}
