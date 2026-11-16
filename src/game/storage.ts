/**
 * localStorage protegido: modo privado, cota cheia ou storage bloqueado não
 * lançam erros. Recorde e mute continuam disponíveis em memória nesta sessão.
 */

import { VICTORY_STAGE } from './difficulty'

const HIGH_SCORE_KEY = 'frufru.arcade.highscore'
const MUTED_KEY = 'frufru.arcade.muted'
let sessionHighScore = 0
let sessionMuted: boolean | null = null

function readItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Sem storage disponível: o valor vale só para esta sessão.
  }
}

export function loadHighScore(): number {
  const value = Number(readItem(HIGH_SCORE_KEY))
  if (Number.isInteger(value) && value > sessionHighScore) sessionHighScore = Math.min(VICTORY_STAGE, value)
  return sessionHighScore
}

/** Grava `score` se superar o recorde e devolve o recorde vigente. */
export function saveHighScore(score: number): number {
  const best = loadHighScore()
  if (!Number.isFinite(score)) return best
  const candidate = Math.min(VICTORY_STAGE, Math.max(0, Math.floor(score)))
  if (candidate <= best) return best
  sessionHighScore = candidate
  writeItem(HIGH_SCORE_KEY, String(candidate))
  return candidate
}

export function loadMuted(): boolean {
  sessionMuted ??= readItem(MUTED_KEY) === 'true'
  return sessionMuted
}

export function saveMuted(muted: boolean): void {
  sessionMuted = muted
  writeItem(MUTED_KEY, muted ? 'true' : 'false')
}
