/** Sound recipes. Each builds its own nodes, schedules them from now and
 *  routes them into `out`. Everything is synthesized: no audio files. */
type Recipe = (ctx: AudioContext, out: AudioNode) => void

const rand = (min: number, max: number) => min + Math.random() * (max - min)

/** Frequency `semitones` above `root`. */
const note = (root: number, semitones: number) =>
  root * Math.pow(2, semitones / 12)

let noise: AudioBuffer | undefined

/** A second of white noise, shared by every recipe. */
function noiseBuffer(ctx: BaseAudioContext) {
  if (!noise) {
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  return noise
}

/** A reverb from decaying noise, `seconds` long. */
function reverb(ctx: BaseAudioContext, seconds: number) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds))
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3)
    }
  }
  const conv = ctx.createConvolver()
  conv.buffer = impulse
  return conv
}

/** A minor chord stacked over three octaves, in semitones above the root.
 *  The last three join late, brightening the top of the swell. */
const CHORD = [0, 12, 15, 19, 24, 27, 31, 36, 39]
const LATE = 3
/** Notes for the high pings after the hit: chord tones plus a few that rub
 *  against them, for the eerie digital sparkle. */
const PINGS = [29, 31, 37, 42, 46, 48]

/** The opening swell: a minor chord of drifting, detuned saws growing
 *  louder and brighter, cut by a low boom, then sparse high pings ringing
 *  out like glyphs in the code rain. Tuned in dev/sound-lab.html. */
export const SWELL = {
  root: 185, // Hz; F#3. 165 is E3
  rise: 0.45, // seconds of swell before the hit
  cutoffStart: 400, // Hz, how dark the swell starts
  cutoffEnd: 7000, // Hz, how bright it peaks
  detune: 9, // cents between each note's three saws; the shimmer
  drift: 6, // cents of slow wandering per saw; the ripple
  swell: 0.5, // chord level at the peak
  boom: 0.6,
  boomDecay: 0.5, // seconds for the boom to die away
  pings: 1, // how many high notes ring out after the hit
  pingDelay: 0.06, // seconds from the hit to the first ping
  pingGap: 0.15, // seconds between pings, give or take
  ring: 0.5, // seconds each ping rings, give or take
  ping: 0.12, // ping level
  space: 0.4, // reverb level
  tail: 1.2, // seconds of reverb
}

export function swell(
  ctx: BaseAudioContext,
  out: AudioNode,
  p: typeof SWELL = SWELL,
) {
  const t0 = ctx.currentTime + 0.02
  const hit = t0 + p.rise

  const mix = ctx.createGain()
  const wet = ctx.createGain()
  wet.gain.value = p.space
  mix.connect(out)
  mix.connect(reverb(ctx, p.tail)).connect(wet).connect(out)

  // Chord: a lowpass opening over the swell, then a quick cut at the hit.
  const tone = ctx.createBiquadFilter()
  tone.type = 'lowpass'
  tone.Q.value = 1.5
  tone.frequency.setValueAtTime(p.cutoffStart, t0)
  tone.frequency.exponentialRampToValueAtTime(p.cutoffEnd, hit)
  const level = ctx.createGain()
  level.gain.setValueAtTime(p.swell * 0.02, t0)
  level.gain.exponentialRampToValueAtTime(p.swell, hit)
  level.gain.setTargetAtTime(0.0001, hit, 0.08)
  tone.connect(level).connect(mix)

  const chordEnd = hit + 0.6
  CHORD.forEach((semi, i) => {
    const late = i >= CHORD.length - LATE
    const voice = ctx.createGain()
    // Higher notes sit quieter; late ones fade in over the last stretch.
    const gain = 1 / (CHORD.length * (1 + i * 0.15))
    voice.gain.setValueAtTime(late ? 0.0001 : gain, t0)
    if (late) {
      voice.gain.setValueAtTime(0.0001, t0 + p.rise * 0.55)
      voice.gain.exponentialRampToValueAtTime(gain, hit)
    }
    voice.connect(tone)

    for (const spread of [-1, 0, 1]) {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.value = note(p.root, semi)
      osc.detune.value = spread * p.detune
      // A slow, random wander per saw keeps the voices rippling.
      const lfo = ctx.createOscillator()
      lfo.frequency.value = rand(0.2, 0.7)
      const depth = ctx.createGain()
      depth.gain.value = p.drift
      lfo.connect(depth).connect(osc.detune)
      osc.connect(voice)
      for (const node of [osc, lfo]) {
        node.start(t0)
        node.stop(chordEnd)
      }
    }
  })

  // Boom: a falling sub plus a thud of low noise.
  const sub = ctx.createOscillator()
  sub.frequency.setValueAtTime(58, hit)
  sub.frequency.exponentialRampToValueAtTime(28, hit + p.boomDecay * 0.75)
  const subLevel = ctx.createGain()
  subLevel.gain.setValueAtTime(0.0001, hit)
  subLevel.gain.exponentialRampToValueAtTime(p.boom, hit + 0.01)
  subLevel.gain.exponentialRampToValueAtTime(0.0001, hit + p.boomDecay)
  sub.connect(subLevel).connect(mix)
  sub.start(hit)
  sub.stop(hit + p.boomDecay + 0.05)

  const thud = ctx.createBufferSource()
  thud.buffer = noiseBuffer(ctx)
  const thudTone = ctx.createBiquadFilter()
  thudTone.type = 'lowpass'
  thudTone.frequency.value = 180
  const thudLevel = ctx.createGain()
  thudLevel.gain.setValueAtTime(p.boom, hit)
  const thudEnd = hit + Math.min(0.5, p.boomDecay)
  thudLevel.gain.exponentialRampToValueAtTime(0.0001, thudEnd)
  thud.connect(thudTone).connect(thudLevel).connect(mix)
  thud.start(hit)
  thud.stop(thudEnd + 0.05)

  // Pings: single high notes ringing out one after another.
  let at = hit + p.pingDelay
  for (let i = 0; i < Math.round(p.pings); i++) {
    const f = note(p.root, PINGS[Math.floor(Math.random() * PINGS.length)])
    const ring = p.ring * rand(0.7, 1.3)
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = f
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0001, at)
    env.gain.exponentialRampToValueAtTime(p.ping, at + 0.005)
    env.gain.exponentialRampToValueAtTime(0.0001, at + ring)
    const pan = ctx.createStereoPanner()
    pan.pan.value = rand(-0.6, 0.6)
    osc.connect(env).connect(pan).connect(mix)
    osc.start(at)
    osc.stop(at + ring + 0.05)
    at += p.pingGap * rand(0.6, 1.4)
  }
}

/** An E minor chord in semitones above the root, each with its weight in
 *  the mix: the B sits on top, as in the film. */
const WARBLE_CHORD: [number, number][] = [
  [0, 0.3], // E3
  [12, 0.8], // E4
  [15, 0.6], // G4
  [19, 1], // B4
  [24, 0.6], // E5
  [27, 0.4], // G5
  [31, 0.4], // B5
]

/** The code-rain ripple: a minor chord whose every voice wavers in pitch
 *  at its own rate, so the voices ripple against each other, with a breath
 *  of high air over the top. Tuned in dev/sound-lab.html. */
export const WARBLE = {
  root: 164.8, // Hz; E3
  voices: 3, // players per note; more is thicker
  rateMin: 3.5, // Hz, slowest waver
  rateMax: 7, // Hz, fastest waver
  depth: 40, // cents each voice wavers, at most
  bright: 2800, // Hz, lowpass on the chord
  attack: 0.4, // seconds
  hold: 1.2, // seconds at full level
  release: 1.2, // seconds to die away
  level: 1.2,
  air: 0.04, // level of the high breath
  space: 0.5, // reverb level
  tail: 1.5, // seconds of reverb
}

export function warble(
  ctx: BaseAudioContext,
  out: AudioNode,
  p: typeof WARBLE = WARBLE,
) {
  const t0 = ctx.currentTime + 0.02
  const held = t0 + p.attack + p.hold
  const end = held + p.release

  const mix = ctx.createGain()
  const wet = ctx.createGain()
  wet.gain.value = p.space
  mix.connect(out)
  mix.connect(reverb(ctx, p.tail)).connect(wet).connect(out)

  // Rise, hold, fall away: shared by every layer.
  const shape = (gain: AudioParam, level: number) => {
    gain.setValueAtTime(0.0001, t0)
    gain.exponentialRampToValueAtTime(level, t0 + p.attack)
    gain.setValueAtTime(level, held)
    gain.exponentialRampToValueAtTime(0.0001, end)
  }

  const tone = ctx.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = p.bright
  tone.Q.value = 0.7
  const chord = ctx.createGain()
  shape(chord.gain, p.level)
  tone.connect(chord).connect(mix)

  const count = Math.max(1, Math.round(p.voices))
  const stop = end + 0.05
  for (const [semi, weight] of WARBLE_CHORD) {
    const noteLevel = ctx.createGain()
    noteLevel.gain.value = weight / (count * WARBLE_CHORD.length)
    noteLevel.connect(tone)
    for (let v = 0; v < count; v++) {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.value = note(p.root, semi)
      osc.detune.value = rand(-8, 8)
      // Each voice wavers at its own rate and depth, so they drift apart.
      const lfo = ctx.createOscillator()
      lfo.frequency.value = rand(p.rateMin, p.rateMax)
      const depth = ctx.createGain()
      depth.gain.value = p.depth * rand(0.5, 1)
      lfo.connect(depth).connect(osc.detune)
      const pan = ctx.createStereoPanner()
      pan.pan.value = rand(-0.7, 0.7)
      osc.connect(pan).connect(noteLevel)
      for (const node of [osc, lfo]) {
        node.start(t0)
        node.stop(stop)
      }
    }
  }

  // Air: high noise over the top.
  if (p.air > 0) {
    const hiss = ctx.createBufferSource()
    hiss.buffer = noiseBuffer(ctx)
    hiss.loop = true
    const airTone = ctx.createBiquadFilter()
    airTone.type = 'highpass'
    airTone.frequency.value = 4000
    const air = ctx.createGain()
    shape(air.gain, p.air)
    hiss.connect(airTone).connect(air).connect(mix)
    hiss.start(t0)
    hiss.stop(stop)
  }
}

/** The glassy cluster that swells up after the second beat, in semitones
 *  above the root: E, G, B, D, E. */
const GLASS = [36, 39, 43, 46, 48]

/** The title cue: two soft low beats half a second apart, the second a
 *  shade darker, over the rippling chord, then a glassy cluster and a
 *  breath of air swelling up after them. Tuned in dev/sound-lab.html. */
export const TITLE = {
  root: 82.4, // Hz; E2
  gap: 0.9, // seconds between the two beats
  hit: 0.4, // beat level
  hitPitch: 41.2, // Hz; E1
  second: 0.94, // the second beat's pitch against the first
  secondLevel: 0.8, // the second beat's level against the first
  hitDecay: 1.2, // seconds for each beat to die away
  click: 0.08, // level of the noise on each beat's attack
  pad: 1.4, // level of the rippling chord
  glass: 0.03, // level of the cluster after the beats
  air: 0.03, // level of the breath with it
  swellRise: 1, // seconds for the cluster to swell up
  fall: 1.4, // seconds for everything to die away
  space: 0.5, // reverb level
  tail: 2, // seconds of reverb
}

export function title(
  ctx: BaseAudioContext,
  out: AudioNode,
  p: typeof TITLE = TITLE,
) {
  const t0 = ctx.currentTime + 0.02
  const swellAt = t0 + p.gap + 0.1
  const top = swellAt + p.swellRise
  const end = top + p.fall

  const mix = ctx.createGain()
  const wet = ctx.createGain()
  wet.gain.value = p.space
  mix.connect(out)
  mix.connect(reverb(ctx, p.tail)).connect(wet).connect(out)

  // The rippling chord under everything, fading with the cluster.
  warble(ctx, mix, {
    ...WARBLE,
    root: p.root,
    attack: 0.15,
    hold: top - t0 - 0.15,
    release: p.fall,
    level: WARBLE.level * p.pad,
    air: 0,
    space: 0,
  })

  // The two beats: a falling low tone and a click of noise each.
  for (const [i, at] of [t0, t0 + p.gap].entries()) {
    const f = p.hitPitch * (i ? p.second : 1)
    const level = p.hit * (i ? p.secondLevel : 1)

    const body = ctx.createOscillator()
    body.frequency.setValueAtTime(f, at)
    body.frequency.exponentialRampToValueAtTime(f * 0.7, at + p.hitDecay * 0.5)
    const bodyLevel = ctx.createGain()
    bodyLevel.gain.setValueAtTime(0.0001, at)
    bodyLevel.gain.exponentialRampToValueAtTime(level, at + 0.008)
    bodyLevel.gain.exponentialRampToValueAtTime(0.0001, at + p.hitDecay)
    body.connect(bodyLevel).connect(mix)
    body.start(at)
    body.stop(at + p.hitDecay + 0.05)

    const click = ctx.createBufferSource()
    click.buffer = noiseBuffer(ctx)
    const clickTone = ctx.createBiquadFilter()
    clickTone.type = 'bandpass'
    clickTone.frequency.value = i ? 2500 : 4000
    const clickLevel = ctx.createGain()
    clickLevel.gain.setValueAtTime(p.click * (i ? p.secondLevel : 1), at)
    clickLevel.gain.exponentialRampToValueAtTime(0.0001, at + 0.07)
    click.connect(clickTone).connect(clickLevel).connect(mix)
    click.start(at)
    click.stop(at + 0.08)
  }

  // The cluster and air swelling up after the beats.
  const swellShape = (gain: AudioParam, level: number) => {
    gain.setValueAtTime(0.0001, swellAt)
    gain.exponentialRampToValueAtTime(level, top)
    gain.exponentialRampToValueAtTime(0.0001, end)
  }
  const glass = ctx.createGain()
  swellShape(glass.gain, p.glass)
  glass.connect(mix)
  for (const semi of GLASS) {
    for (const spread of [-1, 1]) {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = note(p.root, semi)
      osc.detune.value = spread * 6
      const pan = ctx.createStereoPanner()
      pan.pan.value = spread * rand(0.2, 0.6)
      osc.connect(pan).connect(glass)
      osc.start(swellAt)
      osc.stop(end + 0.05)
    }
  }

  const hiss = ctx.createBufferSource()
  hiss.buffer = noiseBuffer(ctx)
  hiss.loop = true
  const airTone = ctx.createBiquadFilter()
  airTone.type = 'highpass'
  airTone.frequency.value = 5000
  const air = ctx.createGain()
  swellShape(air.gain, p.air)
  hiss.connect(airTone).connect(air).connect(mix)
  hiss.start(swellAt)
  hiss.stop(end + 0.05)
}

/** The title motif: a wavering, near-pure tone that swells on one note and
 *  steps up a fourth to the next, the pair repeating, over a faint minor
 *  bed. Tuned in dev/sound-lab.html. */
export const MOTIF = {
  first: 493.9, // Hz; B4
  second: 659.3, // Hz; E5, a fourth above
  firstLength: 0.7, // seconds on the first note
  secondLength: 0.5, // seconds on the second, before the release
  repeats: 1, // how many times the pair plays
  glide: 0.08, // seconds to slide between notes
  attack: 0.2, // seconds for each note to swell in
  accent: 0.3, // how much each note swells on arrival, 0 to 1
  voices: 4, // players on the line; more is thicker
  rate: 5.5, // Hz, the waver
  depth: 25, // cents of waver
  bright: 1400, // Hz, lowpass; lower is purer
  level: 0.5,
  bed: 0.2, // level of the minor chord under it
  release: 1.5, // seconds to die away after the last note
  space: 0.5, // reverb level
  tail: 2, // seconds of reverb
}

export function motif(
  ctx: BaseAudioContext,
  out: AudioNode,
  p: typeof MOTIF = MOTIF,
) {
  const t0 = ctx.currentTime + 0.02
  const pair = p.firstLength + p.secondLength
  const count = Math.max(1, Math.round(p.repeats))
  const last = t0 + pair * count
  const end = last + p.release

  const mix = ctx.createGain()
  const wet = ctx.createGain()
  wet.gain.value = p.space
  mix.connect(out)
  mix.connect(reverb(ctx, p.tail)).connect(wet).connect(out)

  // The line's level: a swell on each note, held, then released.
  const tone = ctx.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = p.bright
  tone.Q.value = 0.5
  const line = ctx.createGain()
  const base = p.level * (1 - p.accent)
  line.gain.setValueAtTime(0.0001, t0)
  for (let i = 0; i < count; i++) {
    for (const [offset, length] of [
      [0, p.firstLength],
      [p.firstLength, p.secondLength],
    ]) {
      const at = t0 + i * pair + offset
      line.gain.setTargetAtTime(p.level, at, p.attack / 3)
      line.gain.setTargetAtTime(
        Math.max(base, 0.0001),
        at + p.attack,
        length / 3,
      )
    }
  }
  line.gain.setTargetAtTime(0.0001, last, p.release / 4)
  tone.connect(line).connect(mix)

  const voices = Math.max(1, Math.round(p.voices))
  for (let v = 0; v < voices; v++) {
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.detune.value = rand(-6, 6)
    osc.frequency.value = p.first
    for (let i = 0; i < count; i++) {
      const at = t0 + i * pair
      osc.frequency.setTargetAtTime(p.first, at, p.glide / 3 || 0.001)
      osc.frequency.setTargetAtTime(
        p.second,
        at + p.firstLength,
        p.glide / 3 || 0.001,
      )
    }
    const lfo = ctx.createOscillator()
    lfo.frequency.value = p.rate * rand(0.85, 1.15)
    const depth = ctx.createGain()
    depth.gain.value = p.depth * rand(0.6, 1)
    lfo.connect(depth).connect(osc.detune)
    const pan = ctx.createStereoPanner()
    pan.pan.value = voices > 1 ? (v / (voices - 1)) * 1.2 - 0.6 : 0
    const share = ctx.createGain()
    share.gain.value = 1 / voices
    osc.connect(share).connect(pan).connect(tone)
    for (const node of [osc, lfo]) {
      node.start(t0)
      node.stop(end + 0.05)
    }
  }

  // The faint rippling minor chord beneath, an octave down from the line.
  if (p.bed > 0) {
    warble(ctx, mix, {
      ...WARBLE,
      root: (p.first * 2) / 3 / 2, // E below the first note's B
      attack: 0.1,
      hold: last - t0,
      release: p.release,
      level: WARBLE.level * p.bed,
      air: 0,
      space: 0,
    })
  }
}

export const sounds = {
  swell: (ctx, out) => swell(ctx, out),
  warble: (ctx, out) => warble(ctx, out),
  title: (ctx, out) => title(ctx, out),
  motif: (ctx, out) => motif(ctx, out),
} satisfies Record<string, Recipe>

export type SoundName = keyof typeof sounds
