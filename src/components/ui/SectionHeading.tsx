import type { ReactNode } from 'react'
import type { PaletteToken } from '@/lib/cms/types'
import { cn } from '@/lib/cn'
import { Badge } from './Badge'

interface SectionHeadingProps {
  id: string
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  tone?: PaletteToken
  className?: string
}

export function SectionHeading({ id, eyebrow, title, description, tone = 'pistachio', className }: SectionHeadingProps) {
  return (
    <header className={cn('max-w-3xl', className)}>
      <Badge tone={tone} pixel>
        {eyebrow}
      </Badge>
      <h2 id={id} className="mt-4 font-display text-4xl leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
        {title}
      </h2>
      {description ? <p className="mt-4 text-lg leading-relaxed text-ink/85">{description}</p> : null}
    </header>
  )
}
