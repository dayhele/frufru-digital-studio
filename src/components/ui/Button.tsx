import type { ComponentPropsWithRef } from 'react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'pink' | 'pistachio' | 'butter' | 'cloud' | 'cream'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variants: Record<ButtonVariant, string> = {
  pink: 'bg-pink',
  pistachio: 'bg-pistachio',
  butter: 'bg-butter',
  cloud: 'bg-cloud',
  cream: 'bg-cream',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'gap-1.5 rounded-lg border-2 px-3 py-1.5 text-sm brutal-press-sm',
  md: 'gap-2 rounded-xl border-[3px] px-5 py-2.5 text-base brutal-press',
  lg: 'gap-2.5 rounded-xl border-[3px] px-6 py-3.5 text-lg brutal-press',
}

interface ButtonStyle {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

/** Classes do botão neobrutalista; use em <a> e <Link> que precisam parecer botão. */
export function buttonClasses({ variant = 'pink', size = 'md', className }: ButtonStyle = {}): string {
  return cn(
    'inline-flex select-none items-center justify-center border-ink font-bold leading-tight text-ink',
    'disabled:opacity-60',
    variants[variant],
    sizes[size],
    className,
  )
}

type ButtonProps = ComponentPropsWithRef<'button'> & ButtonStyle

export function Button({ variant, size, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...rest} />
}
