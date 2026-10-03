// Animated low-poly sea.
import * as THREE from 'three';
import { scene } from '../core/engine.js';
import { M } from './materials.js';

// ---------- sea ----------
const SEA_N = 90;
const seaGeo = new THREE.PlaneGeometry(1400, 1400, SEA_N, SEA_N); seaGeo.rotateX(-Math.PI / 2);
const sea = new THREE.Mesh(seaGeo, M.sea); scene.add(sea);
const seaBase = seaGeo.attributes.position.array.slice();
export function updateSea(t) {
  const p = seaGeo.attributes.position.array;
  for (let i = 0; i < p.length; i += 3) {
    const x = seaBase[i], z = seaBase[i + 2];
    p[i + 1] = Math.sin(x * 0.045 + t * 0.9) * 0.9 + Math.sin(z * 0.06 - t * 1.1) * 0.7 + Math.sin((x + z) * 0.11 + t * 1.7) * 0.3;
  }
  seaGeo.attributes.position.needsUpdate = true;
}
