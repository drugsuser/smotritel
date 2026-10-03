// Anything you can aim at and press E on.
// addInteractable({ object, prompt: () => string, interact: () => void, enabled?: () => bool })
import * as THREE from 'three';
import { camera } from '../core/engine.js';

export const INTERACT_RANGE = 2.6;
export const interactables = [];
const objects = []; // cached list for the raycaster: interactables + occluders
// Solid things that block the "E" ray (walls, tables...), so items can't be grabbed through them.
export function addOccluder(obj) { objects.push(obj); }
export function addInteractable(def) { def.object.traverse((o) => o.userData.interactable = def); interactables.push(def); objects.push(def.object); return def; }
export function removeInteractable(def) {
  const i = interactables.indexOf(def); if (i >= 0) interactables.splice(i, 1);
  const j = objects.indexOf(def.object); if (j >= 0) objects.splice(j, 1);
  def.object.traverse((o) => delete o.userData.interactable);
}

const ray = new THREE.Raycaster(); ray.far = INTERACT_RANGE;
const CENTER = new THREE.Vector2(0, 0);
export function findHovered() {
  ray.setFromCamera(CENTER, camera);
  const hits = ray.intersectObjects(objects, true);
  for (const h of hits) {
    const d = h.object.userData.interactable;
    if (!d) return null;                         // an occluder is in the way
    if (!d.enabled || d.enabled()) return d;     // disabled interactables don't block
  }
  return null;
}
