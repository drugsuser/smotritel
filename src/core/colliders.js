// ALL floor collision lives here. The player is a circle (PLAYER_R) pushed out of:
//   - circles:  addCollider(x, z, r)            props, pedestals, tables
//   - segments: addSegment(ax, az, bx, bz, half) walls, door leaf (a "thick line" of half-width `half`)
//   - boxes:    addBox(cx, cz, w, d, rotY)       crates etc. (4 segments; rotY = the mesh's rotation.y)
// Segments are mutable (seg.bx = ...) so a moving door just updates its own segment.
// Both return a handle; pass it to removeCollider() when the thing is gone for good.
export const PLAYER_R = 0.25;

const list = [];
const EPS = 1e-9;

export function addCollider(x, z, r) { const c = { x, z, r }; list.push(c); return c; }
export function addSegment(ax, az, bx, bz, half = 0) { const c = { ax, az, bx, bz, half }; list.push(c); return c; }
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
  const abx = c.bx - c.ax, abz = c.bz - c.az, len2 = abx * abx + abz * abz;
  const t = len2 > 0 ? Math.min(1, Math.max(0, ((pos.x - c.ax) * abx + (pos.z - c.az) * abz) / len2)) : 0;
  // At exactly zero distance, use the segment normal instead of an arbitrary world axis.
  return pushFromPoint(pos, c.ax + abx * t, c.az + abz * t, PLAYER_R + c.half, -abz, abx);
}

// Push `pos` (anything with x/z) out of every collider. Stop as soon as a full pass
// makes no correction; the cap prevents pathological overlapping colliders from looping forever.
export function resolve(pos, maxPasses = 8) {
  for (let i = 0; i < maxPasses; i++) {
    let corrected = false;
    for (const c of list) {
      const moved = c.r !== undefined
        ? pushFromPoint(pos, c.x, c.z, c.r + PLAYER_R)
        : pushFromSegment(pos, c);
      corrected = moved || corrected;
    }
    if (!corrected) break;
  }
}
