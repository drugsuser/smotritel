// Lighthouse tower, gallery, lamp room, lamp and rotating beams.
import * as THREE from 'three';
import { scene } from '../core/engine.js';
import { M } from './materials.js';
import { addOccluder } from '../interaction/interactables.js';

// ---------- lighthouse ----------
const LH = new THREE.Group(); scene.add(LH);
export const TOP = 30;            // height of the gallery floor base
export const FLOOR_Y = TOP + 0.3;  // walkable gallery surface
{
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 5.2, TOP - 2, 8, 14), M.tower);
  tower.position.y = 2 + (TOP - 2) / 2; LH.add(tower);
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 4.6, 0.6, 12, 1, true), M.metal); deck.position.y = TOP; LH.add(deck);
  const deckGeo = new THREE.RingGeometry(0.01, 5.6, 36, 14); deckGeo.rotateX(-Math.PI / 2);
  { const p = deckGeo.attributes.position, uv = deckGeo.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 1.9, p.getZ(i) / 1.9); }
  const deckTop = new THREE.Mesh(deckGeo, M.metal); deckTop.position.y = TOP + 0.3; LH.add(deckTop);
  M.metal.map.repeat.set(1, 1);
  // railing
  const R = 5.35;
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.1, 0.09), M.dark);
    post.position.set(Math.cos(a) * R, TOP + 0.85, Math.sin(a) * R); LH.add(post);
  }
  for (const [y, tube] of [[TOP + 1.4, 0.06], [TOP + 0.85, 0.035]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, tube, 3, 20), M.dark); ring.rotation.x = Math.PI / 2; ring.position.y = y; LH.add(ring);
  }
  // lamp room
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 1, 8, 4), M.metal); wall.position.y = TOP + 0.8; LH.add(wall);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 2.6, 8, 1, true),
    new THREE.MeshLambertMaterial({ color: 0xffe6a8, emissive: 0x1a1208, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false }));
  glass.position.y = TOP + 2.6; glass.raycast = () => {}; LH.add(glass); // see-through: never blocks the E ray
  for (let i = 0; i < 8; i++) {
    // posts on the corners of the octagon (corners at multiples of 45°), floor to roof
    const a = (i / 8) * Math.PI * 2;
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.6, 0.12), M.dark);
    f.position.set(Math.cos(a) * 2.44, TOP + 2.1, Math.sin(a) * 2.44); f.rotation.y = Math.PI / 2 - a; LH.add(f);
  }
  const ringTop = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.6, 0.3, 8), M.metal); ringTop.position.y = TOP + 4.05; LH.add(ringTop);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.8, 2, 8), M.roof); roof.position.y = TOP + 5.2; LH.add(roof);
  const knob = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), M.dark); knob.position.y = TOP + 6.4; LH.add(knob);
  // door to lamp room
  // centered on a flat face (faces at 22.5° + k*45°, 2.5*cos(PI/8) ≈ 2.31 from center), facing outward
  const DOOR_A = Math.PI / 2 - Math.PI / 8;
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.9, 0.1, 3, 6, 1), M.metal);
  door.position.set(Math.cos(DOOR_A) * 2.36, TOP + 1.25, Math.sin(DOOR_A) * 2.36); door.rotation.y = Math.PI / 2 - DOOR_A; LH.add(door);
}

addOccluder(LH);

// lamp + rotating beam
const lampY = TOP + 2.6;
const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), new THREE.MeshBasicMaterial({ color: 0xfff1c0 }));
lamp.position.y = lampY; LH.add(lamp);
const lampPt = new THREE.PointLight(0xffd890, 6, 14, 1.2); lampPt.position.y = lampY; LH.add(lampPt);

// Beam: two cones from the lamp, tilted down so they land on the sea ~150 m out.
const BEAM_TILT = 0.22;                         // rad below horizon
const BEAM_LEN = (lampY + 3) / Math.sin(BEAM_TILT); // ends just under the water -> clipped by the sea
const BEAM_R = 9;                               // cone radius at the far end
const ROT_SPEED = 0.12;                         // rad/s: ~52 s per turn, a pass every ~26 s

const beamMat = new THREE.ShaderMaterial({
  uniforms: { len: { value: BEAM_LEN } },
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  vertexShader: `varying float vT; varying float vF; void main(){ vT = uv.y; vec4 mv = modelViewMatrix*vec4(position,1.0); vF = abs(dot(normalize(normalMatrix*normal), normalize(-mv.xyz))); gl_Position = projectionMatrix*mv;} `,
  // d = distance from the lamp (cone apex has uv.y = 1)
  // soft volumetric look: bright where the cone faces the camera, fades to 0 at the silhouette
  fragmentShader: `uniform float len; varying float vT; varying float vF; void main(){ float d = (1.0 - vT) * len; float a = smoothstep(0.5, 4.0, d) * mix(0.4, 1.0, smoothstep(6.0, 30.0, d)) * exp(-d / 140.0) * 0.07 * pow(vF, 2.0); gl_FragColor = vec4(1.0,0.9,0.65,a);} `,
});
const rotor = new THREE.Group(); rotor.position.y = lampY; scene.add(rotor);
for (const s of [1, -1]) {
  const arm = new THREE.Group(); arm.rotation.z = -s * BEAM_TILT; rotor.add(arm); // tilt down along ±X
  const cone = new THREE.Mesh(new THREE.ConeGeometry(BEAM_R, BEAM_LEN, 12, 1, true), beamMat);
  cone.rotation.z = s * Math.PI / 2;            // apex at the lamp, wide end out at sea
  cone.position.x = s * BEAM_LEN / 2; cone.raycast = () => {}; arm.add(cone);
  // real light for each beam: lights the water where the beam lands (and rocks on the way)
  const spot = new THREE.SpotLight(0xffd9a0, 6000, 450, 0.11, 0.8, 1);
  const hit = lampY / Math.tan(BEAM_TILT);
  const target = new THREE.Object3D(); target.position.set(s * hit, -lampY, 0);
  rotor.add(spot, target); spot.target = target;
}

export function updateLighthouse(t) {
  rotor.rotation.y = t * ROT_SPEED;
  lamp.rotation.y = -t * ROT_SPEED;
}
