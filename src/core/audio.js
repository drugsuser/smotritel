// Ambient sound (surf + wind) and small sound effects.
// Everything goes through `master` so the volume setting controls it all.
import { settings } from './settings.js';

let ac = null, master = null, noiseBuf = null;

// normalized brown noise, 4 s loop
function makeNoise() {
  const len = ac.sampleRate * 4, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  let last = 0, peak = 0;
  for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last; peak = Math.max(peak, Math.abs(last)); }
  for (let i = 0; i < len; i++) d[i] /= peak;
  return buf;
}

// noise -> filter -> gain (slowly modulated by an LFO)
function layer({ type = 'lowpass', freq, q = 0.7, gain, lfoHz, lfoDepth }) {
  const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  src.playbackRate.value = 0.9 + Math.random() * 0.2;
  const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ac.createGain(); g.gain.value = gain;
  const lfo = ac.createOscillator(); lfo.frequency.value = lfoHz;
  const depth = ac.createGain(); depth.gain.value = lfoDepth;
  lfo.connect(depth).connect(g.gain);
  src.connect(f).connect(g).connect(master);
  src.start(); lfo.start();
}

export function startAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  ac = new (window.AudioContext || window.webkitAudioContext)();
  master = ac.createGain(); master.gain.value = settings.volume;
  master.connect(ac.destination);
  noiseBuf = makeNoise();
  layer({ freq: 420, gain: 0.55, lfoHz: 0.08, lfoDepth: 0.4 });             // big slow waves
  layer({ freq: 900, gain: 0.18, lfoHz: 0.13, lfoDepth: 0.15 });            // surf hiss on top
  layer({ type: 'bandpass', freq: 650, q: 0.9, gain: 0.12, lfoHz: 0.05, lfoDepth: 0.1 }); // wind
}

export function setVolume(v) { if (master) master.gain.setTargetAtTime(v, ac.currentTime, 0.05); }

// browsers may suspend audio until a user gesture — wake it up on any input
for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, () => { if (ac && ac.state === 'suspended') ac.resume(); });

// short UI/world sounds
function blip(type, f0, f1, vol, dur) {
  if (!ac) return; const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
  o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.01);
}
export const sfx = {
  click: () => blip('square', 1800, 1800, 0.2, 0.05),
  pickup: () => blip('triangle', 320, 180, 0.35, 0.15),
};

// Metal footstep: short noise "thud" + a few inharmonic partials (grating ring).
let stepBuf = null;
function whiteBuf() {
  if (!stepBuf) {
    const len = ac.sampleRate * 0.2; stepBuf = ac.createBuffer(1, len, ac.sampleRate);
    const d = stepBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  return stepBuf;
}
export function stepSound() {
  if (!ac) return;
  const t = ac.currentTime; whiteBuf();
  const vary = 0.85 + Math.random() * 0.3; // no two steps sound identical
  // thud
  const n = ac.createBufferSource(); n.buffer = stepBuf; n.playbackRate.value = vary;
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900 * vary; bp.Q.value = 1.2;
  const ng = ac.createGain(); ng.gain.setValueAtTime(0.9, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  n.connect(bp).connect(ng).connect(master); n.start(t); n.stop(t + 0.2);
  // metallic ring
  for (const [f, v, dur] of [[620, 0.12, 0.25], [1470, 0.07, 0.18], [2310, 0.04, 0.12]]) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = f * vary;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.01);
  }
}

// Rusty metal door: stick-slip scrape. A sawtooth + grit noise is chopped into irregular
// "stick / slip" pulses and rung through a few metallic resonances.
export function creakSound(dur = 1) {
  if (!ac) return;
  const t0 = ac.currentTime, end = t0 + dur;
  const out = ac.createGain();
  out.gain.setValueAtTime(0.0001, t0); out.gain.exponentialRampToValueAtTime(0.55, t0 + 0.06);
  out.gain.setValueAtTime(0.55, end - 0.2); out.gain.exponentialRampToValueAtTime(0.0001, end);
  out.connect(master);
  const chop = ac.createGain(); chop.gain.value = 0;
  const o = ac.createOscillator(); o.type = 'sawtooth'; o.connect(chop);
  const grit = ac.createBufferSource(); grit.buffer = whiteBuf(); grit.loop = true;
  const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2200;
  const gg = ac.createGain(); gg.gain.value = 0.25; grit.connect(hp).connect(gg).connect(chop);
  let t = t0, f = 95 + Math.random() * 50;
  while (t < end) {
    f = Math.min(260, Math.max(60, f + (Math.random() - 0.45) * 50));
    o.frequency.setValueAtTime(f, t);
    chop.gain.setValueAtTime(Math.random() < 0.7 ? 0.5 + Math.random() * 0.5 : 0.03, t);
    t += 0.012 + Math.random() * 0.045;
  }
  for (const [fr, q, v] of [[780, 7, 1], [1530, 9, 0.6], [2650, 12, 0.35]]) {
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fr * (0.95 + Math.random() * 0.1); bp.Q.value = q;
    const g = ac.createGain(); g.gain.value = v; chop.connect(bp).connect(g).connect(out);
  }
  o.start(t0); o.stop(end + 0.05); grit.start(t0); grit.stop(end + 0.05);
}

// Heavy metal door shutting: low thud + short ring.
export function clankSound() {
  if (!ac) return;
  const t = ac.currentTime;
  const n = ac.createBufferSource(); n.buffer = whiteBuf();
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
  const ng = ac.createGain(); ng.gain.setValueAtTime(1.2, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  n.connect(lp).connect(ng).connect(master); n.start(t); n.stop(t + 0.2);
  for (const [f, v, dur] of [[190, 0.25, 0.4], [430, 0.12, 0.3], [1170, 0.05, 0.2]]) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.01);
  }
}
