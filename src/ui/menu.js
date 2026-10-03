// Main menu, pause (Esc) and settings screen.
import { cvs } from '../core/engine.js';
import { state, $ } from '../core/state.js';
import { settings, saveSettings } from '../core/settings.js';
import { startAudio, setVolume } from '../core/audio.js';

const overlay = $('overlay');

// --- settings controls (add new ones here + in index.html) ---
$('sens').value = settings.sens; $('sensVal').textContent = (+settings.sens).toFixed(2);
$('sens').addEventListener('input', (e) => { settings.sens = +e.target.value; $('sensVal').textContent = settings.sens.toFixed(2); saveSettings(); });

const pct = (v) => Math.round(v * 100) + '%';
$('vol').value = settings.volume; $('volVal').textContent = pct(settings.volume);
$('vol').addEventListener('input', (e) => { settings.volume = +e.target.value; $('volVal').textContent = pct(settings.volume); setVolume(settings.volume); saveSettings(); });

$('fps').checked = settings.showFps;
$('fps').addEventListener('change', (e) => { settings.showFps = e.target.checked; saveSettings(); });

const lock = () => { try { cvs.requestPointerLock?.()?.catch?.(() => {}); } catch (e) {} };

export function showMenu() { state.paused = true; overlay.style.display = 'flex'; $('menu').hidden = false; $('settings').hidden = true; }
export function hideMenu() { overlay.style.display = 'none'; state.paused = false; }
export function resume() {
  hideMenu(); startAudio();
  if (!state.started) { state.started = true; $('play').textContent = 'ПРОДОЛЖИТЬ'; }
  lock();
}
$('play').addEventListener('click', resume);
$('openSettings').addEventListener('click', () => { $('menu').hidden = true; $('settings').hidden = false; });
$('back').addEventListener('click', () => { $('menu').hidden = false; $('settings').hidden = true; });
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && state.started) showMenu(); });
addEventListener('keydown', (e) => { if (e.code === 'Escape' && !document.pointerLockElement) { state.paused ? (state.started && resume()) : showMenu(); } });
cvs.addEventListener('click', () => { if (!state.paused && !document.pointerLockElement) lock(); });
