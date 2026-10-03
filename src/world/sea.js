// Animated low-poly sea. Waves are computed on the GPU (vertex shader),
// so the CPU does nothing per frame except bump the time uniform.
import * as THREE from 'three';
import { scene } from '../core/engine.js';
import { M } from './materials.js';

const SEA_N = 90;
const seaGeo = new THREE.PlaneGeometry(1400, 1400, SEA_N, SEA_N); seaGeo.rotateX(-Math.PI / 2);
const sea = new THREE.Mesh(seaGeo, M.sea);
sea.frustumCulled = false; // waves move vertices on the GPU, bounds stay flat
scene.add(sea);

const uTime = { value: 0 };
const prev = M.sea.onBeforeCompile; // keep the PS1 affine-texture patch
M.sea.onBeforeCompile = (s, r) => {
  prev?.(s, r);
  s.uniforms.uTime = uTime;
  s.vertexShader = s.vertexShader
    .replace('#include <common>', '#include <common>\nuniform float uTime;')
    .replace('#include <begin_vertex>', `#include <begin_vertex>
      float wx = transformed.x, wz = transformed.z;
      transformed.y += sin(wx * 0.045 + uTime * 0.9) * 0.9
                     + sin(wz * 0.06 - uTime * 1.1) * 0.7
                     + sin((wx + wz) * 0.11 + uTime * 1.7) * 0.3;`);
};
M.sea.customProgramCacheKey = () => 'sea-gpu-waves';

export function updateSea(t) { uTime.value = t; }
