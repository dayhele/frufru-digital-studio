import { loadMuted, saveMuted } from './storage'

const MASTER_VOLUME = 0.22
const SILENCE = 0.0001

type AudioContextCtor = typeof AudioContext

function audioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null
  const legacy = (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext
  return window.AudioContext ?? legacy ?? null
}

/**
 * Efeitos 8-bit gerados em tempo real (osciladores quadrado/triângulo e ruído).
 * Nenhum arquivo de áudio; o AudioContext só nasce no primeiro gesto do usuário.
 */
export class ChipAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noise: AudioBuffer | null = null
  private isMuted = loadMuted()
  private disposed = false
  private readonly suspend = (): void => {
    if (this.ctx?.state === 'running') void this.ctx.suspend().catch(() => undefined)
  }

  get muted(): boolean {
    return this.isMuted
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted
    saveMuted(muted)
    if (this.ctx && this.master) {
      this.master.gain.setValueAtTime(muted ? 0 : MASTER_VOLUME, this.ctx.currentTime)
    }
  }

  /** Chame dentro de um gesto do usuário (tecla, clique, toque). */
  unlock(): void {
    if (this.disposed) return
    if (!this.ctx) {
      const Ctor = audioContextCtor()
      if (!Ctor) return
      try {
        const ctx = new Ctor()
        const master = ctx.createGain()
        master.gain.value = this.isMuted ? 0 : MASTER_VOLUME
        master.connect(ctx.destination)

        const length = Math.floor(ctx.sampleRate * 0.4)
        const noise = ctx.createBuffer(1, length, ctx.sampleRate)
        const data = noise.getChannelData(0)
        for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1

        this.ctx = ctx
        this.master = master
        this.noise = noise
        document.addEventListener('visibilitychange', this.handleVisibility)
        window.addEventListener('blur', this.suspend)
      } catch {
        this.ctx = null
        return
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => undefined)
  }

  flap(): void {
    this.tone('square', 420, 620, 0, 0.08, 0.35)
  }

  score(): void {
    this.tone('square', 880, 880, 0, 0.06, 0.3)
    this.tone('square', 1320, 1320, 0.06, 0.1, 0.3)
  }

  hit(): void {
    this.burst(0, 0.22, 0.7)
    this.tone('square', 200, 60, 0, 0.32, 0.5)
  }

  milestone(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, i) => this.tone('square', freq, freq, i * 0.07, 0.09, 0.32))
    this.tone('triangle', 261.63, 261.63, 0, 0.34, 0.4)
  }

  /** Fanfarra de ~2 s. */
  victory(): void {
    const lead: Array<[freq: number, at: number, dur: number]> = [
      [523.25, 0, 0.14],
      [659.25, 0.12, 0.14],
      [783.99, 0.24, 0.14],
      [1046.5, 0.36, 0.2],
      [880, 0.6, 0.14],
      [987.77, 0.74, 0.14],
      [1046.5, 0.9, 0.28],
      [783.99, 1.2, 0.14],
      [1046.5, 1.36, 0.14],
      [1318.51, 1.5, 0.55],
    ]
    const bass: Array<[freq: number, at: number, dur: number]> = [
      [130.81, 0, 0.5],
      [174.61, 0.6, 0.28],
      [196, 0.9, 0.5],
      [130.81, 1.5, 0.55],
      [261.63, 1.5, 0.55],
    ]
    for (const [freq, at, dur] of lead) this.tone('square', freq, freq, at, dur, 0.3)
    for (const [freq, at, dur] of bass) this.tone('triangle', freq, freq, at, dur, 0.5)
  }

  ui(): void {
    this.tone('square', 660, 660, 0, 0.04, 0.22)
  }

  private readonly handleVisibility = (): void => {
    if (document.hidden) this.suspend()
  }

  dispose(): void {
    this.disposed = true
    document.removeEventListener('visibilitychange', this.handleVisibility)
    window.removeEventListener('blur', this.suspend)
    const ctx = this.ctx
    this.ctx = null
    this.master = null
    this.noise = null
    if (ctx && ctx.state !== 'closed') void ctx.close().catch(() => undefined)
  }

  private tone(type: OscillatorType, from: number, to: number, delay: number, duration: number, volume: number): void {
    const { ctx, master } = this
    if (!ctx || !master || this.isMuted) return
    const start = ctx.currentTime + delay
    const end = start + duration

    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(from, start)
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, end)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(SILENCE, start)
    gain.gain.linearRampToValueAtTime(volume, start + 0.005)
    gain.gain.exponentialRampToValueAtTime(SILENCE, end)

    osc.connect(gain)
    gain.connect(master)
    osc.onended = () => {
      osc.disconnect()
      gain.disconnect()
    }
    osc.start(start)
    osc.stop(end + 0.02)
  }

  private burst(delay: number, duration: number, volume: number): void {
    const { ctx, master, noise } = this
    if (!ctx || !master || !noise || this.isMuted) return
    const start = ctx.currentTime + delay
    const end = start + duration

    const source = ctx.createBufferSource()
    source.buffer = noise

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(volume, start)
    gain.gain.exponentialRampToValueAtTime(SILENCE, end)

    source.connect(gain)
    gain.connect(master)
    source.onended = () => {
      source.disconnect()
      gain.disconnect()
    }
    source.start(start)
    source.stop(end + 0.02)
  }
}
