// First-person player on the gallery: look, walk, collisions.
import * as THREE from 'three';
import { camera, cvs } from '../core/engine.js';
import { state, keys } from '../core/state.js';
import { settings } from '../core/settings.js';
import { resolve, addBound, PLAYER_R } from '../core/colliders.js';
import { stepSound } from '../core/audio.js';
import { FLOOR_Y } from '../world/lighthouse.js';

export const player = { a: Math.PI * 0.5, r: 3.4, yaw: 2.6, pitch: -0.2, bob: 0, moving: false, x: 0, z: 0 }; // x/z = floor position, updated every frame
const BASE_SENS = 0.0022;
const SPEED = 1.8, EYE = 1.6;
const STEP_RATE = 1.7 * Math.PI; // head-bob speed; one footstep per PI -> 1.7 steps/s, stride ~1.06 m
const R_MAX = 4.95; // railing: the player's centre stays within this radius
addBound(0, 0, R_MAX + PLAYER_R); // bound radius is the player's outer edge

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
const fw = new THREE.Vector3(), right = new THREE.Vector3(), mv = new THREE.Vector3(), prev = new THREE.Vector3(); // reused every frame
export function updatePlayer(dt) {
  if (state.paused) { for (const k in keys) keys[k] = false; }
  const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  const s = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  fw.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  right.set(-fw.z, 0, fw.x);
  mv.copy(fw).multiplyScalar(f).addScaledVector(right, s);
  prev.copy(pos);
  if (mv.lengthSq() > 0) { mv.normalize().multiplyScalar(SPEED * dt); pos.add(mv); }
  resolve(pos, prev); // walls, door leaf, props, railing (see core/colliders.js)
  // steps/bob follow the distance actually walked after collisions:
  // pushing into the railing = silence, sliding along it = slower steps
  const walked = Math.hypot(pos.x - prev.x, pos.z - prev.z);
  player.moving = walked > SPEED * dt * 0.1;
  if (player.moving) {
    const before = Math.floor(player.bob / Math.PI);
    player.bob += STEP_RATE * walked / SPEED;
    if (Math.floor(player.bob / Math.PI) !== before) stepSound(); // one step per half bob cycle
  }
  player.x = pos.x; player.z = pos.z;
  camera.position.set(pos.x, FLOOR_Y + EYE + (player.moving ? Math.sin(player.bob) * 0.05 : 0), pos.z);
  camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
}
