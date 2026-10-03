// Island under the lighthouse + rocks and sea stacks around it.
import * as THREE from 'three';
import { scene, rnd } from '../core/engine.js';
import { M } from './materials.js';

// ---------- rocks ----------
function rockGeo(r, detail = 1, squash = 0.7) {
  const g = new THREE.IcosahedronGeometry(r, detail); const p = g.attributes.position;
  const seed = Math.random() * 1000, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const k = Math.sin(Math.round(v.x * 10) * 12.9898 + Math.round(v.y * 10) * 78.233 + Math.round(v.z * 10) * 37.719 + seed) * 43758.5453;
    const n = 0.75 + 0.5 * (k - Math.floor(k));
    v.multiplyScalar(n); v.y *= squash; p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}
export const rocks = new THREE.Group(); scene.add(rocks);
// island under the lighthouse
for (let i = 0; i < 14; i++) {
  const a = (i / 14) * Math.PI * 2 + rnd(-0.2, 0.2), d = rnd(4, 11);
  const m = new THREE.Mesh(rockGeo(rnd(4, 7.5), 1, rnd(0.5, 0.8)), M.stone);
  m.position.set(Math.cos(a) * d, rnd(-1, 1.5), Math.sin(a) * d); m.rotation.y = rnd(0, 6); rocks.add(m);
}
{ const base = new THREE.Mesh(rockGeo(9, 1, 0.45), M.stone); base.position.y = 0.5; rocks.add(base); }
// scattered sea rocks / sea stacks
for (let i = 0; i < 70; i++) {
  const a = rnd(0, Math.PI * 2), d = rnd(18, 260);
  const big = Math.random() < 0.18;
  const r = big ? rnd(5, 12) : rnd(1, 4.5);
  const m = new THREE.Mesh(rockGeo(r, big ? 1 : 0, big ? rnd(1.2, 2.2) : rnd(0.5, 1)), M.stone);
  m.position.set(Math.cos(a) * d, big ? r * 0.6 : rnd(-0.6, 0.4), Math.sin(a) * d); m.rotation.y = rnd(0, 6); rocks.add(m);
}
