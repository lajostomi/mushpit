// MycoPulse -> Strudel: a choir sung by mycelium
// Paste into https://strudel.cc and press Ctrl+Enter.
// The first run asks you to pick the Arduino's serial port (Chrome/Edge only).
// With no port chosen it falls back to a simulated drifting signal, so you can hear the patch.
//
// Expected serial line (115200 baud): any CSV whose LAST field is the bio-resistance (ohms), e.g.
//   12345,10432.7
// Change parseLine() below if your sketch prints something else.

// ───────────── 1. serial bridge (runs once per page load) ─────────────
globalThis.myco ??= { v: 0.5, d: 0, raw: 0, min: Infinity, max: -Infinity, live: false }

const parseLine = (line) => parseFloat(line.trim().split(',').pop())

const feed = (raw) => {
  const s = globalThis.myco
  if (!isFinite(raw)) return
  // adaptive range: min/max slowly relax toward the current value so the patch re-centres itself
  s.min = Math.min(isFinite(s.min) ? s.min + (raw - s.min) * 0.0005 : raw, raw)
  s.max = Math.max(isFinite(s.max) ? s.max + (raw - s.max) * 0.0005 : raw, raw)
  const span = Math.max(s.max - s.min, 1e-6)
  const v = (raw - s.min) / span
  const prev = s.v
  s.v = prev + (v - prev) * 0.15                       // smoothed level 0..1
  s.d = Math.min(1, s.d * 0.9 + Math.abs(v - prev) * 8) // "activity": how fast it is changing 0..1
  s.raw = raw
}

if (!globalThis.__mycoBridge) {
  globalThis.__mycoBridge = true

  // simulated mycelium until real data arrives
  let t = 0
  setInterval(() => {
    if (globalThis.myco.live) return
    t += 0.05
    feed(10000 + 2500 * Math.sin(t * 0.3) + 800 * Math.sin(t * 1.7) + (Math.random() - 0.5) * 300)
  }, 100)

  const open = async () => {
    const ports = await navigator.serial.getPorts()
    const port = ports[0] ?? (await navigator.serial.requestPort())
    await port.open({ baudRate: 115200 })
    globalThis.myco.live = true
    const reader = port.readable.pipeThrough(new TextDecoderStream()).getReader()
    let buf = ''
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buf += value
      const lines = buf.split('\n')
      buf = lines.pop()
      lines.forEach((l) => feed(parseLine(l)))
    }
    globalThis.myco.live = false
  }
  if ('serial' in navigator) open().catch((e) => console.warn('MycoPulse: serial unavailable, using simulation —', e.message))
}

// ───────────── 2. mapping ─────────────
const lvl = signal(() => globalThis.myco.v) // slow resistance level, 0..1
const act = signal(() => globalThis.myco.d) // rate of change, 0..1

// resistance level picks the vowel; the vowel changes about once per cycle
const vow = lvl.segment(1).fmap((v) => 'aeiou'[Math.min(4, Math.floor(v * 5))])

setcps(0.35)

// ───────────── 3. voices ─────────────
// Built from recorded human-voice sounds (GM choir / voice soundfonts + spoken numbers),
// not synthesized formants, so it reads as people rather than a buzzy synth.
stack(
  // choir "aahs": pitch follows resistance, brightness follows activity
  n(lvl.segment(4).range(0, 10)).scale('D4:minor:pentatonic')
    .s('gm_choir_aahs').attack(0.15).release(0.8)
    .lpf(act.range(1500, 6000)).room(0.8).gain(0.8),

  // "oohs" an octave below, slow, follows the level more gently
  n(lvl.segment(1).range(0, 6)).scale('D3:minor:pentatonic')
    .s('gm_voice_oohs').attack(0.4).release(1.5).room(0.9).gain(0.7),

  // solo voice lead: only sings when the mycelium is active (act > 0.25)
  n(lvl.segment(8).range(0, 12)).scale('D4:minor:pentatonic')
    .s('gm_lead_6_voice').gain(act.segment(8).fmap((a) => (a > 0.25 ? 0.6 : 0)))
    .room(0.6).delay(0.3),

  // breath: recorded breath noise, louder with activity
  s('gm_breath_noise').n(lvl.segment(1).range(0, 7).floor()).slow(2)
    .gain(act.range(0.1, 0.6)).hpf(500).room(0.6).pan(sine.slow(7)),

  // spoken syllables: whispered numbers, rate-limited, picked by level
  s('numbers*2').n(lvl.segment(2).range(0, 8).floor())
    .degradeBy(0.5).gain(act.range(0.1, 0.5)).speed(0.9).lpf(2500).room(0.8).pan(sine.slow(11))
)
