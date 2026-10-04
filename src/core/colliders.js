// ALL floor collision lives here. The player is a circle (PLAYER_R) kept out of / inside:
//   - circles:  addCollider(x, z, r)             props, pedestals
//   - segments: addSegment(ax, az, bx, bz, half)  walls, door leaf (a "thick line" of half-width `half`)
//   - boxes:    addBox(cx, cz, w, d, rotY)        tables, crates (4 segments; rotY = the mesh's rotation.y)
//   - bounds:   addBound(x, z, r)                 stay INSIDE this circle (the gallery railing)
// All of them are solved together in resolve(), so no constraint can undo another one
// (the railing used to be clamped afterwards and pushed you back into the table).
// Segments are mutable (seg.bx = ...) so a moving door just updates its own segment.
// A MOVING collider must not be pushed through the player: the solver can't fix a pinch
// (e.g. a door leaf closing against its jamb leaves no room for the player). Movers check
// hitsPlayer() after moving and step back instead -- see the door in world/lamproom.js.
// Every add* returns a handle; pass it to removeCollider() when the thing is gone for good.
export const PLAYER_R = 0.25;

const list = [];
const EPS = 1e-9;

export function addCollider(x, z, r) { return push({ kind: 'circle', x, z, r }); }
export function addSegment(ax, az, bx, bz, half = 0) { return push({ kind: 'segment', ax, az, bx, bz, half }); }
export function addBound(x, z, r) { return push({ kind: 'bound', x, z, r }); }
// Rectangle w (local X) × d (local Z) rotated like a three.js mesh with rotation.y = rotY.
// Returns the 4 edges; corners stay rounded by PLAYER_R, which feels natural.
export function addBox(cx, cz, w, d, rotY, half = 0) {
  const c = Math.cos(rotY), s = Math.sin(rotY), hx = w / 2, hz = d / 2;
  const at = (lx, lz) => [cx + lx * c + lz * s, cz - lx * s + lz * c]; // local (x, z) -> world (x, z)
  const q = [at(-hx, -hz), at(hx, -hz), at(hx, hz), at(-hx, hz)];
  return q.map((a, i) => { const b = q[(i + 1) % 4]; return addSegment(a[0], a[1], b[0], b[1], half); });
}
export function removeCollider(c) {
  if (Array.isArray(c)) { c.forEach(removeCollider); return; } // handles from addBox
  const i = list.indexOf(c); if (i >= 0) list.splice(i, 1);
}
export function clearColliders() { list.length = 0; } // tests only
function push(c) { list.push(c); return c; }

// Closest point of a segment to pos.
function closestOnSegment(pos, c) {
  const abx = c.bx - c.ax, abz = c.bz - c.az, len2 = abx * abx + abz * abz;
  const t = len2 > 0 ? Math.min(1, Math.max(0, ((pos.x - c.ax) * abx + (pos.z - c.az) * abz) / len2)) : 0;
  return [c.ax + abx * t, c.az + abz * t];
}

// How deep the player at `pos` is inside collider c (> 0 = overlapping), in metres.
export function penetration(pos, c) {
  if (c.kind === 'circle') return c.r + PLAYER_R - Math.hypot(pos.x - c.x, pos.z - c.z);
  if (c.kind === 'bound') return Math.hypot(pos.x - c.x, pos.z - c.z) - (c.r - PLAYER_R);
  const [px, pz] = closestOnSegment(pos, c);
  return PLAYER_R + c.half - Math.hypot(pos.x - px, pos.z - pz);
}
export const hitsPlayer = (c, pos, tolerance = 1e-4) => penetration(pos, c) > tolerance;

// Returns true when the position was corrected. fallbackX/Z define a deterministic
// escape direction for the exact-center case, where the usual normal is undefined.
function pushFromPoint(pos, cx, cz, min, fallbackX = 1, fallbackZ = 0) {
  const dx = pos.x - cx, dz = pos.z - cz, d = Math.hypot(dx, dz);
  if (d >= min) return false;
  if (d > EPS) {
    pos.x = cx + dx / d * min; pos.z = cz + dz / d * min;
  } else {
    const fd = Math.hypot(fallbackX, fallbackZ) || 1;
    pos.x = cx + fallbackX / fd * min; pos.z = cz + fallbackZ / fd * min;
  }
  return true;
}

function pushFromSegment(pos, c) {
  const [px, pz] = closestOnSegment(pos, c);
  // At exactly zero distance, use the segment normal instead of an arbitrary world axis.
  return pushFromPoint(pos, px, pz, PLAYER_R + c.half, -(c.bz - c.az), c.bx - c.ax);
}

function pullIntoBound(pos, c) {
  const dx = pos.x - c.x, dz = pos.z - c.z, d = Math.hypot(dx, dz), max = c.r - PLAYER_R;
  if (d <= max) return false;
  pos.x = c.x + dx / d * max; pos.z = c.z + dz / d * max;
  return true;
}

function solveOne(pos, c) {
  if (c.kind === 'circle') return pushFromPoint(pos, c.x, c.z, c.r + PLAYER_R);
  if (c.kind === 'bound') return pullIntoBound(pos, c);
  return pushFromSegment(pos, c);
}

// Push `pos` (anything with x/z) out of every collider (and into every bound). Stop as soon
// as a full pass makes no correction.
// Sequential pushing can't settle in a sharp wedge (e.g. a door left ajar next to its jamb:
// one side pushes you into the other, forever). If it hasn't settled after maxPasses, the move
// is rejected and pos goes back to `prev` (the last valid position), so you just stop there.
// Bounds are re-applied at the very end, so nothing ever puts you outside one.
export function resolve(pos, prev = null, maxPasses = 16) {
  for (let i = 0; i < maxPasses; i++) {
    let corrected = false;
    for (const c of list) corrected = solveOne(pos, c) || corrected;
    if (!corrected) return true;
  }
  if (prev && list.some((c) => hitsPlayer(c, pos, 1e-3))) { pos.x = prev.x; pos.z = prev.z; }
  for (const c of list) if (c.kind === 'bound') pullIntoBound(pos, c);
  return false;
}
