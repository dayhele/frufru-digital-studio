import { MoveHorizontal } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'

interface BeforeAfterProps {
  label: string
  before: ReactNode
  after: ReactNode
  beforeLabel?: string
  afterLabel?: string
}

/**
 * Comparador antes/depois. O controle é um <input type="range"> de verdade:
 * teclado, toque e leitor de tela funcionam sem código extra.
 */
export function BeforeAfter({ label, before, after, beforeLabel = 'antes', afterLabel = 'depois' }: BeforeAfterProps) {
  const [position, setPosition] = useState(50)
  const id = useId()

  return (
    <figure className="not-prose my-10">
      <div className="relative overflow-hidden rounded-2xl border-[3px] border-ink shadow-brutal">
        <div aria-hidden>{after}</div>
        <div aria-hidden className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          {before}
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-y-0 w-[3px] bg-ink" style={{ left: `${position}%` }}>
          <span className="absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-ink bg-butter">
            <MoveHorizontal size={16} />
          </span>
        </div>
        <span aria-hidden className="absolute left-3 top-3 rounded-md border-2 border-ink bg-cream px-2 py-1 font-pixel text-[0.5rem] uppercase">
          {beforeLabel}
        </span>
        <span aria-hidden className="absolute right-3 top-3 rounded-md border-2 border-ink bg-pistachio px-2 py-1 font-pixel text-[0.5rem] uppercase">
          {afterLabel}
        </span>
      </div>
      <label htmlFor={id} className="mt-4 block text-sm font-bold text-ink">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-valuetext={`${position}% ${beforeLabel}, ${100 - position}% ${afterLabel}`}
        className="mt-2 w-full accent-ink"
      />
    </figure>
  )
}

/** Amostra usada nos artigos para comparar hierarquia e contraste. */
export function ContrastSample({ variant }: { variant: 'weak' | 'strong' }) {
  const strong = variant === 'strong'
  return (
    <div className={strong ? 'bg-pink p-6 sm:p-8' : 'bg-pink p-6 sm:p-8'}>
      <p className={strong ? 'font-pixel text-[0.6rem] text-ink' : 'text-xs text-ink/35'}>LANÇAMENTO</p>
      <p className={strong ? 'mt-3 font-display text-4xl text-ink' : 'mt-3 text-3xl font-light text-ink/40'}>
        Sabonete de Pitanga
      </p>
      <p className={strong ? 'mt-2 font-medium text-ink' : 'mt-2 text-ink/30'}>
        Barra vegana de 90 g, perfume de quintal no verão.
      </p>
      <span
        className={
          strong
            ? 'mt-5 inline-block rounded-xl border-[3px] border-ink bg-butter px-4 py-2 font-bold text-ink shadow-brutal-sm'
            : 'mt-5 inline-block rounded-xl bg-cream/60 px-4 py-2 text-ink/40'
        }
      >
        Comprar
      </span>
    </div>
  )
}
