/**
 * sounds.js
 * Retro arcade sound effects synthesized with the Web Audio API - no audio
 * files needed, so it works offline and adds nothing to the deploy bundle.
 *
 * The AudioContext is created lazily and only after a user gesture (Start
 * Booth), which satisfies the browser autoplay policy.
 */

let ctx = null;
let printer = null;

function ensureAudio() {
  if (!ctx && typeof window !== 'undefined') {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Short pitched blip with a click-free fade envelope
function tone({ freq = 520, type = 'square', duration = 0.09, gain = 0.12, when = 0, freqEnd = null }) {
  const c = ensureAudio();
  if (!c) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + duration);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

// Short filtered noise burst (shutter, clacks)
function noiseBurst({ duration = 0.06, gain = 0.15, when = 0, filter = 2000 }) {
  const c = ensureAudio();
  if (!c) return;
  const t0 = c.currentTime + when;
  const len = Math.max(1, Math.floor(c.sampleRate * duration));
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = filter;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t0);
  src.stop(t0 + duration + 0.02);
}

// Unlock / create the AudioContext from a user gesture
export function unlockAudio() {
  return ensureAudio();
}

// Countdown: one soft tick per second, higher final blip right before capture
export function playTick(final = false) {
  if (final) {
    tone({ freq: 880, duration: 0.12, gain: 0.16 });
    tone({ freq: 1320, duration: 0.08, gain: 0.07, when: 0.05 });
  } else {
    tone({ freq: 620, duration: 0.08, gain: 0.11 });
  }
}

// Camera shutter at the moment of capture (with the flash)
export function playShutter() {
  noiseBurst({ duration: 0.06, gain: 0.22, filter: 2600 });
  tone({ freq: 170, type: 'sine', duration: 0.08, gain: 0.14, freqEnd: 70 });
}

// Printing machine: low motor hum with a wobble + rhythmic clacks
// while the strip slides out. Idempotent until stopPrinting() is called.
export function startPrinting() {
  const c = ensureAudio();
  if (!c || printer) return;

  const master = c.createGain();
  master.gain.setValueAtTime(0.0001, c.currentTime);
  master.gain.setTargetAtTime(0.1, c.currentTime, 0.02);
  master.connect(c.destination);

  const motor = c.createOscillator();
  motor.type = 'sawtooth';
  motor.frequency.value = 62;

  const lfo = c.createOscillator();
  lfo.frequency.value = 9;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 4;
  lfo.connect(lfoGain).connect(motor.frequency);

  const lowpass = c.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 240;
  motor.connect(lowpass).connect(master);

  const interval = setInterval(() => {
    noiseBurst({ duration: 0.03, gain: 0.08, filter: 1200 });
    tone({ freq: 220, type: 'square', duration: 0.03, gain: 0.04 });
  }, 190);

  motor.start();
  lfo.start();
  printer = { master, motor, lfo, interval };
}

// Fade the printer out and release everything
export function stopPrinting() {
  const c = ensureAudio();
  const h = printer;
  printer = null;
  if (!c || !h) return;
  h.master.gain.setTargetAtTime(0.0001, c.currentTime, 0.05);
  const stopAt = c.currentTime + 0.5;
  clearInterval(h.interval);
  try {
    h.motor.stop(stopAt);
    h.lfo.stop(stopAt);
  } catch (err) {
    /* already stopped */
  }
}

// Cheerful two-tone chime when the strip is ready
export function playReadyChime() {
  [660, 880].forEach((freq, i) => {
    tone({ freq, type: 'sine', duration: 0.18, gain: 0.11, when: i * 0.14 });
  });
}