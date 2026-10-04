// Collision tests. Run: npm test  (or: node --test tests/*.test.mjs)
// No three.js here: the scene is rebuilt from the same numbers as world/lamproom.js,
// props/table.js and player/player.js. If you move walls/props there, update SCENE below.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../src/core/colliders.js';

const { PLAYER_R } = C;
const SCENE = {
  RC: 2.5, DW: 0.9, DOOR_FACE: 1, WALL_HALF: 0.04, LEAF_HALF: 0.03, OPEN_ANGLE: 1.75, SWING_TIME: 1.0,
  R_MAX: 4.95, PEDESTAL_R: 0.5,
  table: { a: Math.PI / 2 + 0.3, r: 4.7, w: 1.0, d: 0.55 },
  crate: { a: Math.PI / 8 + 3 * Math.PI / 4 + 0.1, r: 1.6, w: 0.6, d: 0.5 },
};
const faceA = (k) => Math.PI / 8 + k * Math.PI / 4;
const DT = 1 / 60, SPEED = 1.8;

// deterministic RNG so failures are reproducible
function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

function buildScene() {
  C.clearColliders();
  const S = SCENE, all = [];
  const add = (c) => { (Array.isArray(c) ? all.push(...c) : all.push(c)); return c; };
  const AP = S.RC * Math.cos(Math.PI / 8), WR = AP - 0.04, CR = WR / Math.cos(Math.PI / 8);
  { const { a, r, w, d } = S.table; add(C.addBox(Math.cos(a) * r, Math.sin(a) * r, w, d, -a + Math.PI / 2)); }
  add(C.addCollider(0, 0, S.PEDESTAL_R));
  { const { a, r, w, d } = S.crate; add(C.addBox(Math.cos(a) * r, Math.sin(a) * r, w, d, Math.PI / 2 - a + 0.2)); }
  const corner = (k) => [Math.cos(k * Math.PI / 4) * CR, Math.sin(k * Math.PI / 4) * CR];
  const a1 = faceA(S.DOOR_FACE), n = [Math.cos(a1), Math.sin(a1)], t = [Math.sin(a1), -Math.cos(a1)];
  for (let k = 0; k < 8; k++) {
    const a = corner(k), b = corner(k + 1);
    if (k !== S.DOOR_FACE) { add(C.addSegment(...a, ...b, S.WALL_HALF)); continue; }
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    add(C.addSegment(...a, m[0] + t[0] * S.DW / 2, m[1] + t[1] * S.DW / 2, S.WALL_HALF));
    add(C.addSegment(m[0] - t[0] * S.DW / 2, m[1] - t[1] * S.DW / 2, ...b, S.WALL_HALF));
  }
  const rail = add(C.addBound(0, 0, S.R_MAX + PLAYER_R));
  const piv = [n[0] * WR - t[0] * S.DW / 2, n[1] * WR - t[1] * S.DW / 2], rotY = Math.PI / 2 - a1;
  const leaf = add(C.addSegment(...piv, ...piv, S.LEAF_HALF));
  const setLeaf = (k) => {
    const e = k * k * (3 - 2 * k), th = rotY + e * S.OPEN_ANGLE; // three.js rotation.y: local +X -> (cos, -sin)
    leaf.bx = piv[0] + S.DW * Math.cos(th); leaf.bz = piv[1] - S.DW * Math.sin(th);
  };
  // same rule as updateLamproom(): never move the leaf into the player
  const door = { k: 0, target: 0, stuck: false };
  const updateDoor = (p) => {
    if (door.stuck || door.k === door.target) return;
    const prev = door.k;
    door.k = Math.min(1, Math.max(0, prev + Math.sign(door.target - prev) * DT / S.SWING_TIME)); setLeaf(door.k);
    if (C.hitsPlayer(leaf, p)) { door.k = prev; setLeaf(prev); door.stuck = true; door.target = door.target ? 0 : 1; }
  };
  const setDoor = (k) => { door.k = k; door.target = k; door.stuck = false; setLeaf(k); };
  setDoor(0);
  const inside = (p) => { for (let k = 0; k < 8; k++) { const a = faceA(k); if (p.x * Math.cos(a) + p.z * Math.sin(a) > WR) return false; } return true; };
  const inDoorway = (p) => Math.abs((p.x - n[0] * WR) * t[0] + (p.z - n[1] * WR) * t[1]) < S.DW / 2;
  const leafSide = (p) => {
    const abx = leaf.bx - leaf.ax, abz = leaf.bz - leaf.az, l = abx * abx + abz * abz;
    const u = ((p.x - leaf.ax) * abx + (p.z - leaf.az) * abz) / l;
    return u > 0 && u < 1 ? Math.sign(abx * (p.z - leaf.az) - abz * (p.x - leaf.ax)) : 0;
  };
  const worstPen = (p) => Math.max(...all.map((c) => C.penetration(p, c)));
  return { all, leaf, rail, door, setDoor, updateDoor, inside, inDoorway, leafSide, worstPen, piv };
}

function spawn(s, rnd, area) {
  for (;;) { const p = area(rnd); if (s.worstPen(p) < 0) return p; }
}
const anywhere = (rnd) => { const a = rnd() * Math.PI * 2, r = rnd() * 5; return { x: Math.cos(a) * r, z: Math.sin(a) * r }; };

// ---------- unit ----------
test('circle pushes the player out to exactly r + PLAYER_R', () => {
  C.clearColliders(); C.addCollider(0, 0, 1);
  const p = { x: 0.5, z: 0 }; C.resolve(p);
  assert.ok(Math.abs(p.x - (1 + PLAYER_R)) < 1e-9 && p.z === 0);
});
test('segment pushes along its normal, also from the exact centre', () => {
  C.clearColliders(); C.addSegment(-1, 0, 1, 0, 0.1);
  const p = { x: 0, z: 0 }; C.resolve(p);
  assert.ok(Math.abs(Math.abs(p.z) - (PLAYER_R + 0.1)) < 1e-9 && Math.abs(p.x) < 1e-9);
});
test('sharp wedge: the player stops instead of squeezing into a wall', () => {
  C.clearColliders(); const a = C.addSegment(0, 0, 3, 0.4, 0.03), b = C.addSegment(0, 0, 3, -0.4, 0.03); // ~15° wedge
  const p = { x: 3, z: 0 };
  for (let f = 0; f < 200; f++) { const prev = { ...p }; p.x -= SPEED * DT; C.resolve(p, prev); }
  assert.ok(!C.hitsPlayer(a, p, 1e-3) && !C.hitsPlayer(b, p, 1e-3));
});
test('bound keeps the player inside', () => {
  C.clearColliders(); C.addBound(0, 0, 5);
  const p = { x: 10, z: 0 }; C.resolve(p);
  assert.ok(Math.abs(p.x - (5 - PLAYER_R)) < 1e-9);
});
test('box matches a rotated three.js mesh', () => {
  C.clearColliders(); const box = C.addBox(0, 0, 2, 1, Math.PI / 2); // local X now runs along world -Z
  assert.ok(C.hitsPlayer(box[0], { x: 0, z: 1.1 }) || box.some((c) => C.hitsPlayer(c, { x: 0, z: 1.1 })));
  assert.ok(!box.some((c) => C.hitsPlayer(c, { x: 0.9, z: 0 })));
});

// ---------- scene ----------
test('walking around: never inside anything, never through a wall', () => {
  for (const k of [0, 1]) {
    const s = buildScene(); s.setDoor(k); const rnd = rng(1 + k);
    let worst = 0, tunnels = 0;
    for (let w = 0; w < 1500; w++) {
      const p = spawn(s, rnd, anywhere); let ang = rnd() * 6.283, ins = s.inside(p);
      for (let i = 0; i < 400; i++) {
        if (rnd() < 0.02) ang = rnd() * 6.283;
        const prev = { ...p };
        p.x += Math.cos(ang) * SPEED * DT; p.z += Math.sin(ang) * SPEED * DT; C.resolve(p, prev);
        worst = Math.max(worst, s.worstPen(p));
        const ni = s.inside(p);
        if (ni !== ins) { if (!s.inDoorway(p) && !s.inDoorway(prev)) tunnels++; ins = ni; }
      }
    }
    assert.ok(worst < 1e-3, `door ${k ? 'open' : 'closed'}: penetration ${worst.toFixed(4)} m`);
    assert.equal(tunnels, 0, 'walked through a wall');
  }
});

test('pushing into the table along the railing: no clipping', () => {
  const s = buildScene(); const a = SCENE.table.a;
  for (const dir of [1, -1]) {
    const p = { x: Math.cos(a - dir * 0.4) * 4.95, z: Math.sin(a - dir * 0.4) * 4.95 };
    for (let f = 0; f < 240; f++) {
      const ang = Math.atan2(p.z, p.x), v = SPEED * DT, prev = { ...p };
      p.x += (-Math.sin(ang) * dir + Math.cos(ang) * 0.3) * v; p.z += (Math.cos(ang) * dir + Math.sin(ang) * 0.3) * v; C.resolve(p, prev);
      assert.ok(s.worstPen(p) < 1e-3, `frame ${f}: ${s.worstPen(p).toFixed(4)} m`);
    }
  }
});

test('door swinging at a standing/walking player: never passes through, never squeezes into the jamb', () => {
  const rnd = rng(7);
  let runs = 0, flips = 0, worst = 0, stuck = 0;
  for (const from of [1, 0]) for (let i = 0; i < 3000; i++) {
    const s = buildScene(); s.setDoor(from);
    const p = spawn(s, rnd, (r) => ({ x: s.piv[0] + (r() * 2 - 1) * 1.3, z: s.piv[1] + (r() * 2 - 1) * 1.3 }));
    const walk = rnd() < 0.5, ang = rnd() * 6.283; runs++;
    s.door.target = 1 - from; let side = s.leafSide(p);
    for (let f = 0; f < 90; f++) {
      const prev = { ...p };
      if (walk) { p.x += Math.cos(ang) * SPEED * DT; p.z += Math.sin(ang) * SPEED * DT; }
      C.resolve(p, prev); s.updateDoor(p); // same order as main.js: player first, then the door
      worst = Math.max(worst, s.worstPen(p));
      const ns = s.leafSide(p); if (side && ns && ns !== side && C.penetration(p, s.leaf) > -0.05) { flips++; break; } side = ns; // only consecutive in-span frames count; leaving the span resets
    }
    if (s.door.stuck) stuck++;
  }
  assert.equal(flips, 0, `leaf went through the player in ${flips}/${runs} runs`);
  assert.ok(worst < 1e-3, `penetration ${worst.toFixed(4)} m`);
  assert.ok(stuck > 0, 'sanity: the door should get blocked sometimes');
});
