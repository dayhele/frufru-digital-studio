import type { PaletteToken } from '@/lib/cms/types'

/** Paleta oficial. Fonte única para Canvas 2D, WebGL e SVG; o CSS usa os tokens de globals.css. */
export const palette = {
  cream: '#FFF6E9',
  ink: '#401708',
  pink: '#FBC4CE',
  pistachio: '#D9D273',
  butter: '#FFF8C7',
  cloud: '#E0EAFF',
} as const

export type PaletteName = keyof typeof palette

/** Classes literais (o Tailwind precisa enxergá-las inteiras no código). */
export const surfaceClass: Record<PaletteToken, string> = {
  cream: 'bg-cream',
  pink: 'bg-pink',
  pistachio: 'bg-pistachio',
  butter: 'bg-butter',
  cloud: 'bg-cloud',
}
