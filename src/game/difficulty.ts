/** Curva de dificuldade do MIAU ORBITAL. Função pura: fase (= pontuação) → parâmetros. */

export const HYPER_STAGE = 55
export const EXTREME_STAGE = 85
export const VICTORY_STAGE = 100

export type Tier = 'cruise' | 'hyper' | 'extreme'

export interface Difficulty {
  tier: Tier
  /** Velocidade de rolagem, px/s. */
  speed: number
  /** Altura do vão entre os tubos, px. */
  gap: number
  /** Distância horizontal entre tubos consecutivos, px. */
  spacing: number
  /** Amplitude da oscilação vertical dos tubos, px (0 = parados). */
  oscAmplitude: number
  /** Período da oscilação, s (0 = parados). */
  oscPeriod: number
  /** Brotos alienígenas letais saindo dos lábios dos tubos. */
  sprouts: boolean
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * Math.min(1, Math.max(0, t))
}

export function difficultyFor(score: number): Difficulty {
  const stage = Math.min(VICTORY_STAGE - 1, Math.max(0, Math.floor(Number.isFinite(score) ? score : 0)))

  if (stage < HYPER_STAGE) {
    const t = stage / (HYPER_STAGE - 1)
    return {
      tier: 'cruise',
      speed: lerp(78, 108, t),
      gap: lerp(124, 100, t),
      spacing: lerp(150, 132, t),
      oscAmplitude: 0,
      oscPeriod: 0,
      sprouts: false,
    }
  }

  if (stage < EXTREME_STAGE) {
    const t = (stage - HYPER_STAGE) / (EXTREME_STAGE - 1 - HYPER_STAGE)
    return {
      tier: 'hyper',
      speed: lerp(120, 138, t),
      gap: lerp(96, 88, t),
      spacing: 128,
      oscAmplitude: lerp(10, 20, t),
      oscPeriod: 2.4,
      sprouts: false,
    }
  }

  const t = (stage - EXTREME_STAGE) / (VICTORY_STAGE - 1 - EXTREME_STAGE)
  return {
    tier: 'extreme',
    speed: lerp(146, 156, t),
    gap: lerp(86, 82, t),
    spacing: 128,
    oscAmplitude: lerp(22, 26, t),
    oscPeriod: 1.9,
    sprouts: true,
  }
}
