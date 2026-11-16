import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { contrastRatio, wcagLevel } from '@/lib/contrast'
import { palette } from '@/lib/palette'

interface Swatch {
  name: string
  hex: string
}

interface ColorPaletteProps {
  title?: string
  colors: Swatch[]
}

/** Paleta clicável para artigos: copia o hex e mostra o contraste com o texto espresso. */
export function ColorPalette({ title = 'Paleta', colors }: ColorPaletteProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [copyError, setCopyError] = useState('')

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(null), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = async (hex: string) => {
    setCopyError('')
    try {
      await navigator.clipboard.writeText(hex)
      setCopied(hex)
    } catch {
      setCopied(null)
      setCopyError(`Não foi possível copiar. Selecione o código ${hex} e copie manualmente.`)
    }
  }

  return (
    <figure className="not-prose my-10 rounded-2xl border-[3px] border-ink bg-cream p-4 shadow-brutal sm:p-5">
      <figcaption className="mb-4 flex items-center justify-between gap-3">
        <span className="font-pixel text-[0.6rem] text-ink">{title.toUpperCase()}</span>
        <span className="text-xs font-semibold text-ink/85">clique para copiar</span>
      </figcaption>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {colors.map((color) => {
          const ratio = contrastRatio(color.hex, palette.ink)
          return (
            <li key={color.hex}>
              <button
                type="button"
                onClick={() => copy(color.hex)}
                aria-label={`Copiar ${color.name}, ${color.hex}`}
                className="flex w-full flex-col overflow-hidden rounded-xl border-[3px] border-ink bg-cream text-left brutal-press-sm"
              >
                <span className="flex h-20 items-end p-2" style={{ backgroundColor: color.hex }}>
                  {/* A amostra de texto só aparece onde o contraste é legível. */}
                  {ratio >= 3 ? <span className="font-display text-2xl text-ink">Aa</span> : null}
                </span>
                <span className="border-t-[3px] border-ink p-2">
                  <span className="flex items-center justify-between text-sm font-bold text-ink">
                    {color.name}
                    {copied === color.hex ? <Check aria-hidden size={14} /> : <Copy aria-hidden size={14} />}
                  </span>
                  <span className="block font-mono text-xs text-ink">{color.hex}</span>
                  <span className="block text-xs text-ink/85">
                    {ratio.toFixed(1)}:1 com espresso · {wcagLevel(ratio)}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p aria-live="polite" className={copyError ? 'mt-4 text-sm font-semibold' : 'sr-only'}>
        {copyError || (copied ? `${copied} copiado` : '')}
      </p>
    </figure>
  )
}
