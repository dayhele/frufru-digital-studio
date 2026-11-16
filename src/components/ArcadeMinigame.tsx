import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type PointerEvent } from 'react'
import { LogOut, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { inputClasses } from '@/components/ui/field'
import { ChipAudio } from '@/game/audio'
import { difficultyFor, EXTREME_STAGE, HYPER_STAGE, VICTORY_STAGE, type Tier } from '@/game/difficulty'
import { ArcadeEngine } from '@/game/engine'
import { loadHighScore, loadMuted } from '@/game/storage'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { getSiteSettings } from '@/lib/cms/client'
import type { ArcadeReward } from '@/lib/cms/types'
import { useCms } from '@/lib/cms/useCms'
import { cn } from '@/lib/cn'
import { isValidEmail, submitLead } from '@/lib/leads'
import { scrollToSection } from '@/lib/scrollToSection'

type Phase = 'ready' | 'playing' | 'paused' | 'gameover' | 'credits' | 'claim' | 'claimed'

const TIER_LABEL: Record<Tier, string> = { cruise: 'CRUISE', hyper: 'HYPER', extreme: 'EXTREME' }
const TIER_STAGE: Record<Tier, number> = { cruise: 0, hyper: HYPER_STAGE, extreme: EXTREME_STAGE }
const BANNER_MS = 1600

/** Largura do quadro: cabe na largura e na altura que sobra abaixo do cabeçalho (3.5rem) e das margens. */
const FRAME_WIDTH = 'min(92vw, calc((100dvh - 3.5rem - 3rem) * 2 / 3))'

const CREDITS: Array<{ role?: string; text: string }> = [
  { text: 'um jogo do Frufru Digital Studio' },
  { role: 'direção de arte', text: 'Frufru Digital Studio' },
  { role: 'pixels', text: 'pintados um a um' },
  { role: 'sons 8-bit', text: 'ondas quadradas e ruído' },
  { role: 'gato-piloto', text: 'a mascote do estúdio' },
  { role: 'tubos de dobra', text: 'nenhum alienígena foi incomodado' },
]

const PIXEL_SHADOW = '[text-shadow:2px_2px_0_var(--color-ink)]'
const overlayClasses = 'absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 text-center'
const cardClasses = 'w-[min(92vw,28rem)] border-[3px] border-cream bg-ink p-5 text-cream shadow-brutal sm:p-6'
const fieldLabelClasses = 'mb-1.5 block text-sm font-bold text-cream'
const fieldErrorClasses = 'mt-1.5 text-sm font-bold text-pink'

/** Só em desenvolvimento: `?stage=N` começa a partida na fase N (0–99). */
function devStartScore(): number {
  if (!import.meta.env.DEV) return 0
  const stage = Number.parseInt(new URLSearchParams(window.location.search).get('stage') ?? '', 10)
  return Number.isFinite(stage) ? Math.min(VICTORY_STAGE - 1, Math.max(0, stage)) : 0
}

function isControl(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('button, input, textarea, select, a, [contenteditable="true"]') !== null
}

export default function ArcadeMinigame({ open, onExit }: { open: boolean; onExit: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      dialog.querySelector<HTMLElement>('[data-arcade-focus]')?.focus({ preventScroll: true })
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Trava a rolagem da página enquanto o jogo está aberto.
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onExit()
      }}
      className="on-dark fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-ink p-0 text-cream backdrop:bg-ink"
    >
      {open ? <ArcadeSession titleId={titleId} onExit={onExit} /> : null}
    </dialog>
  )
}

/** Uma sessão de jogo: nasce quando o diálogo abre e leva motor e áudio embora ao fechar. */
function ArcadeSession({ titleId, onExit }: { titleId: string; onExit: () => void }) {
  const reducedMotion = usePrefersReducedMotion()
  const settings = useCms(getSiteSettings)
  const [startScore] = useState(devStartScore)

  const [phase, setPhase] = useState<Phase>('ready')
  const [score, setScore] = useState(startScore)
  const [tier, setTier] = useState<Tier>(() => difficultyFor(startScore).tier)
  const [best, setBest] = useState(loadHighScore)
  const [muted, setMuted] = useState(loadMuted)
  const [banner, setBanner] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const retryRef = useRef<HTMLButtonElement>(null)
  const resumeRef = useRef<HTMLButtonElement>(null)
  const skipRef = useRef<HTMLButtonElement>(null)
  const claimedRef = useRef<HTMLHeadingElement>(null)
  const engineRef = useRef<ArcadeEngine | null>(null)
  const audioRef = useRef<ChipAudio | null>(null)
  const initialReducedMotion = useRef(reducedMotion)
  const preservePauseFocus = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let bannerTimer = 0

    const audio = new ChipAudio()
    const engine = new ArcadeEngine(
      canvas,
      audio,
      {
        onScore: (next) => {
          setScore(next)
          setBest(loadHighScore())
        },
        onTier: (next) => {
          setTier(next)
          if (next === 'cruise') return
          const label = `STAGE ${TIER_STAGE[next]} · ${TIER_LABEL[next]}`
          audio.milestone()
          setBanner(label)
          setAnnouncement(`Fase ${TIER_STAGE[next]}: modo ${TIER_LABEL[next]}.`)
          window.clearTimeout(bannerTimer)
          bannerTimer = window.setTimeout(() => setBanner(null), BANNER_MS)
        },
        onGameOver: (finalScore) => {
          const record = loadHighScore()
          setBest(record)
          setBanner(null)
          setPhase('gameover')
          setAnnouncement(`Fim de jogo. Pontuação ${finalScore}. Recorde ${record}.`)
        },
        onVictory: () => {
          audio.victory()
          setBest(loadHighScore())
          setBanner(null)
          setPhase('credits')
          setAnnouncement(`Fase ${VICTORY_STAGE} concluída. Vitória! Créditos na tela.`)
        },
        onAutoPause: () => {
          setPhase('paused')
          setAnnouncement('Partida pausada. Ative Continuar ou pressione P para retomar.')
        },
      },
      { reducedMotion: initialReducedMotion.current, startScore },
    )
    audioRef.current = audio
    engineRef.current = engine
    engine.start()

    return () => {
      window.clearTimeout(bannerTimer)
      engine.destroy()
      audio.dispose()
      engineRef.current = null
      audioRef.current = null
    }
  }, [startScore])

  useEffect(() => {
    engineRef.current?.setReducedMotion(reducedMotion)
  }, [reducedMotion])

  const act = useCallback(() => {
    audioRef.current?.unlock()
    if (phase === 'ready') setPhase('playing')
    if (phase === 'ready' || phase === 'playing') engineRef.current?.flap()
  }, [phase])

  const pause = useCallback(() => {
    engineRef.current?.pause()
    setPhase('paused')
  }, [])

  const resume = useCallback(() => {
    audioRef.current?.unlock()
    audioRef.current?.ui()
    engineRef.current?.resume()
    setPhase('playing')
  }, [])

  const retry = useCallback(() => {
    audioRef.current?.unlock()
    audioRef.current?.ui()
    engineRef.current?.reset()
    setScore(startScore)
    setTier(difficultyFor(startScore).tier)
    setBanner(null)
    setAnnouncement('')
    setPhase('ready')
  }, [startScore])

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    const next = !audio.muted
    audio.unlock()
    audio.setMuted(next)
    setMuted(next)
    if (!next) audio.ui()
  }

  const goToWork = () => {
    onExit()
    scrollToSection('work')
  }

  // Teclado: voar, pausar. Esc fica com o <dialog> nativo.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return
      const key = event.key.toLowerCase()
      const editing = event.target instanceof Element
        && event.target.closest('input, textarea, select, [contenteditable="true"]') !== null
      if (key === 'p' && !editing) {
        if (phase === 'playing' || phase === 'paused') event.preventDefault()
        if (event.repeat) return
        if (phase === 'playing') pause()
        else if (phase === 'paused') resume()
        return
      }
      if (isControl(event.target)) return
      const isSpace = event.code === 'Space' || key === ' '
      if (isSpace || event.code === 'ArrowUp' || key === 'w') {
        if (phase !== 'ready' && phase !== 'playing') {
          // Mesmo fora da partida, espaço não pode rolar o conteúdo por trás.
          if (isSpace && phase !== 'claim' && phase !== 'claimed') event.preventDefault()
          return
        }
        event.preventDefault()
        if (!event.repeat) act()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [phase, act, pause, resume])

  // O foco acompanha o estado, para tudo funcionar só com teclado.
  useEffect(() => {
    if (phase === 'ready' || phase === 'playing') frameRef.current?.focus({ preventScroll: true })
    else if (phase === 'paused' && !preservePauseFocus.current) resumeRef.current?.focus()
    else if (phase === 'gameover') retryRef.current?.focus()
    else if (phase === 'credits') skipRef.current?.focus()
    else if (phase === 'claimed') claimedRef.current?.focus()
    preservePauseFocus.current = false

    // Fora do quadro do jogo não há por que continuar desenhando.
    if (phase === 'claim') engineRef.current?.pause()
  }, [phase])

  const onFramePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return
    if (isControl(event.target)) return
    if (phase !== 'ready' && phase !== 'playing') return
    event.preventDefault()
    frameRef.current?.focus({ preventScroll: true })
    act()
  }

  const frameVisible = phase !== 'claim' && phase !== 'claimed'
  const studioEmail = settings.data?.email

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b-[3px] border-cream bg-ink px-3 sm:px-5">
        <h2 id={titleId} className="truncate font-pixel text-[0.65rem] leading-none text-cream sm:text-sm">
          MIAU ORBITAL
        </h2>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {phase === 'playing' || phase === 'paused' ? (
            <Button data-arcade-pause variant="cream" size="sm" onClick={phase === 'playing' ? pause : resume}>
              {phase === 'playing' ? 'Pausar' : 'Continuar'}
            </Button>
          ) : null}
          <Button
            variant="cream"
            size="sm"
            aria-pressed={muted}
            aria-label={muted ? 'Ativar sons' : 'Silenciar sons'}
            onClick={toggleMute}
            className="px-2"
          >
            {muted ? <VolumeX aria-hidden="true" size={20} /> : <Volume2 aria-hidden="true" size={20} />}
          </Button>
          <Button variant="pink" size="sm" onClick={onExit}>
            <LogOut aria-hidden="true" size={18} />
            Sair do jogo
          </Button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto py-4">
        <div
          ref={frameRef}
          data-arcade-focus
          tabIndex={frameVisible ? 0 : -1}
          role="application"
          aria-label="MIAU ORBITAL. Espaço, seta para cima, W, clique ou toque para voar. P pausa. Esc sai do jogo."
          onPointerDown={onFramePointerDown}
          onBlur={(event) => {
            if (phase !== 'playing' || event.currentTarget.contains(event.relatedTarget)) return
            if (event.relatedTarget?.closest('[data-arcade-pause]')) return
            preservePauseFocus.current = true
            pause()
          }}
          style={{ width: FRAME_WIDTH }}
          className={cn(
            'relative my-auto box-content aspect-[2/3] shrink-0 touch-none select-none border-[3px] border-cream bg-ink shadow-brutal',
            !frameVisible && 'hidden',
          )}
        >
          <canvas ref={canvasRef} aria-hidden="true" className="pixelated block h-full w-full" />

          {phase !== 'credits' ? (
            <div className={cn('pointer-events-none absolute inset-0 font-pixel leading-none text-cream', PIXEL_SHADOW)}>
              <div className="flex items-start justify-between p-2 text-[0.5rem] sm:text-[0.6rem]">
                <span>{TIER_LABEL[tier]}</span>
                <span>BEST {best}</span>
              </div>
              <p className="mt-2 text-center text-2xl sm:text-3xl">
                <span className="sr-only">Pontuação: </span>
                {score}
              </p>
              {banner ? (
                <p className="absolute inset-x-0 top-1/3 bg-ink py-3 text-center text-[0.6rem] text-butter sm:text-xs">
                  {banner}
                </p>
              ) : null}
            </div>
          ) : null}

          {phase === 'ready' ? (
            <div className={cn(overlayClasses, 'pointer-events-none justify-end pb-[22%]')}>
              <p className={cn('animate-blink font-pixel text-sm text-butter sm:text-base', PIXEL_SHADOW)}>PRESS START</p>
              <p className="max-w-[24ch] text-sm font-bold text-cream">
                espaço, clique ou toque para voar · P pausa
              </p>
            </div>
          ) : null}

          {phase === 'paused' ? (
            <div className={cn(overlayClasses, 'bg-ink/75')}>
              <p className={cn('font-pixel text-base text-butter', PIXEL_SHADOW)}>PAUSA</p>
              <Button ref={resumeRef} variant="pistachio" onClick={resume}>
                Continuar
              </Button>
              <p className="text-sm font-bold text-cream">P continua · Esc sai</p>
            </div>
          ) : null}

          {phase === 'gameover' ? (
            <div className={cn(overlayClasses, 'bg-ink/75')}>
              <p className={cn('font-pixel text-base text-pink', PIXEL_SHADOW)}>GAME OVER</p>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 font-pixel text-[0.6rem] leading-none text-cream">
                <dt>SCORE</dt>
                <dd className="text-right text-butter">{score}</dd>
                <dt>BEST</dt>
                <dd className="text-right text-butter">{best}</dd>
              </dl>
              <div className="flex flex-col items-stretch gap-3">
                <Button ref={retryRef} variant="pink" onClick={retry}>
                  Jogar de novo
                </Button>
                <Button variant="cloud" onClick={goToWork}>
                  Ver trabalhos
                </Button>
              </div>
            </div>
          ) : null}

          {phase === 'credits' ? (
            <div className="absolute inset-0 flex flex-col bg-ink/80">
              <div
                tabIndex={reducedMotion ? 0 : undefined}
                className={cn('min-h-0 flex-1', reducedMotion ? 'overflow-y-auto' : 'overflow-hidden')}
              >
                <div
                  className={cn('flex min-h-full flex-col items-center gap-7 px-4 py-8 text-center', !reducedMotion && 'animate-credits')}
                  onAnimationEnd={(event) => {
                    if (event.target === event.currentTarget) setPhase('claim')
                  }}
                >
                  <p className={cn('font-pixel text-base leading-relaxed text-butter', PIXEL_SHADOW)}>MIAU ORBITAL</p>
                  {CREDITS.map((line) => (
                    <p key={line.text} className="text-sm font-bold text-cream">
                      {line.role ? (
                        <span className="mb-2 block font-pixel text-[0.55rem] uppercase leading-none text-pink">
                          {line.role}
                        </span>
                      ) : null}
                      {line.text}
                    </p>
                  ))}
                  <p className={cn('font-pixel text-[0.65rem] leading-relaxed text-pistachio', PIXEL_SHADOW)}>
                    obrigado por jogar
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 justify-center p-3">
                <Button ref={skipRef} variant="cream" size="sm" onClick={() => setPhase('claim')}>
                  {reducedMotion ? 'Continuar' : 'Pular créditos'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {phase === 'claim' ? (
          <section className={cn(cardClasses, 'my-auto shrink-0')} aria-labelledby={`${titleId}-claim`}>
            <p className="font-pixel text-[0.6rem] leading-none text-pistachio">FASE {VICTORY_STAGE} · VITÓRIA</p>
            {settings.status === 'ready' ? (
              <ClaimForm
                headingId={`${titleId}-claim`}
                reward={settings.data.arcadeReward}
                studioEmail={settings.data.email}
                onClaimed={() => setPhase('claimed')}
              />
            ) : (
              <p id={`${titleId}-claim`} className="mt-4 text-base font-bold" role={settings.status === 'error' ? 'alert' : undefined}>
                {settings.status === 'loading'
                  ? 'Carregando sua recompensa…'
                  : 'Não foi possível carregar as condições da recompensa. Feche o jogo e fale com o estúdio pelo site.'}
              </p>
            )}
          </section>
        ) : null}

        {phase === 'claimed' ? (
          <section className={cn(cardClasses, 'my-auto shrink-0 text-center')}>
            <h3 ref={claimedRef} tabIndex={-1} className="font-display text-2xl leading-tight text-butter" role="status">
              Solicitação recebida pelo estúdio.
            </h3>
            {studioEmail ? (
              <p className="mt-3 text-sm font-medium">
                O recebimento não confirma um benefício nem o envio de um código. Para consultar as condições, escreva para{' '}
                <a className="font-bold underline" href={`mailto:${studioEmail}`}>
                  {studioEmail}
                </a>
                .
              </p>
            ) : null}
            <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
              <Button variant="pink" onClick={goToWork}>
                Ver trabalhos
              </Button>
              <Button variant="cloud" onClick={retry}>
                Jogar de novo
              </Button>
            </div>
          </section>
        ) : null}
      </main>

      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>
    </div>
  )
}

interface ClaimFormProps {
  headingId: string
  reward: ArcadeReward
  studioEmail: string
  onClaimed: () => void
}

interface ClaimErrors {
  name?: string
  email?: string
  consent?: string
}

function ClaimForm({ headingId, reward, studioEmail, onClaimed }: ClaimFormProps) {
  const id = useId()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<ClaimErrors>({})
  const [sending, setSending] = useState(false)
  const [failure, setFailure] = useState<'not-configured' | 'network' | 'rejected' | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const consentRef = useRef<HTMLInputElement>(null)
  const mounted = useRef(true)
  const submitting = useRef(false)

  useEffect(() => {
    mounted.current = true
    nameRef.current?.focus()
    return () => {
      mounted.current = false
    }
  }, [])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current) return

    const next: ClaimErrors = {}
    if (!name.trim()) next.name = 'Diga seu nome para a gente saber quem venceu.'
    if (!email.trim()) next.email = 'Informe seu e-mail de contato.'
    else if (!isValidEmail(email)) next.email = 'Esse e-mail não parece válido. Confira e tente de novo.'
    if (!consent) next.consent = 'Precisamos do seu aceite para encaminhar a solicitação.'
    setErrors(next)
    setFailure(null)

    if (next.name) nameRef.current?.focus()
    else if (next.email) emailRef.current?.focus()
    else if (next.consent) consentRef.current?.focus()
    if (next.name || next.email || next.consent) return

    submitting.current = true
    setSending(true)
    const result = await submitLead({
      kind: 'reward-claim',
      email: email.trim(),
      name: name.trim(),
      consent: true,
      meta: { score: VICTORY_STAGE },
    })
    submitting.current = false
    if (!mounted.current) return
    setSending(false)
    if (result.ok) onClaimed()
    else setFailure(result.reason)
  }

  return (
    <form noValidate onSubmit={onSubmit} aria-busy={sending} className="mt-3">
      <h3 id={headingId} className="font-display text-2xl leading-tight text-butter">
        {reward.headline}
      </h3>
      <p className="mt-2 text-sm font-medium">
        Você zerou o MIAU ORBITAL. Nenhum benefício foi aprovado: não há desconto ou código garantido. Este formulário solicita apenas um contato com o estúdio, sem confirmar condições comerciais.
      </p>

      <div className="mt-4">
        <label htmlFor={`${id}-name`} className={fieldLabelClasses}>
          Nome
        </label>
        <input
          ref={nameRef}
          id={`${id}-name`}
          name="name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? `${id}-name-error` : undefined}
          className={inputClasses}
        />
        {errors.name ? (
          <p id={`${id}-name-error`} role="alert" className={fieldErrorClasses}>
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        <label htmlFor={`${id}-email`} className={fieldLabelClasses}>
          E-mail
        </label>
        <input
          ref={emailRef}
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? `${id}-email-error` : undefined}
          className={inputClasses}
        />
        {errors.email ? (
          <p id={`${id}-email-error`} role="alert" className={fieldErrorClasses}>
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        <div className="flex items-start gap-3">
          <input
            ref={consentRef}
            id={`${id}-consent`}
            name="consent"
            type="checkbox"
            required
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? `${id}-consent-error` : undefined}
            className="mt-0.5 size-5 shrink-0 accent-pink"
          />
          <label htmlFor={`${id}-consent`} className="text-sm font-bold text-cream">
            Aceito receber a resposta a esta solicitação por e-mail.
          </label>
        </div>
        {errors.consent ? (
          <p id={`${id}-consent-error`} role="alert" className={fieldErrorClasses}>
            {errors.consent}
          </p>
        ) : null}
      </div>

      <div className="mt-5 border-t-[3px] border-cream pt-4">
        <p id={`${id}-terms`} className="font-pixel text-[0.55rem] uppercase leading-none text-pink">
          Condições
        </p>
        <ul aria-labelledby={`${id}-terms`} className="mt-2 list-disc space-y-1 pl-5 text-sm font-medium">
          {reward.terms.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ul>
      </div>

      {failure ? (
        <p role="alert" className={cn(fieldErrorClasses, 'mt-4')}>
          {failure === 'not-configured'
            ? 'O envio ainda não está configurado. Sua solicitação não foi enviada. Escreva para '
            : failure === 'rejected'
              ? 'O serviço não aceitou a solicitação. Confira os dados e tente novamente ou escreva para '
              : 'Não foi possível confirmar o envio. Confira a conexão e tente novamente ou escreva para '}
          <a className="underline" href={`mailto:${studioEmail}`}>
            {studioEmail}
          </a>
          .
        </p>
      ) : null}

      <Button type="submit" variant="pink" disabled={sending} className="mt-4 w-full">
        {sending ? 'Enviando…' : 'Consultar benefício'}
      </Button>
    </form>
  )
}
