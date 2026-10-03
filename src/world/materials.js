// All world textures (tiny, procedural, limited palette) and shared materials.
import * as THREE from 'three';
import { tex, ps1, rnd, pick, noise } from '../core/engine.js';

const stoneTex = tex(32, 32, (g, w, h) => {
  noise(g, w, h, ['#4a4c52', '#3e4046', '#55575c', '#34363b']);
  g.fillStyle = '#2a2b30'; for (let i = 0; i < 14; i++) g.fillRect(rnd(0, w) | 0, rnd(0, h) | 0, rnd(1, 5) | 0, 1);
  // cracks
  g.fillStyle = '#212226';
  for (let c = 0; c < 3; c++) { let x = rnd(0, w), y = rnd(0, h); for (let k = 0; k < 9; k++) { g.fillRect(x | 0, y | 0, 1, 1); x += rnd(-1, 1.6); y += 1; } }
  // moss
  for (let m = 0; m < 4; m++) { const cx = rnd(0, w), cy = rnd(0, h); for (let k = 0; k < 10; k++) { g.fillStyle = pick(['#3d4a33', '#46553a', '#36412e']); g.fillRect((cx + rnd(-3, 3)) | 0, (cy + rnd(-2, 2)) | 0, 1, 1); } }
  // light chips
  g.fillStyle = '#6a6c70'; for (let i = 0; i < 6; i++) g.fillRect(rnd(0, w) | 0, rnd(0, h) | 0, 1, 1);
}, 2, 2);
const towerTex = tex(32, 64, (g, w, h) => {
  for (let b = 0; b < 4; b++) {
    const red = b % 2 === 0;
    for (let y = b * 16; y < b * 16 + 16; y++) for (let x = 0; x < w; x++) {
      g.fillStyle = red ? pick(['#8e2a25', '#7d241f', '#9a332c']) : pick(['#cfc8b8', '#bdb6a6', '#d8d2c3']);
      g.fillRect(x, y, 1, 1);
    }
  }
  g.fillStyle = 'rgba(0,0,0,0.25)';
  for (let y = 0; y < h; y += 4) { g.fillRect(0, y, w, 1); for (let x = (y / 4) % 2 * 4; x < w; x += 8) g.fillRect(x, y, 1, 4); }
  // peeled paint
  for (let p = 0; p < 5; p++) { const cx = rnd(0, w), cy = rnd(0, h); g.fillStyle = pick(['#6b6560', '#5e5853']); for (let k = 0; k < 7; k++) g.fillRect((cx + rnd(-2, 2)) | 0, (cy + rnd(-1, 1)) | 0, 1, 1); }
  // rust / grime drips
  for (let d = 0; d < 6; d++) { const x = rnd(0, w) | 0, y0 = rnd(0, h) | 0, len = rnd(3, 9) | 0; g.fillStyle = 'rgba(70,40,25,0.45)'; g.fillRect(x, y0, 1, len); }
}, 4, 1);
const metalTex = tex(32, 32, (g, w, h) => {
  noise(g, w, h, ['#3a3f3a', '#323732', '#41463f']);
  // plate seams
  g.fillStyle = '#1f231c'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); g.fillRect(0, 16, w, 1);
  // rivets
  for (const [x, y] of [[3, 3], [28, 3], [3, 13], [28, 13], [3, 19], [28, 19], [3, 29], [28, 29]]) { g.fillStyle = '#5c6157'; g.fillRect(x, y, 1, 1); g.fillStyle = '#23271f'; g.fillRect(x + 1, y + 1, 1, 1); }
  // rust spots
  for (let r = 0; r < 4; r++) { const cx = rnd(2, w - 2), cy = rnd(2, h - 2); for (let k = 0; k < 6; k++) { g.fillStyle = pick(['#4a3527', '#3f2e22', '#53392a']); g.fillRect((cx + rnd(-2, 2)) | 0, (cy + rnd(-1.5, 1.5)) | 0, 1, 1); } }
  // grime along seams
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(1, 1, w - 1, 1); g.fillRect(1, 17, w - 1, 1);
}, 6, 6);
const roofTex = tex(16, 16, (g, w, h) => {
  noise(g, w, h, ['#5c1d19', '#4f1814', '#6a231e']);
  g.fillStyle = '#3b100d'; for (let x = 0; x < w; x += 4) g.fillRect(x, 0, 1, h);
  g.fillStyle = 'rgba(60,45,30,0.5)'; for (let i = 0; i < 3; i++) g.fillRect(rnd(0, w) | 0, rnd(0, 8) | 0, 1, rnd(3, 8) | 0);
}, 4, 1);
const seaTex = tex(32, 32, (g, w, h) => {
  noise(g, w, h, ['#0e2a3c', '#103247', '#0b2333', '#143a50']);
  g.fillStyle = '#2a5a70'; for (let i = 0; i < 10; i++) g.fillRect(rnd(0, w) | 0, rnd(0, h) | 0, rnd(2, 6) | 0, 1);
}, 40, 40);

const woodTex = tex(32, 32, (g, w, h) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { g.fillStyle = pick(['#4a3524', '#543c28', '#3f2d1f']); g.fillRect(x, y, 1, 1); }
  g.fillStyle = '#2a1d13'; for (let y = 0; y < h; y += 8) g.fillRect(0, y, w, 1);
  g.fillStyle = 'rgba(30,20,12,0.5)'; for (let i = 0; i < 10; i++) g.fillRect(rnd(0, w) | 0, rnd(0, h) | 0, rnd(3, 9) | 0, 1);
  g.fillStyle = '#2a1d13'; for (let i = 0; i < 3; i++) g.fillRect(rnd(0, w) | 0, rnd(0, h) | 0, 2, 1);
}, 1, 1);

export const M = {
  stone: ps1(new THREE.MeshLambertMaterial({ map: stoneTex, flatShading: true })),
  tower: ps1(new THREE.MeshLambertMaterial({ map: towerTex, flatShading: true })),
  metal: ps1(new THREE.MeshLambertMaterial({ map: metalTex, flatShading: true })),
  dark: new THREE.MeshLambertMaterial({ color: 0x1c201c, flatShading: true }),
  roof: ps1(new THREE.MeshLambertMaterial({ map: roofTex, flatShading: true })),
  sea: ps1(new THREE.MeshPhongMaterial({ map: seaTex, flatShading: true, shininess: 40, specular: 0x6688aa })),
};
M.wood = ps1(new THREE.MeshLambertMaterial({ map: woodTex, flatShading: true }));
M.rubber = new THREE.MeshLambertMaterial({ color: 0x22262a, flatShading: true });
M.steel = new THREE.MeshLambertMaterial({ color: 0x8a9096, flatShading: true });
M.lens = new THREE.MeshBasicMaterial({ color: 0x6b6450 });
