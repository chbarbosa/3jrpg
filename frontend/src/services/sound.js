// Synthesised sound effects via Web Audio API — no audio files required.
// To use real audio files instead, replace the SYNTH map with Howler instances
// and load them from public/sounds/*.mp3.

let _ctx = null;
let _enabled = true;

function ctx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

// freq: Hz, start: AudioContext time, dur: seconds, type: OscillatorType, vol: 0-1
// freqEnd: optional target frequency (exponential ramp)
function tone(freq, start, dur, type = 'sine', vol = 0.25, freqEnd = null) {
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (freqEnd !== null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), start + dur);
  }
  gain.gain.setValueAtTime(vol, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

const SYNTH = {
  hit() {
    const t = ctx().currentTime;
    tone(200, t, 0.08, 'sawtooth', 0.4, 70);
  },

  skill() {
    const t = ctx().currentTime;
    tone(440, t,       0.06, 'sine', 0.2);
    tone(660, t + 0.05, 0.06, 'sine', 0.2);
    tone(880, t + 0.10, 0.10, 'sine', 0.15);
  },

  statusApply() {
    const t = ctx().currentTime;
    tone(300, t, 0.12, 'square', 0.12);
    tone(450, t, 0.12, 'square', 0.08);
  },

  enemyDeath() {
    const t = ctx().currentTime;
    tone(350, t,        0.05, 'sawtooth', 0.3);
    tone(200, t + 0.04, 0.20, 'sawtooth', 0.25, 60);
  },

  heroDeath() {
    const t = ctx().currentTime;
    tone(330, t,        0.15, 'sine', 0.28);
    tone(220, t + 0.12, 0.22, 'sine', 0.22);
    tone(165, t + 0.28, 0.30, 'sine', 0.18);
  },

  victory() {
    const t = ctx().currentTime;
    const notes   = [523, 659, 784, 1047, 784, 1047];
    const offsets = [  0, 0.1, 0.2,  0.3, 0.45, 0.55];
    notes.forEach((f, i) => tone(f, t + offsets[i], 0.15, 'sine', 0.2));
  },

  gameOver() {
    const t = ctx().currentTime;
    [440, 370, 294, 220].forEach((f, i) =>
      tone(f, t + i * 0.22, 0.24, 'sine', 0.22));
  },

  uiClick() {
    const t = ctx().currentTime;
    tone(900, t, 0.04, 'square', 0.1);
  },

  uiNav() {
    const t = ctx().currentTime;
    tone(700, t, 0.025, 'sine', 0.05);
  },

  itemUse() {
    const t = ctx().currentTime;
    tone(660, t,        0.06, 'sine', 0.18);
    tone(880, t + 0.05, 0.10, 'sine', 0.13);
  },

  lootDrop() {
    const t = ctx().currentTime;
    [660, 880, 1100, 1320].forEach((f, i) =>
      tone(f, t + i * 0.07, 0.12, 'sine', 0.15));
  },

  magicFire() {
    const t = ctx().currentTime;
    tone(220, t,        0.08, 'sawtooth', 0.2, 440);
    tone(440, t + 0.06, 0.10, 'sawtooth', 0.18, 880);
    tone(660, t + 0.14, 0.12, 'sine',     0.12);
  },

  magicIce() {
    const t = ctx().currentTime;
    tone(1200, t,        0.04, 'sine', 0.12, 900);
    tone(900,  t + 0.04, 0.08, 'sine', 0.15, 1100);
    tone(1100, t + 0.10, 0.12, 'sine', 0.10, 800);
  },

  magicElectric() {
    const t = ctx().currentTime;
    tone(800,  t,        0.03, 'square', 0.15);
    tone(1600, t + 0.02, 0.03, 'square', 0.12);
    tone(800,  t + 0.05, 0.03, 'square', 0.10);
    tone(1200, t + 0.08, 0.08, 'sawtooth', 0.13);
  },

  magicArcane() {
    const t = ctx().currentTime;
    tone(300, t,        0.10, 'sine', 0.18, 600);
    tone(600, t + 0.08, 0.12, 'sine', 0.15, 300);
    tone(900, t + 0.16, 0.10, 'sine', 0.10);
  },

  magicLight() {
    const t = ctx().currentTime;
    [523, 659, 784].forEach((f, i) =>
      tone(f, t + i * 0.07, 0.10, 'sine', 0.15));
    tone(1047, t + 0.22, 0.14, 'sine', 0.12);
  },
};

// Called on first user interaction to unlock AudioContext under browser autoplay rules.
export function loadSounds() {
  ctx(); // creates and starts AudioContext during user gesture
}

export function setSoundEnabled(enabled) {
  _enabled = enabled;
}

export function isSoundEnabled() {
  return _enabled;
}

export function playSound(key) {
  if (!_enabled) return;
  try { SYNTH[key]?.(); } catch (_) {}
}
