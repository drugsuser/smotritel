// Flashlight item. The light lives on the camera and is always present
// (intensity 0 when off -> no shader recompiles when toggling).
import * as THREE from 'three';
import { camera } from '../core/engine.js';
import { M } from '../world/materials.js';
import { sfx } from '../core/audio.js';

const flashLight = new THREE.SpotLight(0xfff0d0, 0, 45, 0.42, 0.55, 1.1);
flashLight.position.set(0.2, -0.15, -0.3); camera.add(flashLight);
const flashTarget = new THREE.Object3D(); flashTarget.position.set(0.05, -0.1, -10); camera.add(flashTarget); flashLight.target = flashTarget;


export const flashlight = {
    name: 'Фонарик',
    makeModel() {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.2, 8), M.rubber); g.add(body);
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.036, 0.07, 8), M.steel); head.position.y = 0.135; g.add(head);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.046, 8), M.lens.clone()); lens.rotation.x = -Math.PI / 2; lens.position.y = 0.171; g.add(lens);
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
    apply(st) {
      flashLight.intensity = st.on ? 9 : 0;
      st.model?.userData.lens.material.color.set(st.on ? 0xfff6d8 : 0x6b6450);
    },
};
