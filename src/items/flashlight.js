// Flashlight item. The light lives on the camera and is always present
// (intensity 0 when off -> no shader recompiles when toggling).
import * as THREE from 'three';
import { camera } from '../core/engine.js';
import { M } from '../world/materials.js';
import { sfx } from '../core/audio.js';

const flashLight = new THREE.SpotLight(0xfff0d0, 0, 45, 0.42, 0.55, 1.1);
flashLight.position.set(0.2, -0.15, -0.3); camera.add(flashLight);
const flashTarget = new THREE.Object3D(); flashTarget.position.set(0.05, -0.1, -10); camera.add(flashTarget); flashLight.target = flashTarget;


const LIT = new THREE.Color(0xfff6d8);
// per-model lens material (its color changes). clone() copies userData.shared,
// so unmark it, otherwise disposeTree would never free it.
const lensMat = () => { const m = M.lens.clone(); m.userData.shared = false; return m; };
const rand = (a, b) => a + Math.random() * (b - a);

export const flashlight = {
    name: 'Фонарик',
    makeModel() {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.2, 8), M.rubber); g.add(body);
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.036, 0.07, 8), M.steel); head.position.y = 0.135; g.add(head);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.046, 8), lensMat()); lens.rotation.x = -Math.PI / 2; lens.position.y = 0.171; g.add(lens);
      const btn = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.012), M.steel); btn.position.set(0, 0.03, 0.034); g.add(btn);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.02, 8), M.steel); cap.position.y = -0.1; g.add(cap);
      g.userData.lens = lens;
      return g;
    },
    // pointing forward (-Z) in the right hand
    hold: { pos: [0.24, -0.22, -0.42], rot: [-Math.PI / 2 + 0.06, 0, 0.05] },
    onEquip(st) { this.apply(st); },
    onUnequip(st) { flashLight.intensity = 0; },
    onUse(st) { st.on = !st.on; sfx.click(); this.apply(st); },
    apply(st, level = 1) {
      const lit = st.on ? level : 0;
      flashLight.intensity = 9 * lit;
      st.model?.userData.lens.material.color.setHex(0x6b6450).lerp(LIT, lit);
    },
    // called every frame while in hand: random short flicker roughly every 40 s
    update(st, dt) {
      if (!st.on) return;
      st.nextFlicker ??= rand(30, 50);
      if (st.flicker > 0) {
        st.flicker -= dt; st.flickStep -= dt;
        if (st.flickStep <= 0) { st.flickStep = rand(0.03, 0.09); this.apply(st, Math.random() < 0.5 ? rand(0, 0.15) : rand(0.5, 1)); }
        if (st.flicker <= 0) this.apply(st);
        return;
      }
      st.nextFlicker -= dt;
      if (st.nextFlicker <= 0) { st.flicker = rand(0.35, 0.8); st.flickStep = 0; st.nextFlicker = rand(30, 50); }
    },
};
