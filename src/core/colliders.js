// ALL floor collision lives here. The player is a circle (PLAYER_R) pushed out of:
//   - circles:  addCollider(x, z, r)            props, pedestals, tables
//   - segments: addSegment(ax, az, bx, bz, half) walls, door leaf (a "thick line" of half-width `half`)
// Segments are mutable (seg.bx = ...) so a moving door just updates its own segment.
// Both return a handle; pass it to removeCollider() when the thing is gone for good.
export const PLAYER_R = 0.25;

const list = [];

export function addCollider(x, z, r) { const c = { x, z, r }; list.push(c); return c; }
export function addSegment(ax, az, bx, bz, half = 0) { const c = { ax, az, bx, bz, half }; list.push(c); return c; }
export function removeCollider(c) { const i = list.indexOf(c); if (i >= 0) list.splice(i, 1); }

function pushFromPoint(pos, cx, cz, min) {
  const dx = pos.x - cx, dz = pos.z - cz, d = Math.hypot(dx, dz);
  if (d >= min || d === 0) return;
  pos.x = cx + dx / d * min; pos.z = cz + dz / d * min;
}

function pushFromSegment(pos, c) {
  const abx = c.bx - c.ax, abz = c.bz - c.az, len2 = abx * abx + abz * abz;
  const t = len2 > 0 ? Math.min(1, Math.max(0, ((pos.x - c.ax) * abx + (pos.z - c.az) * abz) / len2)) : 0;
  pushFromPoint(pos, c.ax + abx * t, c.az + abz * t, PLAYER_R + c.half);
}

// Push `pos` (anything with x/z) out of every collider. A few passes, so being pushed
// out of one thing can't leave you inside another.
export function resolve(pos, passes = 3) {
  for (let i = 0; i < passes; i++) {
    for (const c of list) {
      if (c.r !== undefined) pushFromPoint(pos, c.x, c.z, c.r + PLAYER_R);
      else pushFromSegment(pos, c);
    }
  }
}
