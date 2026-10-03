// Simple circular floor colliders: addCollider(x, z, radius).
export const colliders = [];
export function addCollider(x, z, r) { const c = { x, z, r }; colliders.push(c); return c; }
