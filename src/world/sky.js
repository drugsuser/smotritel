// Sky dome, stars, moon and global night lighting.
import * as THREE from 'three';
import { scene, FOG } from '../core/engine.js';

{
  const g = new THREE.SphereGeometry(900, 16, 10);
  const col = []; const p = g.attributes.position;
  const top = new THREE.Color(0x02040a), hor = FOG.clone();
  for (let i = 0; i < p.count; i++) { const t = THREE.MathUtils.clamp(p.getY(i) / 500, 0, 1); const c = hor.clone().lerp(top, Math.pow(t, 0.6)); col.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  scene.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false })));

  const sp = [];
  for (let i = 0; i < 900; i++) { const v = new THREE.Vector3().randomDirection(); if (v.y < 0.08) continue; v.multiplyScalar(850); sp.push(v.x, v.y, v.z); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xbfc8e0, size: 2, sizeAttenuation: false, fog: false })));

  const moon = new THREE.Mesh(new THREE.CircleGeometry(28, 10), new THREE.MeshBasicMaterial({ color: 0xe8e4cf, fog: false }));
  moon.position.set(-420, 260, -560); moon.lookAt(0, 0, 0); scene.add(moon);
}

// ---------- lights ----------
scene.add(new THREE.HemisphereLight(0x3a5280, 0x06090e, 0.6));
const moonLight = new THREE.DirectionalLight(0x9fb2d8, 0.42); moonLight.position.set(-420, 260, -560); scene.add(moonLight);
