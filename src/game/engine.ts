import { palette, type PaletteName } from '@/lib/palette'
import type { ChipAudio } from './audio'
import { difficultyFor, VICTORY_STAGE, type Tier } from './difficulty'
import { getBackdrops, getSprites, type SpriteSheet } from './sprites'
import { saveHighScore } from './storage'

export const VIEW_WIDTH = 256
export const VIEW_HEIGHT = 384

const STEP = 1 / 60
const MAX_FRAME_DELTA = 0.1

const GROUND_HEIGHT = 24
const GROUND_Y = VIEW_HEIGHT - GROUND_HEIGHT

const GRAVITY = 900
const FLAP_VELOCITY = -250
const MAX_FALL_SPEED = 380

const CAT_X = 64
const CAT_W = 16
const CAT_H = 14
const HITBOX_INSET = 2
const CAT_READY_Y = 168

const TUBE_BODY_W = 36
const LIP_W = 44
const LIP_H = 12
const BODY_INSET = (LIP_W - TUBE_BODY_W) / 2
/** Distância mínima entre a ponta do vão e o teto/solo. */
const TUBE_MARGIN = LIP_H + 16
const MAX_CENTER_JUMP = 110

const SPROUT_REACH = 12
const SPROUT_PERIOD = 2.4
const SPROUT_WARNING_START = 0.25
const SPROUT_GROW_START = 0.45
const SPROUT_HOLD_START = 0.6
const SPROUT_RETRACT_START = 0.8
const SPROUT_W = 8

const PORTHOLE_SIZE = 10
const PORTHOLE_OFFSET = 8

const IDLE_SPEED = 60
const DEATH_FREEZE = 0.32
const TIER_BURST = 1.2

const TUBE_COLOR: Record<Tier, PaletteName> = { cruise: 'cloud', hyper: 'pink', extreme: 'pistachio' }
const STREAK_COUNT: Record<Tier, number> = { cruise: 0, hyper: 5, extreme: 9 }
const STAR_COLORS: PaletteName[] = ['cream', 'butter', 'cloud', 'pink', 'pistachio']

export interface ArcadeCallbacks {
  onScore(score: number): void
  onTier(tier: Tier): void
  onGameOver(score: number): void
  onVictory(): void
  /** Opcional: a aba ficou oculta durante uma partida e o motor pausou sozinho. */
  onAutoPause?(): void
}

export interface ArcadeOptions {
  reducedMotion?: boolean
  /** Fase inicial (uso em desenvolvimento). Partidas iniciadas adiante não gravam recorde. */
  startScore?: number
}

type EngineState = 'ready' | 'playing' | 'dying' | 'over' | 'victory'

interface Tube {
  /** Borda esquerda do lábio. */
  x: number
  baseY: number
  gap: number
  amplitude: number
  period: number
  phase: number
  tier: Tier
  sprout: { side: 'top' | 'bottom'; phase: number } | null
  warning: boolean
  eyeOnTop: boolean
  blinkOffset: number
  passed: boolean
}

interface Star {
  x: number
  y: number
  size: number
  color: PaletteName
  twinkle: number
}

interface Streak {
  x: number
  y: number
  length: number
  speed: number
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function wrap(value: number, size: number): number {
  return ((value % size) + size) % size
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function makeStars(count: number, seed: number, bigChance: number): Star[] {
  const random = mulberry32(seed)
  return Array.from({ length: count }, () => ({
    x: random() * VIEW_WIDTH,
    y: random() * (GROUND_Y - 24),
    size: random() < bigChance ? 2 : 1,
    color: STAR_COLORS[Math.floor(random() * STAR_COLORS.length)],
    twinkle: random() * 6,
  }))
}

/** Motor do MIAU ORBITAL: simulação em passo fixo e desenho em Canvas 2D. Sem React. */
export class ArcadeEngine {
  private readonly ctx: CanvasRenderingContext2D | null
  private readonly audio: ChipAudio
  private readonly callbacks: ArcadeCallbacks
  private readonly startScore: number
  private readonly sprites: SpriteSheet
  private readonly backdrops: Record<Tier, HTMLCanvasElement>
  private readonly farStars = makeStars(42, 0xf2f2, 0)
  private readonly nearStars = makeStars(20, 0xca7, 0.35)

  private reducedMotion: boolean
  private state: EngineState = 'ready'
  private started = false
  private paused = false
  private destroyed = false
  private raf = 0
  private last = 0
  private accumulator = 0

  /** Relógio geral (cintilar, piscadas) e relógio do mundo (para durante a morte). */
  private time = 0
  private worldTime = 0
  private scroll = 0

  private score: number
  private tier: Tier
  private tubes: Tube[] = []
  private nextIndex: number
  private lastCenter = VIEW_HEIGHT / 2 - GROUND_HEIGHT / 2

  private catX = CAT_X
  private catY = CAT_READY_Y
  private velocityY = 0
  private flapTimer = 0
  private freeze = 0
  private shake = 0
  private flash = 0
  private tierBurst = 0
  private victoryTime = 0
  private victoryReported = false
  private streaks: Streak[] = []

  constructor(canvas: HTMLCanvasElement, audio: ChipAudio, callbacks: ArcadeCallbacks, options: ArcadeOptions = {}) {
    this.audio = audio
    this.callbacks = callbacks
    this.reducedMotion = options.reducedMotion ?? false
    this.startScore = clamp(Math.floor(options.startScore ?? 0), 0, VICTORY_STAGE - 1)
    this.score = this.startScore
    this.nextIndex = this.startScore
    this.tier = difficultyFor(this.startScore).tier

    canvas.width = VIEW_WIDTH
    canvas.height = VIEW_HEIGHT
    this.ctx = canvas.getContext('2d')
    if (this.ctx) this.ctx.imageSmoothingEnabled = false

    this.sprites = getSprites()
    this.backdrops = getBackdrops(VIEW_WIDTH, GROUND_Y)
    this.syncStreaks()
  }

  /** Liga o laço e os ouvintes. A partida em si começa no primeiro `flap()`. */
  start(): void {
    if (this.destroyed || this.started) return
    this.started = true
    document.addEventListener('visibilitychange', this.handleVisibility)
    window.addEventListener('blur', this.handleBlur)
    this.render()
    this.runLoop()
  }

  flap(): void {
    if (this.destroyed || this.paused) return
    if (this.state === 'ready') this.state = 'playing'
    if (this.state !== 'playing') return
    this.velocityY = FLAP_VELOCITY
    this.flapTimer = 0.18
    this.audio.flap()
  }

  pause(): void {
    if (this.destroyed || this.paused) return
    this.paused = true
    this.stopLoop()
    this.render()
  }

  resume(): void {
    if (this.destroyed || !this.paused) return
    this.paused = false
    this.runLoop()
  }

  /** Volta à tela de espera, na fase inicial. */
  reset(): void {
    if (this.destroyed) return
    this.state = 'ready'
    this.score = this.startScore
    this.nextIndex = this.startScore
    this.tier = difficultyFor(this.startScore).tier
    this.tubes = []
    this.lastCenter = VIEW_HEIGHT / 2 - GROUND_HEIGHT / 2
    this.catX = CAT_X
    this.catY = CAT_READY_Y
    this.velocityY = 0
    this.flapTimer = 0
    this.freeze = 0
    this.shake = 0
    this.flash = 0
    this.tierBurst = 0
    this.victoryTime = 0
    this.victoryReported = false
    this.paused = false
    this.syncStreaks()
    this.render()
    this.runLoop()
  }

  setReducedMotion(reducedMotion: boolean): void {
    this.reducedMotion = reducedMotion
    if (reducedMotion) {
      this.shake = 0
      this.flash = 0
    }
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.stopLoop()
    document.removeEventListener('visibilitychange', this.handleVisibility)
    window.removeEventListener('blur', this.handleBlur)
  }

  /* ─────────────────────────── Laço ─────────────────────────── */

  private runLoop(): void {
    if (this.destroyed || !this.started || this.paused || this.raf !== 0 || document.hidden) return
    this.last = performance.now()
    this.accumulator = 0
    this.raf = requestAnimationFrame(this.frame)
  }

  private stopLoop(): void {
    if (this.raf !== 0) cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  private readonly frame = (now: number): void => {
    this.raf = 0
    if (this.destroyed || this.paused || document.hidden) return
    const delta = clamp((now - this.last) / 1000, 0, MAX_FRAME_DELTA)
    this.last = now
    this.accumulator += delta
    while (this.accumulator >= STEP && !this.paused && !this.destroyed) {
      this.step(STEP)
      this.accumulator -= STEP
    }
    this.render()
    if (!this.destroyed && !this.paused && this.state !== 'over' && !this.victoryReported) {
      this.raf = requestAnimationFrame(this.frame)
    }
  }

  private readonly handleBlur = (): void => {
    const active = this.state === 'playing' || this.state === 'dying'
      || (this.state === 'victory' && !this.victoryReported)
    if (active && !this.paused) {
      this.pause()
      this.callbacks.onAutoPause?.()
    }
  }

  private readonly handleVisibility = (): void => {
    if (document.hidden) {
      this.handleBlur()
      if (!this.paused) {
        this.stopLoop()
      }
    } else {
      this.runLoop()
    }
  }

  /* ───────────────────────── Simulação ───────────────────────── */

  private step(dt: number): void {
    this.time += dt
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt)
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt)
    if (this.tierBurst > 0) this.tierBurst = Math.max(0, this.tierBurst - dt)
    if (this.flapTimer > 0) this.flapTimer = Math.max(0, this.flapTimer - dt)

    switch (this.state) {
      case 'ready':
        if (!this.reducedMotion) this.advanceWorld(IDLE_SPEED, dt)
        this.catY = CAT_READY_Y + (this.reducedMotion ? 0 : Math.sin(this.time * 3) * 4)
        break
      case 'playing':
        this.stepPlaying(dt)
        break
      case 'dying':
        this.stepDying(dt)
        break
      case 'victory':
        this.stepVictory(dt)
        break
      case 'over':
        break
    }
  }

  private advanceWorld(speed: number, dt: number): void {
    this.worldTime += dt
    this.scroll += speed * dt
    const boost = this.tierBurst > 0 ? 1.8 : 1
    for (const streak of this.streaks) {
      streak.x -= streak.speed * boost * dt
      if (streak.x + streak.length < 0) this.respawnStreak(streak, VIEW_WIDTH + Math.random() * 60)
    }
  }

  private stepPlaying(dt: number): void {
    const speed = difficultyFor(this.score).speed
    this.advanceWorld(speed, dt)

    this.velocityY = Math.min(this.velocityY + GRAVITY * dt, MAX_FALL_SPEED)
    this.catY += this.velocityY * dt
    if (this.catY < 0) {
      this.catY = 0
      this.velocityY = 0
    }

    this.moveTubes(speed, dt)
    this.spawnTubes()

    // Uma colisão no mesmo passo vence a pontuação, inclusive no último tubo.
    if (this.collides()) {
      this.die()
      return
    }

    let gained = false
    for (const tube of this.tubes) {
      if (!tube.passed && Math.round(tube.x) + LIP_W <= CAT_X + HITBOX_INSET) {
        tube.passed = true
        this.score += 1
        gained = true
        if (this.score === VICTORY_STAGE) break
      }
    }

    if (gained) {
      if (this.startScore === 0) saveHighScore(this.score)
      this.callbacks.onScore(this.score)
      if (this.score >= VICTORY_STAGE) {
        this.beginVictory()
        return
      }
      const tier = difficultyFor(this.score).tier
      if (tier !== this.tier) {
        this.tier = tier
        this.tierBurst = TIER_BURST
        this.syncStreaks()
        this.callbacks.onTier(tier)
      } else {
        this.audio.score()
      }
    }
  }

  private stepDying(dt: number): void {
    if (this.freeze > 0) {
      this.freeze -= dt
      return
    }
    this.velocityY = Math.min(this.velocityY + GRAVITY * dt, MAX_FALL_SPEED * 1.4)
    this.catY += this.velocityY * dt
    if (this.catY + CAT_H >= GROUND_Y) {
      this.catY = GROUND_Y - CAT_H
      this.state = 'over'
      this.callbacks.onGameOver(this.score)
    }
  }

  private stepVictory(dt: number): void {
    const speed = difficultyFor(this.score).speed
    this.advanceWorld(speed, dt)
    this.moveTubes(speed, dt)
    this.victoryTime += dt
    this.flapTimer = 0.18

    if (this.catX < VIEW_WIDTH + 40) {
      this.catX += (50 + this.victoryTime * 260) * dt
      this.catY += (120 - this.catY) * Math.min(1, dt * 3)
    } else if (!this.victoryReported) {
      this.victoryReported = true
      this.callbacks.onVictory()
    }
  }

  private beginVictory(): void {
    this.state = 'victory'
    this.victoryTime = 0
    this.velocityY = 0
  }

  private die(): void {
    this.state = 'dying'
    this.freeze = DEATH_FREEZE
    this.velocityY = -140
    this.flapTimer = 0
    if (!this.reducedMotion) {
      this.shake = 0.25
      this.flash = 0.08
    }
    this.audio.hit()
  }

  private moveTubes(speed: number, dt: number): void {
    for (const tube of this.tubes) tube.x -= speed * dt
    if (this.tubes.length > 0 && this.tubes[0].x < -LIP_W - 8) this.tubes.shift()
  }

  private spawnTubes(): void {
    while (this.nextIndex < VICTORY_STAGE) {
      const difficulty = difficultyFor(this.nextIndex)
      const previous = this.tubes[this.tubes.length - 1]
      let x = VIEW_WIDTH + 24
      if (previous) {
        if (VIEW_WIDTH + 8 - previous.x < difficulty.spacing) return
        x = previous.x + difficulty.spacing
      }

      const reach = difficulty.gap / 2 + difficulty.oscAmplitude + TUBE_MARGIN
      // Limita a mudança entre corredores seguros, não apenas entre centros
      // estáticos: oscilação e planta podem consumir parte do vão seguinte.
      const previousReach = previous ? previous.amplitude + (previous.sprout ? SPROUT_REACH : 0) : 0
      const nextReach = difficulty.oscAmplitude + (difficulty.sprouts ? SPROUT_REACH : 0)
      const centerJump = Math.max(24, MAX_CENTER_JUMP - previousReach - nextReach)
      const min = Math.max(reach, this.lastCenter - centerJump)
      const max = Math.min(GROUND_Y - reach, this.lastCenter + centerJump)
      const baseY = min + Math.random() * Math.max(0, max - min)
      this.lastCenter = baseY

      this.tubes.push({
        x,
        baseY,
        gap: difficulty.gap,
        amplitude: difficulty.oscAmplitude,
        period: difficulty.oscPeriod,
        phase: Math.random() * Math.PI * 2,
        tier: difficulty.tier,
        sprout: difficulty.sprouts
          ? { side: Math.random() < 0.5 ? 'top' : 'bottom', phase: Math.random() * SPROUT_PERIOD }
          : null,
        warning: false,
        eyeOnTop: this.nextIndex % 2 === 0,
        blinkOffset: Math.random() * 4,
        passed: false,
      })
      this.nextIndex += 1
    }
  }

  /** Geometria inteira do tubo neste instante; a mesma para desenho e colisão. */
  private tubeGeometry(tube: Tube): { x: number; gapTop: number; gapBottom: number; sprout: number } {
    const sway = tube.period > 0 ? Math.sin((this.worldTime / tube.period) * Math.PI * 2 + tube.phase) * tube.amplitude : 0
    const center = tube.baseY + sway
    const gapTop = Math.round(center - tube.gap / 2)
    let sprout = 0
    tube.warning = false
    if (tube.sprout) {
      const cycle = wrap(this.worldTime + tube.sprout.phase, SPROUT_PERIOD) / SPROUT_PERIOD
      // Pelo menos 480 ms de aviso com o broto ainda recolhido.
      tube.warning = cycle >= SPROUT_WARNING_START && cycle < SPROUT_GROW_START
      if (cycle >= SPROUT_GROW_START && cycle < SPROUT_HOLD_START) {
        sprout = Math.round(SPROUT_REACH * (cycle - SPROUT_GROW_START) / (SPROUT_HOLD_START - SPROUT_GROW_START))
      } else if (cycle >= SPROUT_HOLD_START && cycle < SPROUT_RETRACT_START) {
        sprout = SPROUT_REACH
      } else if (cycle >= SPROUT_RETRACT_START) {
        sprout = Math.round(SPROUT_REACH * (1 - cycle) / (1 - SPROUT_RETRACT_START))
      }
    }
    return { x: Math.round(tube.x), gapTop, gapBottom: gapTop + Math.round(tube.gap), sprout }
  }

  private collides(): boolean {
    const left = CAT_X + HITBOX_INSET
    const right = CAT_X + CAT_W - HITBOX_INSET
    const top = Math.round(this.catY) + HITBOX_INSET
    const bottom = Math.round(this.catY) + CAT_H - HITBOX_INSET
    if (bottom >= GROUND_Y) return true

    const overlaps = (x0: number, y0: number, x1: number, y1: number): boolean =>
      left < x1 && right > x0 && top < y1 && bottom > y0

    for (const tube of this.tubes) {
      const { x, gapTop, gapBottom, sprout } = this.tubeGeometry(tube)
      if (right <= x || left >= x + LIP_W) continue

      // Lábios.
      if (overlaps(x, gapTop - LIP_H, x + LIP_W, gapTop)) return true
      if (overlaps(x, gapBottom, x + LIP_W, gapBottom + LIP_H)) return true
      // Corpos (acima do teto também conta, para ninguém passar por cima).
      if (overlaps(x + BODY_INSET, -1000, x + LIP_W - BODY_INSET, gapTop - LIP_H)) return true
      if (overlaps(x + BODY_INSET, gapBottom + LIP_H, x + LIP_W - BODY_INSET, GROUND_Y)) return true

      if (tube.sprout && sprout >= 2) {
        const sx = x + (LIP_W - SPROUT_W) / 2 + 1
        const hit =
          tube.sprout.side === 'top'
            ? overlaps(sx, gapTop, sx + SPROUT_W - 2, gapTop + sprout)
            : overlaps(sx, gapBottom - sprout, sx + SPROUT_W - 2, gapBottom)
        if (hit) return true
      }
    }
    return false
  }

  private syncStreaks(): void {
    const count = STREAK_COUNT[this.tier]
    while (this.streaks.length > count) this.streaks.pop()
    while (this.streaks.length < count) {
      const streak: Streak = { x: 0, y: 0, length: 0, speed: 0 }
      this.respawnStreak(streak, Math.random() * VIEW_WIDTH)
      this.streaks.push(streak)
    }
  }

  private respawnStreak(streak: Streak, x: number): void {
    streak.x = x
    streak.y = 8 + Math.floor(Math.random() * (GROUND_Y - 40))
    streak.length = 6 + Math.floor(Math.random() * 14)
    streak.speed = 260 + Math.random() * 200
  }

  /* ─────────────────────────── Desenho ─────────────────────────── */

  private render(): void {
    const ctx = this.ctx
    if (!ctx) return
    ctx.imageSmoothingEnabled = false

    ctx.save()
    if (this.shake > 0) {
      ctx.fillStyle = palette.ink
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
      ctx.translate(Math.round((Math.random() - 0.5) * 6), Math.round((Math.random() - 0.5) * 6))
    }

    ctx.drawImage(this.backdrops[this.tier], 0, 0)
    this.drawSky(ctx)
    for (const tube of this.tubes) this.drawTube(ctx, tube)
    this.drawGround(ctx)
    this.drawCat(ctx)
    ctx.restore()

    if (this.flash > 0) {
      ctx.save()
      ctx.globalAlpha = 0.6
      ctx.fillStyle = palette.cream
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
      ctx.restore()
    }
  }

  private drawSky(ctx: CanvasRenderingContext2D): void {
    this.drawStars(ctx, this.farStars, 0.06)

    const planet = this.sprites.planet
    const span = VIEW_WIDTH + planet.w + 120
    ctx.drawImage(planet.canvas, Math.floor(wrap(190 - this.scroll * 0.03, span)) - planet.w, 64)

    this.drawStars(ctx, this.nearStars, 0.16)

    if (this.streaks.length > 0) {
      ctx.fillStyle = palette[TUBE_COLOR[this.tier]]
      for (const streak of this.streaks) ctx.fillRect(Math.floor(streak.x), streak.y, streak.length, 1)
    }
  }

  private drawStars(ctx: CanvasRenderingContext2D, stars: Star[], factor: number): void {
    for (const star of stars) {
      // Cintilar: some por um instante de tempos em tempos.
      if ((this.time + star.twinkle) % 6 < 0.25) continue
      ctx.fillStyle = palette[star.color]
      ctx.fillRect(Math.floor(wrap(star.x - this.scroll * factor, VIEW_WIDTH)), Math.floor(star.y), star.size, star.size)
    }
  }

  private drawGround(ctx: CanvasRenderingContext2D): void {
    const tile = this.sprites.ground
    const offset = Math.floor(wrap(this.scroll, tile.w))
    for (let x = -offset; x < VIEW_WIDTH; x += tile.w) ctx.drawImage(tile.canvas, x, GROUND_Y)
  }

  private drawTube(ctx: CanvasRenderingContext2D, tube: Tube): void {
    const { x, gapTop, gapBottom, sprout } = this.tubeGeometry(tube)
    if (x > VIEW_WIDTH + 8 || x + LIP_W < -8) return
    const color = palette[TUBE_COLOR[tube.tier]]

    // O broto vem antes: o lábio cobre a parte que ainda está dentro do tubo.
    if (tube.sprout && sprout > 0) {
      const sx = x + (LIP_W - SPROUT_W) / 2
      if (tube.sprout.side === 'top') {
        const tipY = gapTop + sprout
        ctx.fillStyle = palette.pistachio
        ctx.fillRect(sx + 3, gapTop - 2, 2, Math.max(0, tipY - this.sprites.sproutDown.h - gapTop + 3))
        ctx.drawImage(this.sprites.sproutDown.canvas, sx, tipY - this.sprites.sproutDown.h)
      } else {
        const tipY = gapBottom - sprout
        ctx.fillStyle = palette.pistachio
        ctx.fillRect(sx + 3, tipY + this.sprites.sproutUp.h - 1, 2, Math.max(0, gapBottom - tipY - this.sprites.sproutUp.h + 3))
        ctx.drawImage(this.sprites.sproutUp.canvas, sx, tipY)
      }
    }

    this.drawBody(ctx, x, -8, gapTop - LIP_H, color, gapTop - LIP_H, -1)
    this.drawBody(ctx, x, gapBottom + LIP_H, GROUND_Y, color, gapBottom + LIP_H, 1)
    this.drawLip(ctx, x, gapTop - LIP_H, color)
    this.drawLip(ctx, x, gapBottom, color)

    if (tube.sprout && tube.warning) {
      ctx.fillStyle = palette.pink
      const warningY = tube.sprout.side === 'top' ? gapTop - 4 : gapBottom + 2
      ctx.fillRect(x + (LIP_W - SPROUT_W) / 2, warningY, SPROUT_W, 2)
    }

    // Escotilha com o olho curioso, no tubo que tiver espaço.
    const topY = gapTop - LIP_H - PORTHOLE_OFFSET - PORTHOLE_SIZE
    const bottomY = gapBottom + LIP_H + PORTHOLE_OFFSET
    const topFits = topY >= 4
    const bottomFits = bottomY + PORTHOLE_SIZE <= GROUND_Y - 4
    if (topFits && (tube.eyeOnTop || !bottomFits)) this.drawPorthole(ctx, tube, x, topY)
    else if (bottomFits) this.drawPorthole(ctx, tube, x, bottomY)
  }

  /** Corpo do tubo entre y0 e y1; as cintas rebitadas partem de `anchor` na direção `dir`. */
  private drawBody(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, color: string, anchor: number, dir: 1 | -1): void {
    const height = y1 - y0
    if (height <= 0) return
    const bx = x + BODY_INSET
    ctx.fillStyle = palette.ink
    ctx.fillRect(bx, y0, TUBE_BODY_W, height)
    ctx.fillStyle = color
    ctx.fillRect(bx + 2, y0, TUBE_BODY_W - 4, height)
    ctx.fillStyle = palette.cream
    ctx.fillRect(bx + 5, y0, 3, height)
    ctx.fillStyle = palette.ink
    ctx.fillRect(bx + TUBE_BODY_W - 6, y0, 1, height)

    for (let offset = 30; offset < height; offset += 28) {
      const y = dir === 1 ? anchor + offset : anchor - offset - 1
      ctx.fillRect(bx + 2, y, TUBE_BODY_W - 4, 1)
      const rivetY = dir === 1 ? y + 3 : y - 4
      ctx.fillRect(bx + 12, rivetY, 2, 2)
      ctx.fillRect(bx + 22, rivetY, 2, 2)
    }
  }

  private drawLip(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
    ctx.fillStyle = palette.ink
    ctx.fillRect(x, y, LIP_W, LIP_H)
    ctx.fillStyle = color
    ctx.fillRect(x + 2, y + 2, LIP_W - 4, LIP_H - 4)
    ctx.fillStyle = palette.cream
    ctx.fillRect(x + 5, y + 2, 3, LIP_H - 4)
    ctx.fillStyle = palette.ink
    for (let rivet = 14; rivet <= 34; rivet += 10) ctx.fillRect(x + rivet, y + 5, 2, 2)
  }

  private drawPorthole(ctx: CanvasRenderingContext2D, tube: Tube, x: number, y: number): void {
    const px = x + (LIP_W - PORTHOLE_SIZE) / 2
    if ((this.time + tube.blinkOffset) % 3.4 < 0.14) {
      ctx.drawImage(this.sprites.portholeBlink.canvas, px, y)
      return
    }
    ctx.drawImage(this.sprites.porthole.canvas, px, y)
    // O olho acompanha o gato: íris desloca 1px, pupila mais 1px.
    const dx = clamp(Math.round((this.catX + CAT_W / 2 - (px + 5)) / 40), -1, 1)
    const dy = clamp(Math.round((this.catY + CAT_H / 2 - (y + 5)) / 40), -1, 1)
    ctx.fillStyle = palette.pistachio
    ctx.fillRect(px + 3 + dx, y + 3 + dy, 4, 4)
    ctx.fillStyle = palette.ink
    ctx.fillRect(px + 4 + dx * 2, y + 4 + dy * 2, 2, 2)
  }

  private drawCat(ctx: CanvasRenderingContext2D): void {
    const x = Math.round(this.catX)
    const y = Math.round(this.catY)
    if (x > VIEW_WIDTH + 8) return

    const fallen = this.state === 'dying' || this.state === 'over'
    if (!fallen) {
      const flame =
        this.flapTimer > 0.09
          ? this.sprites.flameBig
          : this.flapTimer > 0
            ? this.sprites.flameMid
            : Math.floor(this.time * 12) % 2 === 0
              ? this.sprites.flameSmall
              : null
      if (flame) ctx.drawImage(flame.canvas, x - 1, y + 10)
    }

    const blinking = fallen || (this.time + 1.3) % 3.1 < 0.12
    ctx.drawImage((blinking ? this.sprites.catBlink : this.sprites.cat).canvas, x, y)
  }
}
