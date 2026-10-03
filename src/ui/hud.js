// HUD: crosshair, interaction prompt, hotbar.
import { $ } from '../core/state.js';
import { ITEMS } from '../items/registry.js';
import { settings } from '../core/settings.js';

const el = document.createElement('div');
el.innerHTML = '<div id="xhair"></div><div id="prompt"></div><div id="hotbar"></div><div id="fpsbox" hidden></div>';
document.body.appendChild(el);

export function setPrompt(text) { $('prompt').innerHTML = text ? `<b>E</b>${text}` : ''; }

export function renderHotbar(inv) {
  $('hotbar').innerHTML = inv.slots.map((s, i) =>
    `<div class="s ${i === inv.active ? 'on' : ''}"><i>${i + 1}</i>${s ? ITEMS[s.id].name : ''}</div>`).join('');
}

// FPS counter (toggle in Settings). Updates twice a second.
let frames = 0, acc = 0;
export function updateFps(realDt) {
  const box = $('fpsbox'); box.hidden = !settings.showFps;
  if (box.hidden) return;
  frames++; acc += realDt;
  if (acc >= 0.5) { box.textContent = `${Math.round(frames / acc)} FPS · ${(acc / frames * 1000).toFixed(1)} мс`; frames = 0; acc = 0; }
}
