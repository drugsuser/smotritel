// Lamp room: octagonal walls + glass, a hinged door you can open (E), and a small room inside
// with the lamp pedestal, a crate and a floor hatch.
// Octagon: corners at multiples of 45°, flat faces at 22.5° + k*45°.
import * as THREE from 'three';
import { scene } from '../core/engine.js';
import { M } from './materials.js';
import { TOP, FLOOR_Y } from './lighthouse.js';
import { addOccluder, addInteractable } from '../interaction/interactables.js';
import { addCollider, addSegment, addBox } from '../core/colliders.js';
import { creakSound, clankSound } from '../core/audio.js';

const ROOM = new THREE.Group(); scene.add(ROOM);
const RC = 2.5;                              // corner radius
const AP = RC * Math.cos(Math.PI / 8);       // ≈ 2.31, distance to a flat face
const FW = 2 * RC * Math.sin(Math.PI / 8);   // ≈ 1.91, face width
const WALL_H = 1.0, CEIL_Y = TOP + 3.9;      // metal lower wall, glass up to the roof ring
const DOOR_FACE = 1;                         // which face has the door
const DW = 0.9, DH = 1.9, FRAME_H = 2.1;     // door size, metal part of the door face

const glassMat = new THREE.MeshLambertMaterial({ color: 0xffe6a8, emissive: 0x1a1208, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false });
const faceA = (k) => Math.PI / 8 + k * Math.PI / 4;
// face basis: n = outward normal, t = along the face (local +X of a face-aligned box)
const faceBasis = (a) => ({ n: new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), t: new THREE.Vector3(Math.sin(a), 0, -Math.cos(a)), rotY: Math.PI / 2 - a });

function panel(k, along, w, y0, y1, r, mat, thick = 0.08) {
  const { n, t, rotY } = faceBasis(faceA(k));
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, y1 - y0, thick), mat);
  m.position.copy(n).multiplyScalar(r).addScaledVector(t, along); m.position.y = (y0 + y1) / 2; m.rotation.y = rotY;
  ROOM.add(m); return m;
}
function glass(k, y0, y1) {
  const { n, rotY } = faceBasis(faceA(k));
  const g = new THREE.Mesh(new THREE.PlaneGeometry(FW, y1 - y0), glassMat);
  g.position.copy(n).multiplyScalar(AP - 0.06); g.position.y = (y0 + y1) / 2; g.rotation.y = rotY;
  g.raycast = () => {}; ROOM.add(g); // see-through: never blocks the E ray
}

// ---------- walls ----------
const WR = AP - 0.04; // wall panels sit just inside the face plane
for (let k = 0; k < 8; k++) {
  if (k === DOOR_FACE) {
    const side = (FW - DW) / 2;
    panel(k, -(DW + side) / 2, side, FLOOR_Y, FLOOR_Y + FRAME_H, WR, M.metal);   // jambs
    panel(k, (DW + side) / 2, side, FLOOR_Y, FLOOR_Y + FRAME_H, WR, M.metal);
    panel(k, 0, DW, FLOOR_Y + DH, FLOOR_Y + FRAME_H, WR, M.metal);              // lintel
    glass(k, FLOOR_Y + FRAME_H, CEIL_Y);
  } else {
    panel(k, 0, FW, FLOOR_Y, FLOOR_Y + WALL_H, WR, M.metal);
    glass(k, FLOOR_Y + WALL_H, CEIL_Y);
  }
  // corner posts, floor to roof
  const a = k * Math.PI / 4;
  const f = new THREE.Mesh(new THREE.BoxGeometry(0.12, CEIL_Y - FLOOR_Y, 0.12), M.dark);
  f.position.set(Math.cos(a) * 2.44, (FLOOR_Y + CEIL_Y) / 2, Math.sin(a) * 2.44); f.rotation.y = Math.PI / 2 - a; ROOM.add(f);
}

// ---------- door (hinged, swings inward) ----------
const DB = faceBasis(faceA(DOOR_FACE));
const pivot = new THREE.Group(); // at the hinge edge
pivot.position.copy(DB.n).multiplyScalar(WR).addScaledVector(DB.t, -DW / 2); pivot.position.y = FLOOR_Y;
ROOM.add(pivot);
{
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(DW - 0.02, DH - 0.02, 0.06, 3, 6, 1), M.metal);
  leaf.position.set(DW / 2, DH / 2, 0); pivot.add(leaf);
  for (const z of [0.05, -0.05]) { // handle on both sides
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.03), M.dark); h.position.set(DW - 0.12, 1.0, z); pivot.add(h);
  }
  for (const y of [0.25, DH - 0.25]) { // hinges
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.1), M.dark); h.position.set(0.01, y, 0); pivot.add(h);
  }
}
const OPEN_ANGLE = 1.75, SWING_TIME = 1.0;
const door = { target: 0, k: 0 };            // k: 0 closed .. 1 open
addInteractable({
  object: pivot,
  prompt: () => door.target ? 'Закрыть дверь' : 'Открыть дверь',
  interact: () => {
    door.target = door.target ? 0 : 1;
    creakSound(SWING_TIME * (door.target ? 1 : 0.8));
  },
});

// ---------- interior ----------
// lamp pedestal
{
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.34, 1.72, 8), M.dark); ped.position.y = FLOOR_Y + 0.86; ROOM.add(ped);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.12, 8), M.metal); base.position.y = FLOOR_Y + 0.06; ROOM.add(base);
  addCollider(0, 0, 0.42);
}
// floor hatch (closed; leads down into the tower)
{
  const a = faceA(5), r = 1.2;
  const hatch = new THREE.Group(); hatch.position.set(Math.cos(a) * r, FLOOR_Y, Math.sin(a) * r); hatch.rotation.y = Math.PI / 2 - a; ROOM.add(hatch);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.03, 0.8, 2, 1, 2), M.metal); lid.position.y = 0.015; hatch.add(lid);
  for (const [x, z, w, d] of [[0, 0.43, 0.94, 0.07], [0, -0.43, 0.94, 0.07], [0.43, 0, 0.07, 0.8], [-0.43, 0, 0.07, 0.8]]) {
    const fr = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), M.dark); fr.position.set(x, 0.025, z); hatch.add(fr);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 3, 8), M.steel); ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.04, 0.25); hatch.add(ring);
  const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.05), M.dark); hinge.position.set(0, 0.03, -0.38); hatch.add(hinge);
}
// crate + oil can
{
  const a = faceA(3) + 0.1, r = 1.6;
  const x = Math.cos(a) * r, z = Math.sin(a) * r;
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.5, 2, 2, 2), M.wood); crate.position.set(x, FLOOR_Y + 0.25, z); crate.rotation.y = Math.PI / 2 - a + 0.2; ROOM.add(crate);
  const can = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.26, 6), M.roof); can.position.set(x + 0.1, FLOOR_Y + 0.63, z - 0.05); ROOM.add(can);
  addBox(x, z, 0.6, 0.5, crate.rotation.y); // real rectangle, not a circle
}

addOccluder(ROOM);

// ---------- player vs walls ----------
// The walls are the 8 real segments of the octagon (the door face has a DW-wide gap) and the
// door leaf is one more segment that moves with the door. All of them are registered in
// core/colliders.js, so corners, jambs and the leaf collide exactly where they are drawn, and
// the doorway is passable as soon as the leaf has physically swung out of the way.
// There is no "can't close, you're in the way" rule: a closing leaf just shoves the player
// (checked: nobody ends up inside a wall or trapped, you only get nudged, sometimes out the door).
const WALL_HALF = 0.04, LEAF_HALF = 0.03;
const CR = WR / Math.cos(Math.PI / 8);       // corner radius of the wall plane
const corner = (k) => new THREE.Vector2(Math.cos(k * Math.PI / 4) * CR, Math.sin(k * Math.PI / 4) * CR); // (x, z)
const wall = (a, b) => addSegment(a.x, a.y, b.x, b.y, WALL_HALF);
for (let k = 0; k < 8; k++) {
  const a = corner(k), b = corner(k + 1);
  if (k !== DOOR_FACE) { wall(a, b); continue; }
  const mid = a.clone().add(b).multiplyScalar(0.5), dir = b.clone().sub(a).normalize();
  wall(a, mid.clone().addScaledVector(dir, -DW / 2)); wall(mid.clone().addScaledVector(dir, DW / 2), b); // jambs
}
const leafA = new THREE.Vector2(pivot.position.x, pivot.position.z);
const leaf = addSegment(leafA.x, leafA.y, leafA.x, leafA.y, LEAF_HALF); // end point is set by updateLeaf()

const tmp = new THREE.Vector3();
function updateLeaf() {
  pivot.updateMatrixWorld();
  pivot.localToWorld(tmp.set(DW, 0, 0)); leaf.bx = tmp.x; leaf.bz = tmp.z;
}
pivot.rotation.y = DB.rotY; updateLeaf();

export function updateLamproom(dt) {
  const prevK = door.k;
  door.k = THREE.MathUtils.clamp(door.k + Math.sign(door.target - door.k) * dt / SWING_TIME, 0, 1);
  if (prevK > 0 && door.k === 0) clankSound(); // shut
  const e = door.k * door.k * (3 - 2 * door.k);
  pivot.rotation.y = DB.rotY + e * OPEN_ANGLE;
  updateLeaf();
}
