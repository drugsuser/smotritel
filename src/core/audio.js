// Ambient sound (surf + wind) and small sound effects.
// ---------- sound: wind + surf ----------
let audioOn = false;
let ac = null;
export function startAudio() {
  if (audioOn) return; audioOn = true;
  ac = new (window.AudioContext || window.webkitAudioContext)();
  const len = ac.sampleRate * 4, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
  const mk = (freq, gain, lfoF, lfoA) => {
    const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = freq;
    const g = ac.createGain(); g.gain.value = gain;
    const lfo = ac.createOscillator(); lfo.frequency.value = lfoF; const la = ac.createGain(); la.gain.value = lfoA;
    lfo.connect(la).connect(g.gain); src.connect(lp).connect(g).connect(ac.destination); src.start(); lfo.start();
  };
  mk(380, 0.5, 0.09, 0.35);  // surf
  mk(1200, 0.12, 0.05, 0.08); // wind
}

// short UI/world sounds
export const sfx = {
  click() {
    if (!ac) return; const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'square'; o.frequency.value = 1800; g.gain.setValueAtTime(0.08, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.05);
    o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.06);
  },
  pickup() {
    if (!ac) return; const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(320, ac.currentTime); o.frequency.exponentialRampToValueAtTime(180, ac.currentTime + 0.12);
    g.gain.setValueAtTime(0.12, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.15);
    o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.16);
  },
};
