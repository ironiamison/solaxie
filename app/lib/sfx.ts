// ---------------------------------------------------------------------------
// Solaxie SFX — tiny Web Audio synth. No audio files; everything is generated.
// AudioContext is created lazily on the first user gesture (spin/click), which
// satisfies browser autoplay policies.
// ---------------------------------------------------------------------------

type Win = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
const VOLUME = 0.5;

type AmbientHandle = { stop: () => void };
let ambient: AmbientHandle | null = null;
let ambientMaster: GainNode | null = null;
const AMBIENT_VOL = 0.055;

if (typeof window !== "undefined") {
  muted = window.localStorage?.getItem("solaxie_muted") === "1";
}

function makePinkNoiseBuffer(c: AudioContext, seconds = 3): AudioBuffer {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  return buf;
}

function ambientPluck(c: AudioContext, dest: AudioNode, freq: number) {
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq * 1.5, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq), t0 + 0.06);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(0.032, t0 + 0.018);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.8);
  const delay = c.createDelay(0.6);
  delay.delayTime.value = 0.42;
  const fb = c.createGain();
  fb.gain.value = 0.22;
  const wet = c.createGain();
  wet.gain.value = 0.18;
  osc.connect(g);
  g.connect(dest);
  g.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(wet);
  wet.connect(dest);
  osc.start(t0);
  osc.stop(t0 + 3.2);
}

function stopAmbient() {
  ambient?.stop();
  ambient = null;
  if (ambientMaster) {
    ambientMaster.disconnect();
    ambientMaster = null;
  }
}

function startAmbient() {
  const c = ensure();
  if (!c || !master || muted) return;
  if (ambient) {
    if (c.state === "suspended") void c.resume();
    return;
  }

  stopAmbient();

  ambientMaster = c.createGain();
  ambientMaster.gain.value = AMBIENT_VOL;
  ambientMaster.connect(master);

  const stops: (() => void)[] = [];

  // Soft wind / water bed — no tonal drone
  const bed = c.createBufferSource();
  bed.buffer = makePinkNoiseBuffer(c, 4);
  bed.loop = true;
  const bedLp = c.createBiquadFilter();
  bedLp.type = "lowpass";
  bedLp.frequency.value = 320;
  bedLp.Q.value = 0.4;
  const bedGain = c.createGain();
  bedGain.gain.value = 0.35;
  bed.connect(bedLp);
  bedLp.connect(bedGain);
  bedGain.connect(ambientMaster);
  bed.start();
  stops.push(() => { try { bed.stop(); } catch { /* */ } });

  // Sparse pentatonic harp plucks — slow, random, never stacked
  const scale = [196, 220, 246.94, 261.63, 293.66, 329.63, 392]; // G pentatonic, low register
  let pluckTimer: ReturnType<typeof setTimeout>;
  const schedulePluck = () => {
    if (muted || !ambientMaster) return;
    const f = scale[Math.floor(Math.random() * scale.length)];
    ambientPluck(c, ambientMaster, f);
    pluckTimer = setTimeout(schedulePluck, 4200 + Math.random() * 5200);
  };
  pluckTimer = setTimeout(schedulePluck, 800);
  stops.push(() => clearTimeout(pluckTimer));

  ambient = {
    stop: () => stops.forEach((fn) => fn()),
  };
}

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as Win).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : VOLUME;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type NoteOpts = { type?: OscillatorType; gain?: number; slideTo?: number };

function note(freq: number, start: number, dur: number, opts: NoteOpts = {}) {
  const c = ensure();
  if (!c || !master) return;
  const { type = "sine", gain = 0.3, slideTo } = opts;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

function noise(start: number, dur: number, gain = 0.2, freq = 1200) {
  const c = ensure();
  if (!c || !master) return;
  const t0 = c.currentTime + start;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = "bandpass";
  filt.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filt);
  filt.connect(g);
  g.connect(master);
  src.start(t0);
  src.stop(t0 + dur);
}

const C_MAJOR = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1318.5];
const TIER_LEVEL: Record<string, number> = { Common: 1, Rare: 2, Epic: 3, Legendary: 4, Cosmic: 5 };

export const sfx = {
  setMuted(m: boolean) {
    muted = m;
    if (master) master.gain.value = m ? 0 : VOLUME;
    if (ambientMaster) ambientMaster.gain.value = m ? 0 : AMBIENT_VOL;
    if (typeof window !== "undefined") window.localStorage?.setItem("solaxie_muted", m ? "1" : "0");
  },
  toggleMuted(): boolean {
    this.setMuted(!muted);
    return muted;
  },
  isMuted() {
    return muted;
  },

  /** Unlock audio + start the looping island ambience (needs a user gesture first). */
  startAmbient() {
    startAmbient();
  },
  stopAmbient() {
    stopAmbient();
  },

  click() {
    note(520, 0, 0.08, { type: "square", gain: 0.1, slideTo: 360 });
  },

  /** ~1.2s rising anticipation sweep with sparkle ticks. */
  charge() {
    note(170, 0, 1.2, { type: "sawtooth", gain: 0.12, slideTo: 1100 });
    note(340, 0, 1.2, { type: "sine", gain: 0.07, slideTo: 2000 });
    for (let i = 0; i < 9; i++) note(700 + i * 130, 0.08 * i, 0.06, { type: "triangle", gain: 0.045 });
  },

  /** Impact + rarity-scaled chime. Higher rarity = longer, brighter, sparklier. */
  reveal(rarity: string) {
    const tier = TIER_LEVEL[rarity] ?? 1;
    noise(0, 0.18, 0.22, 900);
    note(90, 0, 0.26, { type: "sine", gain: 0.3, slideTo: 55 });
    const steps = 2 + tier;
    for (let i = 0; i < steps; i++) {
      const oct = 1 + Math.floor(i / C_MAJOR.length);
      note(C_MAJOR[i % C_MAJOR.length] * oct, 0.12 + i * 0.07, 0.5, { type: "triangle", gain: 0.17 });
    }
    if (tier >= 3) for (let i = 0; i < 6; i++) note(1500 + Math.random() * 1600, 0.5 + i * 0.08, 0.3, { type: "sine", gain: 0.05 });
    if (tier >= 5) [1046.5, 1318.5, 1568, 2093].forEach((f) => note(f, 0.62, 1.3, { type: "sine", gain: 0.09 }));
  },

  coin() {
    note(880, 0, 0.08, { type: "square", gain: 0.11 });
    note(1320, 0.05, 0.1, { type: "square", gain: 0.11 });
  },

  /** Soft "thump-thump" heartbeat — used when showing compatibility. */
  heartbeat() {
    note(120, 0, 0.16, { type: "sine", gain: 0.26, slideTo: 60 });
    note(120, 0.22, 0.2, { type: "sine", gain: 0.22, slideTo: 55 });
  },

  /** Warm, hopeful rising sweep with twinkles for starting a breed. */
  breedCharge() {
    note(220, 0, 1.5, { type: "sine", gain: 0.12, slideTo: 880 });
    note(330, 0, 1.5, { type: "triangle", gain: 0.08, slideTo: 1320 });
    for (let i = 0; i < 12; i++) note(660 + i * 90, 0.1 * i, 0.08, { type: "sine", gain: 0.05 });
  },

  /** A short, dry crack — the egg breaking open. `n` 0..3 escalates pitch. */
  eggCrack(n = 0) {
    noise(0, 0.06, 0.22 + n * 0.04, 1600 + n * 600);
    note(180 + n * 90, 0, 0.1, { type: "square", gain: 0.12, slideTo: 90 });
  },

  /** Bright, joyful hatch fanfare layered over the rarity reveal chime. */
  hatch(rarity: string) {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => note(f, i * 0.07, 0.4, { type: "triangle", gain: 0.16 }));
    this.reveal(rarity);
  },

  /**
   * Layered combat impact: a quick incoming whoosh, a punchy sub thump, a mid
   * "body" smack, and a sharp transient crack. Crits add a metallic ring + sub
   * boom; super-effective hits add a bright zing.
   */
  hit(crit = false, eff = false) {
    // incoming whoosh (the lunge)
    noise(0, 0.1, crit ? 0.13 : 0.09, crit ? 2400 : 1700);
    // sub thump — the weight of the blow
    note(155, 0.06, crit ? 0.26 : 0.2, { type: "sine", gain: crit ? 0.36 : 0.26, slideTo: crit ? 42 : 56 });
    // mid body smack
    note(crit ? 250 : 205, 0.06, 0.12, { type: "square", gain: crit ? 0.2 : 0.13, slideTo: crit ? 95 : 82 });
    // sharp transient crack
    noise(0.055, crit ? 0.09 : 0.05, crit ? 0.27 : 0.17, crit ? 3200 : 2100);
    if (crit) {
      // metallic ring + bright sparkle + low boom tail
      note(1250, 0.07, 0.5, { type: "triangle", gain: 0.13, slideTo: 1750 });
      note(1900, 0.08, 0.42, { type: "sine", gain: 0.08 });
      note(72, 0.07, 0.55, { type: "sine", gain: 0.3, slideTo: 38 });
    } else if (eff) {
      note(940, 0.07, 0.3, { type: "triangle", gain: 0.11, slideTo: 1320 });
    }
  },

  /** Whoosh used for a lunge / dodge with no contact. */
  whoosh() {
    noise(0, 0.16, 0.1, 1400);
    note(420, 0, 0.16, { type: "sine", gain: 0.06, slideTo: 1100 });
  },

  /** Rising fanfare sting when an opponent is found. */
  match() {
    noise(0, 0.12, 0.1, 600);
    note(293.66, 0, 0.16, { type: "triangle", gain: 0.16 });
    note(440, 0.08, 0.16, { type: "triangle", gain: 0.16 });
    note(587.33, 0.16, 0.16, { type: "triangle", gain: 0.18 });
    note(880, 0.26, 0.3, { type: "triangle", gain: 0.2 });
    note(1174.7, 0.26, 0.34, { type: "sine", gain: 0.1 });
  },

  win() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, i * 0.09, 0.42, { type: "triangle", gain: 0.17 }));
  },

  lose() {
    [440, 392, 330, 262].forEach((f, i) => note(f, i * 0.1, 0.42, { type: "sawtooth", gain: 0.1 }));
  },
};
