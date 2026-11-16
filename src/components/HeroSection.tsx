import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ArrowDownRight, Gamepad2, Rotate3D } from 'lucide-react'
import { Button, buttonClasses } from '@/components/ui/Button'
import { useInViewport, useNearViewport } from '@/hooks/useNearViewport'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

// O shell comercial não importa Three: a cena só chega depois do primeiro HTML.
const HeroArcade = lazy(() => import('@/components/HeroArcade'))

export interface HeroInteraction {
  x: number
  y: number
  proximity: number
  focused: boolean
  frontal: boolean
  impulse: number
  requestFrame: (() => void) | null
}

interface HeroSectionProps {
  onPlay: () => void
}

class ArcadeBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onUnavailable: () => void },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onUnavailable()
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function ArcadeFallback({ unavailable = false }: { unavailable?: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-8">
      <div aria-hidden="true" className="relative w-52 sm:w-60">
        <div className="rounded-t-2xl border-[3px] border-ink bg-pink px-4 py-3 text-center font-pixel text-[10px] text-ink shadow-brutal">
          MIAU ORBITAL
        </div>
        <div className="border-x-[3px] border-ink bg-cloud px-5 pb-4 pt-5">
          <div className="grid aspect-[4/3] place-items-center rounded-lg border-[3px] border-ink bg-ink font-pixel text-xl text-butter">
            PLAY
          </div>
        </div>
        <div className="flex items-center justify-between border-[3px] border-ink bg-butter px-6 py-3">
          <span className="h-6 w-3 rounded-t-full border-2 border-ink bg-pink" />
          <span className="flex gap-3">
            <span className="size-5 rounded-full border-2 border-ink bg-pink" />
            <span className="size-5 rounded-full border-2 border-ink bg-pistachio" />
          </span>
        </div>
        <div className="mx-3 grid h-24 place-items-center rounded-b-lg border-x-[3px] border-b-[3px] border-ink bg-pink">
          <span className="h-9 w-7 rounded border-2 border-ink bg-cream p-1.5">
            <span className="block h-1 w-full bg-ink" />
          </span>
        </div>
        <img
          src="/brand/mascot.png"
          alt=""
          width={422}
          height={346}
          decoding="async"
          className="absolute -right-10 bottom-0 w-32 sm:-right-16 sm:w-40"
        />
      </div>
      {unavailable ? (
        <p role="status" className="max-w-xs text-center text-sm leading-relaxed text-cream">
          A cena 3D está indisponível. Você ainda pode jogar pelo botão e explorar o estúdio.
        </p>
      ) : null}
    </div>
  )
}

export function HeroSection({ onPlay }: HeroSectionProps) {
  const sceneRef = useRef<HTMLDivElement>(null)
  const near = useNearViewport(sceneRef, '160px')
  const visible = useInViewport(sceneRef)
  const reducedMotion = usePrefersReducedMotion()
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState !== 'hidden')
  const [unavailable, setUnavailable] = useState(false)
  const interaction = useRef<HeroInteraction>({
    x: 0,
    y: 0,
    proximity: 0,
    focused: false,
    frontal: false,
    impulse: 0,
    requestFrame: null,
  })

  useEffect(() => {
    const onVisibility = () => setPageVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  function boost() {
    interaction.current.impulse = Math.min(interaction.current.impulse + 0.8, 3)
    interaction.current.requestFrame?.()
  }


  return (
    <section
      aria-labelledby="hero-title"
      className="on-dark starfield relative overflow-hidden border-b-[3px] border-ink bg-ink text-cream"
      onPointerDownCapture={(event) => {
        boost()
        if (event.pointerType !== 'mouse') {
          interaction.current.frontal = true
        }
      }}
      onKeyDownCapture={(event) => {
        if (!event.repeat && (event.key === 'Enter' || event.key === ' ')) boost()
      }}
      onFocusCapture={() => {
        interaction.current.focused = true
        boost()
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          interaction.current.focused = false
          interaction.current.requestFrame?.()
        }
      }}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-4 px-5 pb-12 pt-36 sm:px-8 sm:pb-16 sm:pt-40 lg:grid-cols-[1fr_1.05fr] lg:gap-0 lg:pb-20 lg:pt-36">
        <div className="relative z-10 max-w-xl">
          <h1
            id="hero-title"
            className="text-balance font-display text-[clamp(2rem,10.5vw,4.5rem)] leading-[1.06] tracking-[-0.025em] lg:text-[clamp(3rem,5.5vw,4.5rem)]"
          >
            Design com <span className="text-pink">personalidade.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-cream sm:text-lg">
            Identidades, embalagens e experiências digitais para marcas que querem ser lembradas.
            Explore o universo FruFru — e encontre um pouco de diversão pelo caminho.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#work" className={buttonClasses({ variant: 'pink', size: 'lg' })}>
              Ver trabalhos <ArrowDownRight size={21} aria-hidden="true" />
            </a>
            <Button variant="cream" size="lg" onClick={onPlay}>
              <Gamepad2 size={21} aria-hidden="true" /> Jogar
            </Button>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-cream">
            O arcade é opcional. O próximo projeto pode ser o seu.
          </p>
        </div>

        <div className="relative min-w-0">
          <div
            ref={sceneRef}
            className="relative h-[390px] w-full sm:h-[480px] lg:h-[540px]"
            onPointerMove={(event) => {
              if (event.pointerType !== 'mouse') return
              const bounds = event.currentTarget.getBoundingClientRect()
              const x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
              const y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1
              interaction.current.x = x
              interaction.current.y = y
              interaction.current.proximity = Math.max(0, 1 - Math.hypot(x + 0.2, y) / 1.2)
              interaction.current.requestFrame?.()
            }}
            onPointerLeave={() => {
              interaction.current.x = 0
              interaction.current.y = 0
              interaction.current.proximity = 0
              interaction.current.requestFrame?.()
            }}
          >
            {near && !unavailable ? (
              <ArcadeBoundary
                fallback={<ArcadeFallback unavailable />}
                onUnavailable={() => setUnavailable(true)}
              >
                <Suspense fallback={<ArcadeFallback />}>
                  <HeroArcade
                    active={visible && pageVisible}
                    reducedMotion={reducedMotion}
                    interaction={interaction}
                    onPlay={onPlay}
                    onUnavailable={() => setUnavailable(true)}
                  />
                </Suspense>
              </ArcadeBoundary>
            ) : (
              <ArcadeFallback unavailable={unavailable} />
            )}
          </div>
          {!reducedMotion && !unavailable ? (
            <div className="relative z-10 flex justify-center pt-2">
              <Button
                variant="butter"
                size="sm"
                onClick={() => {
                  interaction.current.frontal = true
                  interaction.current.requestFrame?.()
                }}
              >
                <Rotate3D size={17} aria-hidden="true" />
                Girar arcade
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
