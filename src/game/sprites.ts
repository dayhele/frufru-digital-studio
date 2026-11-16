import { palette, type PaletteName } from '@/lib/palette'
import type { Tier } from './difficulty'

/**
 * Sprites do MIAU ORBITAL: mapas de pixel em texto, pintados uma única vez em
 * canvases fora da tela. Cada caractere aponta para uma cor da paleta oficial.
 */
const LEGEND: Record<string, PaletteName> = {
  i: 'ink',
  p: 'pink',
  g: 'pistachio',
  c: 'cream',
  b: 'butter',
  u: 'cloud',
}

/* Cabeça da mascote (16×14) com jetpack à esquerda. */
const CAT = [
  '....pp......pp..',
  '...piip....piip.',
  '...piiippppiiip.',
  '..piiiiiiiiiiiip',
  'uupiiiiiiiiiiiip',
  'ucpiiiiiiiiiiiip',
  'ucpigggiiiigggip',
  'ucpigigiiiigigip',
  'uupiiiiippiiiiip',
  'bbpiiiiiiiiiiiip',
  '..piiiiiiiiiiiip',
  '...piiiiiiiiiip.',
  '....piiiiiiiip..',
  '.....pppppppp...',
]

const CAT_BLINK = [
  '....pp......pp..',
  '...piip....piip.',
  '...piiippppiiip.',
  '..piiiiiiiiiiiip',
  'uupiiiiiiiiiiiip',
  'ucpiiiiiiiiiiiip',
  'ucpiiiiiiiiiiiip',
  'ucpigggiiiigggip',
  'uupiiiiippiiiiip',
  'bbpiiiiiiiiiiiip',
  '..piiiiiiiiiiiip',
  '...piiiiiiiiiip.',
  '....piiiiiiiip..',
  '.....pppppppp...',
]

const FLAME_SMALL = ['.bb.', '..p.']
const FLAME_MID = ['.bb.', '.bp.', '..p.']
const FLAME_BIG = ['bbbb', 'bccb', '.bp.', '.pp.', '..p.']

/* Broto alienígena: bulbo rosa de um olho só, duas anteninhas, caule pistache. */
const SPROUT = [
  'p......p',
  '.p....p.',
  '..pppp..',
  '.pccccp.',
  '.pciicp.',
  '.pccccp.',
  '..pppp..',
  '...gg...',
]

/* Escotilha (10×10): o vidro é o branco do olho; íris e pupila são desenhadas por cima. */
const PORTHOLE = [
  '...iiii...',
  '.iiccccii.',
  '.icccccci.',
  'icccccccci',
  'icccccccci',
  'icccccccci',
  'icccccccci',
  '.icccccci.',
  '.iiccccii.',
  '...iiii...',
]

const PORTHOLE_BLINK = [
  '...iiii...',
  '.iiggggii.',
  '.iggggggi.',
  'iggggggggi',
  'iggggggggi',
  'iiiiiiiiii',
  'iggggggggi',
  '.iggggggi.',
  '.iiggggii.',
  '...iiii...',
]

const PLANET = [
  '.........uuuu.........',
  '.......uuiiiiii.......',
  '......uiiiiiiiii......',
  '.....uiiiiiiiiiii.....',
  '.....uipppppppiii.....',
  '.bbbbiiiiiiiiiiiibbbb.',
  'b....iiiiiippppii....b',
  '.bbbbbbbbbbbbbbbbbbbb.',
  '.....iiiiiiiiiiii.....',
  '......iiiiiiiiii......',
  '.......iiiiiiii.......',
  '.........iiii.........',
]

/* Ladrilho do solo lunar (16×24). */
const GROUND = [
  'iiiiiiiiiiiiiiii',
  'cccccccccccccccc',
  'cccccccccccccccc',
  'bbbbbbbbbbbbbbbb',
  'bbbiiibbbbbbbbbb',
  'bbibbbibbbbbbbbb',
  'bbibbbibbbbbiibb',
  'bbbiiicbbbbibbib',
  'bbbbcccbbbbbiicb',
  'bbbbbbbbbbbbbccb',
  'bbbbbbbbbbbbbbbb',
  'bbbbbbbibbbbbbbb',
  'bibbbbbbbbbbbbbb',
  'bbbbbbbbbbbbbbbb',
  'bbbbbbbbbbbiibbb',
  'bbbbiibbbbibbibb',
  'bbbibbibbbbiicbb',
  'bbbbiicbbbbbbbbb',
  'bbbbbbbbbbbbbbbb',
  'ibibibibibibibib',
  'bibibibibibibibi',
  'ibibibibibibibib',
  'iiiiiiiiiiiiiiii',
  'iiiiiiiiiiiiiiii',
]

export interface Sprite {
  canvas: HTMLCanvasElement
  w: number
  h: number
}

export type SpriteName =
  | 'cat'
  | 'catBlink'
  | 'flameSmall'
  | 'flameMid'
  | 'flameBig'
  | 'sproutUp'
  | 'sproutDown'
  | 'porthole'
  | 'portholeBlink'
  | 'planet'
  | 'ground'

export type SpriteSheet = Record<SpriteName, Sprite>

function renderSprite(rows: readonly string[], scale = 1): Sprite {
  const w = rows.reduce((max, row) => Math.max(max, row.length), 0) * scale
  const h = rows.length * scale
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.imageSmoothingEnabled = false
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const color = LEGEND[row[x]]
        if (!color) continue
        ctx.fillStyle = palette[color]
        ctx.fillRect(x * scale, y * scale, scale, scale)
      }
    })
  }
  return { canvas, w, h }
}

let sheet: SpriteSheet | null = null

export function getSprites(): SpriteSheet {
  sheet ??= {
    cat: renderSprite(CAT),
    catBlink: renderSprite(CAT_BLINK),
    flameSmall: renderSprite(FLAME_SMALL),
    flameMid: renderSprite(FLAME_MID),
    flameBig: renderSprite(FLAME_BIG),
    sproutUp: renderSprite(SPROUT),
    sproutDown: renderSprite([...SPROUT].reverse()),
    porthole: renderSprite(PORTHOLE),
    portholeBlink: renderSprite(PORTHOLE_BLINK),
    planet: renderSprite(PLANET, 2),
    ground: renderSprite(GROUND),
  }
  return sheet
}

/* ───────────── Fundo: espaço com horizonte pontilhado (dither 4×4) ───────────── */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]

function rgb(name: PaletteName): [number, number, number] {
  const hex = palette[name]
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ]
}

const GLOW: Record<Tier, PaletteName | null> = { cruise: null, hyper: 'pink', extreme: 'pistachio' }

function renderBackdrop(width: number, height: number, tier: Tier): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const image = ctx.createImageData(width, height)
  const ink = rgb('ink')
  const glowName = GLOW[tier]
  const glow = glowName ? rgb(glowName) : null
  const glowStart = height * 0.82

  for (let y = 0; y < height; y++) {
    const glowLevel = Math.max(0, (y - glowStart) / (height - glowStart)) * 0.2
    for (let x = 0; x < width; x++) {
      const glowThreshold = (BAYER[((y + 1) & 3) * 4 + ((x + 2) & 3)] + 0.5) / 16
      let color = ink
      if (glow && glowThreshold < glowLevel) color = glow
      const offset = (y * width + x) * 4
      image.data[offset] = color[0]
      image.data[offset + 1] = color[1]
      image.data[offset + 2] = color[2]
      image.data[offset + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

const backdrops = new Map<string, Record<Tier, HTMLCanvasElement>>()

/** Um fundo por tier (o brilho do horizonte muda de cor), em cache por tamanho. */
export function getBackdrops(width: number, height: number): Record<Tier, HTMLCanvasElement> {
  const key = `${width}x${height}`
  let set = backdrops.get(key)
  if (!set) {
    set = {
      cruise: renderBackdrop(width, height, 'cruise'),
      hyper: renderBackdrop(width, height, 'hyper'),
      extreme: renderBackdrop(width, height, 'extreme'),
    }
    backdrops.set(key, set)
  }
  return set
}
