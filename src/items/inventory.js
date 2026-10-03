// Inventory (hotbar slots), held item in hand, world item spawning.
import * as THREE from 'three';
import { scene, camera } from '../core/engine.js';
import { sfx } from '../core/audio.js';
import { ITEMS } from './registry.js';
import { addInteractable, removeInteractable } from '../interaction/interactables.js';
import { renderHotbar } from '../ui/hud.js';
import { player } from '../player/player.js';
import { state } from '../core/state.js';

export const SLOTS = 5;
const hand = new THREE.Group(); camera.add(hand);
let equipAnim = 0, swayX = 0, swayY = 0;

export const inventory = {
  slots: new Array(SLOTS).fill(null), // { id, st }
  active: -1,
  add(id) {
    const i = this.slots.findIndex((s) => !s); if (i < 0) return false;
    this.slots[i] = { id, st: {} }; this.select(i); return true;
  },
  current() { return this.active >= 0 ? this.slots[this.active] : null; },
  select(i) {
    const prev = this.current();
    if (prev) { ITEMS[prev.id].onUnequip?.(prev.st); hand.clear(); prev.st.model = null; }
    this.active = (i === this.active && prev) ? -1 : i; // same key again = put away
    const cur = this.current();
    if (cur) {
      const def = ITEMS[cur.id], m = def.makeModel();
      m.position.set(...def.hold.pos); m.rotation.set(...def.hold.rot); hand.add(m); cur.st.model = m;
      def.onEquip?.(cur.st); equipAnim = 1;
    }
    renderHotbar(this);
  },
  use() { const cur = this.current(); if (cur) ITEMS[cur.id].onUse?.(cur.st); },
};
renderHotbar(inventory);

// Place an item in the world so it can be picked up with E.
export function spawnItem(id, position, rotation = [0, 0, 0]) {
  const def = ITEMS[id]; const model = def.makeModel();
  model.position.copy(position); model.rotation.set(...rotation); scene.add(model);
  const it = addInteractable({
    object: model, itemId: id,
    prompt: () => `Взять: ${def.name}`,
    interact: () => { if (inventory.add(id)) { removeInteractable(it); scene.remove(model); sfx.pickup(); } },
  });
  return it;
}

// held item sway / bob
addEventListener('mousemove', (e) => { if (!state.paused) { swayX += e.movementX * 0.00004; swayY += e.movementY * 0.00004; } });
export function updateHand(dt) {
  equipAnim = Math.max(0, equipAnim - dt * 4);
  swayX *= Math.pow(0.0005, dt); swayY *= Math.pow(0.0005, dt);
  const b = player.moving ? Math.sin(player.bob) * 0.012 : 0;
  hand.position.set(-swayX + (player.moving ? Math.cos(player.bob * 0.5) * 0.008 : 0), swayY + b - equipAnim * equipAnim * 0.3, 0);
}
