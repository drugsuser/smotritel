// HUD: crosshair, interaction prompt, hotbar.
import { $ } from '../core/state.js';
import { ITEMS } from '../items/registry.js';

const el = document.createElement('div');
el.innerHTML = '<div id="xhair"></div><div id="prompt"></div><div id="hotbar"></div>';
document.body.appendChild(el);

export function setPrompt(text) { $('prompt').innerHTML = text ? `<b>E</b>${text}` : ''; }

export function renderHotbar(inv) {
  $('hotbar').innerHTML = inv.slots.map((s, i) =>
    `<div class="s ${i === inv.active ? 'on' : ''}"><i>${i + 1}</i>${s ? ITEMS[s.id].name : ''}</div>`).join('');
}
