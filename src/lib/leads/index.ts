/**
 * Captura de leads. O site é estático, então nada sensível mora no bundle:
 * o código de desconto do arcade, por exemplo, é enviado por e-mail pelo
 * serviço que recebe este POST, nunca exibido pelo cliente.
 */

export type LeadKind = 'newsletter' | 'reward-claim' | 'project-inquiry'

export interface Lead {
  kind: LeadKind
  email: string
  name?: string
  message?: string
  consent: boolean
  /** Contexto extra (pontuação, origem do formulário…). */
  meta?: Record<string, string | number | boolean>
}

export type LeadResult =
  | { ok: true }
  | { ok: false; reason: 'not-configured' | 'network' | 'rejected' }

const endpoint = import.meta.env.VITE_LEADS_ENDPOINT?.trim()

export const leadsConfigured = Boolean(endpoint)

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

export async function submitLead(lead: Lead): Promise<LeadResult> {
  if (!endpoint) {
    return { ok: false, reason: 'not-configured' }
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...lead, submittedAt: new Date().toISOString() }),
    })
    return response.ok ? { ok: true } : { ok: false, reason: 'rejected' }
  } catch {
    return { ok: false, reason: 'network' }
  }
}
