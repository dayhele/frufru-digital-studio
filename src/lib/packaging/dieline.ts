import type { BoxDimensions, PackagingStructure } from '@/lib/cms/types'

/**
 * Geometria da faca (dieline) em milímetros. Sem React, sem three:
 * o preview 2D, o arquivo SVG e o modelo 3D partem das mesmas proporções.
 */

export interface DielineCrease {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface DielineLabel {
  x: number
  y: number
  text: string
  /** Rotação em graus em torno de (x, y), para painéis estreitos. */
  rotate?: number
}

export interface Dieline {
  structure: PackagingStructure
  /** Tamanho total do documento, já com a margem. */
  width: number
  height: number
  /** Contorno externo: um único path SVG fechado. */
  cut: string
  creases: DielineCrease[]
  labels: DielineLabel[]
  /** Guias conservadoras por painel, afastadas de cortes e vincos. */
  safeAreas: Array<{ x: number; y: number; width: number; height: number }>
  safety: number
  bleed: number
  /** Margem aplicada em volta do contorno (sangria + 5 mm). */
  margin: number
  /** Tamanho da peça aberta, sem margem. */
  flatWidth: number
  flatHeight: number
  /** Área de cartão dentro do contorno, em mm². */
  panelArea: number
}

/** Medidas derivadas, compartilhadas com o modelo 3D. */
export interface DielineMetrics {
  /** Largura da aba de cola. */
  glue: number
  /** Chanfro da aba de cola, em cima e embaixo. */
  glueChamfer: number
  /** Altura da aba de encaixe (tuck). 0 na luva. */
  tuck: number
  /** Raio dos cantos externos da aba de encaixe. */
  tuckRadius: number
  /** Altura das abas de pó (dust flaps). 0 na luva. */
  dust: number
  /** Chanfro lateral das abas de pó. */
  dustChamfer: number
}

export const GLUE_FLAP = 15
export const GLUE_CHAMFER = 5
const SAFE_MARGIN = 5
const SAFETY = 3
const LEGEND_HEIGHT = 12

const INK = '#401708'
const PINK = '#FBC4CE'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function dielineMetrics(structure: PackagingStructure, dims: BoxDimensions): DielineMetrics {
  if (![dims.width, dims.height, dims.depth].every((value) => Number.isFinite(value) && value > 0)) {
    throw new RangeError('As dimensões da embalagem devem ser finitas e positivas.')
  }
  // A aba fica dentro da lateral, inclusive na luva com apenas 10 mm de profundidade.
  const base = {
    glue: Math.min(GLUE_FLAP, dims.depth * 0.6),
    glueChamfer: Math.min(GLUE_CHAMFER, dims.height / 4),
  }
  if (structure === 'sleeve') {
    return { ...base, tuck: 0, tuckRadius: 0, dust: 0, dustChamfer: 0 }
  }
  const tuck = Math.min(clamp(dims.depth * 0.45, 10, 18), dims.height * 0.4)
  return {
    ...base,
    tuck,
    tuckRadius: Math.min(tuck, dims.width / 2, 8),
    dust: Math.min(dims.depth, dims.width / 2) * 0.8,
    dustChamfer: dims.depth * 0.15,
  }
}

/** Número compacto para o atributo `d` (até 3 casas, sem zeros à direita). */
function n(value: number): string {
  const rounded = Math.round(value * 1000) / 1000
  return Object.is(rounded, -0) ? '0' : String(rounded)
}

export function buildDieline(structure: PackagingStructure, dims: BoxDimensions, bleed: number): Dieline {
  const W = dims.width
  const H = dims.height
  const D = dims.depth
  const m = dielineMetrics(structure, dims)
  if (!Number.isFinite(bleed) || bleed < 0) {
    throw new RangeError('A sangria deve ser finita e não negativa.')
  }
  const margin = bleed + SAFE_MARGIN

  const g = m.glue
  const gc = m.glueChamfer
  const t = m.tuck
  const r = m.tuckRadius
  const f = m.dust
  const c = m.dustChamfer

  // Colunas (sem margem): aba de cola | verso | lateral | frente | lateral
  const x0 = margin
  const x1 = x0 + g
  const x2 = x1 + W
  const x3 = x2 + D
  const x4 = x3 + W
  const x5 = x4 + D

  const tuckEnd = structure === 'tuck-end'

  // Faixas: aba de encaixe | tampa | corpo | fundo | aba de encaixe
  const y0 = margin
  const y1 = y0 + t
  const y2 = tuckEnd ? y1 + D : y0
  const y3 = y2 + H
  const y4 = tuckEnd ? y3 + D : y3
  const y5 = y4 + t

  const flatWidth = x5 - x0
  const flatHeight = y5 - y0

  const d: string[] = []
  const M = (x: number, y: number) => d.push(`M${n(x)} ${n(y)}`)
  const L = (x: number, y: number) => d.push(`L${n(x)} ${n(y)}`)
  const Q = (cx: number, cy: number, x: number, y: number) => d.push(`Q${n(cx)} ${n(cy)} ${n(x)} ${n(y)}`)

  const creases: DielineCrease[] = []
  const labels: DielineLabel[] = []
  const safeAreas: Dieline['safeAreas'] = []
  const addSafeArea = (x: number, y: number, width: number, height: number) => {
    if (width > SAFETY * 2 && height > SAFETY * 2) {
      safeAreas.push({ x: x + SAFETY, y: y + SAFETY, width: width - SAFETY * 2, height: height - SAFETY * 2 })
    }
  }
  for (const [x, width] of [[x1, W], [x2, D], [x3, W], [x4, D]]) {
    addSafeArea(x, y2, width, H)
  }
  if (tuckEnd) {
    addSafeArea(x1, y1, W, D)
    addSafeArea(x1, y3, W, D)
  }
  const bodyY = (y2 + y3) / 2
  const sideRotate = D < 28 ? -90 : undefined

  M(x1, y2)
  if (tuckEnd) {
    // Tampa + aba de encaixe no topo do verso
    L(x1, y0 + r)
    Q(x1, y0, x1 + r, y0)
    L(x2 - r, y0)
    Q(x2, y0, x2, y0 + r)
    L(x2, y2)
    // Aba de pó da lateral esquerda
    L(x2 + c, y2 - f)
    L(x3 - c, y2 - f)
    L(x3, y2)
    // Topo da frente: corte reto
    L(x4, y2)
    // Aba de pó da lateral direita
    L(x4 + c, y2 - f)
    L(x5 - c, y2 - f)
    L(x5, y2)
    // Borda direita
    L(x5, y3)
    // Base, da direita para a esquerda
    L(x5 - c, y3 + f)
    L(x4 + c, y3 + f)
    L(x4, y3)
    L(x3, y3)
    L(x3 - c, y3 + f)
    L(x2 + c, y3 + f)
    L(x2, y3)
    // Fundo + aba de encaixe na base do verso
    L(x2, y5 - r)
    Q(x2, y5, x2 - r, y5)
    L(x1 + r, y5)
    Q(x1, y5, x1, y5 - r)
    L(x1, y3)
  } else {
    L(x5, y2)
    L(x5, y3)
    L(x1, y3)
  }
  // Aba de cola, de volta ao início
  L(x0, y3 - gc)
  L(x0, y2 + gc)
  d.push('Z')

  for (const x of [x1, x2, x3, x4]) {
    creases.push({ x1: x, y1: y2, x2: x, y2: y3 })
  }
  if (tuckEnd) {
    for (const y of [y1, y2, y3, y4]) {
      creases.push({ x1, y1: y, x2, y2: y })
    }
    for (const y of [y2, y3]) {
      creases.push({ x1: x2, y1: y, x2: x3, y2: y })
      creases.push({ x1: x4, y1: y, x2: x5, y2: y })
    }
  }

  labels.push(
    { x: (x1 + x2) / 2, y: bodyY, text: 'verso' },
    { x: (x2 + x3) / 2, y: bodyY, text: 'lateral', rotate: sideRotate },
    { x: (x3 + x4) / 2, y: bodyY, text: 'frente' },
    { x: (x4 + x5) / 2, y: bodyY, text: 'lateral', rotate: sideRotate },
  )
  if (tuckEnd) {
    labels.push(
      { x: (x1 + x2) / 2, y: (y1 + y2) / 2, text: 'tampa' },
      { x: (x1 + x2) / 2, y: (y3 + y4) / 2, text: 'fundo' },
    )
  }
  labels.push({ x: (x0 + x1) / 2, y: bodyY, text: 'aba de cola', rotate: -90 })

  let panelArea = (2 * W + 2 * D) * H + g * (H - gc)
  if (tuckEnd) {
    // Cada canto quadrático remove r²/6; há dois cantos em cada aba.
    panelArea += 2 * W * D + 2 * (W * t - (r * r) / 3) + 4 * f * (D - c)
  }

  return {
    structure,
    width: flatWidth + margin * 2,
    height: flatHeight + margin * 2 + LEGEND_HEIGHT,
    cut: d.join(' '),
    creases,
    labels,
    safeAreas,
    safety: SAFETY,
    bleed,
    margin,
    flatWidth,
    flatHeight,
    panelArea,
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export interface DielineMeta {
  name: string
  dims: BoxDimensions
  bleed: number
}

/** Documento SVG autônomo, em escala 1:1 (1 unidade = 1 mm), com as camadas que a gráfica espera. */
export function dielineToSvg(dieline: Dieline, meta: DielineMeta): string {
  const w = n(dieline.width)
  const h = n(dieline.height)
  const { width: W, height: H, depth: D } = meta.dims
  const title = `${meta.name} ${n(W)} × ${n(H)} × ${n(D)} mm`
  const legend = `${n(W)} × ${n(H)} × ${n(D)} mm (L × A × P) · escala 1:1`
  const guides = `Sangria ${n(dieline.bleed)} mm · segurança por painel ${n(dieline.safety)} mm`
  const layer = (id: string) => `<g id="${id}" inkscape:groupmode="layer" inkscape:label="${id}"`

  const creases = dieline.creases
    .map((c) => `    <line x1="${n(c.x1)}" y1="${n(c.y1)}" x2="${n(c.x2)}" y2="${n(c.y2)}"/>`)
    .join('\n')

  const labels = dieline.labels
    .map((label) => {
      const rotate = label.rotate ? ` transform="rotate(${n(label.rotate)} ${n(label.x)} ${n(label.y)})"` : ''
      return `    <text x="${n(label.x)}" y="${n(label.y)}" text-anchor="middle" dominant-baseline="middle"${rotate}>${escapeXml(label.text)}</text>`
    })
    .join('\n')
  const safety = dieline.safeAreas
    .map((area) => `    <rect x="${n(area.x)}" y="${n(area.y)}" width="${n(area.width)}" height="${n(area.height)}"/>`)
    .join('\n')
  const dimensionY = dieline.margin + dieline.flatHeight + dieline.bleed + 3
  const dimensionX = dieline.margin - dieline.bleed - 2.5

  const parts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}">`,
    `  <title>${escapeXml(title)}</title>`,
    `  <desc>${escapeXml('Estudo geométrico sem compensação de espessura. Guias de segurança por painel; validar material, tolerâncias e arte-final com a gráfica.')}</desc>`,
    `  ${layer('sangria')} fill="none" stroke="${PINK}" stroke-width="${n(dieline.bleed * 2)}" stroke-linejoin="round" stroke-linecap="round">`,
    `    <path d="${dieline.cut}"/>`,
    '  </g>',
    `  ${layer('corte')} fill="none" stroke="${INK}" stroke-width="0.25" stroke-linejoin="round">`,
    `    <path d="${dieline.cut}"/>`,
    '  </g>',
    `  ${layer('vinco')} fill="none" stroke="${INK}" stroke-width="0.25" stroke-dasharray="2 1.5">`,
    creases,
    '  </g>',
    `  ${layer('seguranca')} fill="none" stroke="${INK}" stroke-width="0.15" stroke-dasharray="0.75 1.25">`,
    safety,
    '  </g>',
    `  ${layer('cotas')} fill="${INK}" stroke="none" font-family="Helvetica, Arial, sans-serif" font-size="3">`,
    labels,
    `    <text x="${n(dieline.margin + dieline.flatWidth / 2)}" y="${n(dimensionY)}" text-anchor="middle">${n(dieline.flatWidth)} mm aberto</text>`,
    `    <text x="${n(dimensionX)}" y="${n(dieline.margin + dieline.flatHeight / 2)}" text-anchor="middle" transform="rotate(-90 ${n(dimensionX)} ${n(dieline.margin + dieline.flatHeight / 2)})">${n(dieline.flatHeight)} mm</text>`,
    `    <text x="${n(dieline.margin)}" y="${n(dieline.height - 6)}" font-size="2.5">${escapeXml(legend)}</text>`,
    `    <text x="${n(dieline.margin)}" y="${n(dieline.height - 2.5)}" font-size="2.5">${escapeXml(guides)}</text>`,
    '  </g>',
    '</svg>',
    '',
  ]
  return parts.join('\n')
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Ex.: `frufru-dieline-cartucho-tuck-end-80x120x40mm.svg` */
export function dielineFileName(name: string, dims: BoxDimensions): string {
  const slug = slugify(name) || 'embalagem'
  const size = [dims.width, dims.height, dims.depth].map((v) => slugify(n(v)) || '0').join('x')
  return `frufru-dieline-${slug}-${size}mm.svg`
}
