// Small wooden table by the spawn with the flashlight on it.
import * as THREE from 'three';
import { scene } from '../core/engine.js';
import { M } from '../world/materials.js';
import { FLOOR_Y } from '../world/lighthouse.js';
import { addCollider } from '../core/colliders.js';
import { addOccluder } from '../interaction/interactables.js';
import { spawnItem } from '../items/inventory.js';

{
  const a = Math.PI / 2 + 0.3, r = 4.7;
  const tx = Math.cos(a) * r, tz = Math.sin(a) * r, floorY = FLOOR_Y;
  const table = new THREE.Group(); table.position.set(tx, floorY, tz); table.rotation.y = -a + Math.PI / 2; scene.add(table);
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.55, 3, 1, 2), M.wood); top.position.y = 0.78; table.add(top);
  for (const [x, z] of [[-0.44, -0.22], [0.44, -0.22], [-0.44, 0.22], [0.44, 0.22]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.75, 0.06), M.wood); leg.position.set(x, 0.375, z); table.add(leg);
  }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.05, 0.04), M.wood); bar.position.set(0, 0.2, 0.22); table.add(bar);
  addCollider(tx, tz, 0.6); addOccluder(table);
  // flashlight lying on the table
  const p = new THREE.Vector3(0.1, 0.81 + 0.033, 0.02); table.localToWorld(p);
  spawnItem('flashlight', p, [0, -a + 0.9, Math.PI / 2]);
}
