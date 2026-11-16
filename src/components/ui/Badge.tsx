import type { ReactNode } from 'react'
import type { PaletteToken } from '@/lib/cms/types'
import { cn } from '@/lib/cn'
import { surfaceClass } from '@/lib/palette'

interface BadgeProps {
  tone?: PaletteToken
  /** Fonte pixel, para selos de arcade e HUD. */
  pixel?: boolean
  className?: string
  children: ReactNode
}

export function Badge({ tone = 'pistachio', pixel = false, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border-2 border-ink text-ink shadow-brutal-sm',
        pixel
          ? 'px-2 py-1.5 font-pixel text-[0.55rem] uppercase leading-none'
          : 'px-2 py-0.5 text-xs font-bold uppercase tracking-wide',
        surfaceClass[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
