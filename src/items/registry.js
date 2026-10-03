// ITEM REGISTRY. To add an item: create src/items/<name>.js and register it here.
// Item shape:
//   name: string                      shown in hotbar / prompts
//   makeModel(): Object3D             low-poly model (used both in the world and in hand)
//   hold: { pos:[x,y,z], rot:[x,y,z] } placement in the hand (camera space)
//   onEquip?(st) onUnequip?(st) onUse?(st)   st = per-slot state, st.model = model in hand
import { flashlight } from './flashlight.js';

export const ITEMS = {
  flashlight,
};
