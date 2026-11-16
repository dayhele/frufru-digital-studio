/**
 * Contratos de conteúdo do estúdio.
 *
 * Os componentes só conhecem estes tipos e as funções de `client.ts`.
 * Trocar o mock por Sanity ou Payload significa reimplementar `client.ts`
 * mapeando os documentos do CMS para estas interfaces; nada mais muda.
 */

/** Cores de superfície da paleta oficial (o espresso é reservado a texto e bordas). */
export type PaletteToken = 'cream' | 'pink' | 'pistachio' | 'butter' | 'cloud'

export type ISODateString = string

export interface CmsDocument {
  id: string
  slug: string
}

/* ───────────── Mídia ───────────── */

export type GenerativePattern = 'orbit' | 'grid' | 'stripes' | 'blobs' | 'checker' | 'burst'

/** Arte vetorial gerada no cliente, usada enquanto não há imagem real no CMS. */
export interface GenerativeCover {
  kind: 'generative'
  pattern: GenerativePattern
  background: PaletteToken
  accent: PaletteToken
  /** Texto curto desenhado como elemento gráfico (iniciais, símbolo). */
  glyph?: string
  alt: string
}

export interface ImageCover {
  kind: 'image'
  src: string
  alt: string
  width: number
  height: number
}

export type Cover = GenerativeCover | ImageCover

/* ───────────── Portfólio ───────────── */

export type Discipline = 'identidade' | 'embalagem' | 'editorial' | 'digital'

/** Espaço ocupado pelo case no bento assimétrico. */
export type BentoSize = 'hero' | 'wide' | 'tall' | 'standard'

export interface ProjectMetric {
  label: string
  value: string
}

export interface ColorSwatch {
  name: string
  hex: string
}

export interface Testimonial {
  quote: string
  author: string
  role: string
}

export interface Project extends CmsDocument {
  title: string
  client: string
  year: number
  disciplines: Discipline[]
  /** Uma frase, usada no cartão. */
  summary: string
  challenge: string
  solution: string
  deliverables: string[]
  metrics: ProjectMetric[]
  palette: ColorSwatch[]
  cover: Cover
  gallery: Cover[]
  bentoSize: BentoSize
  accent: PaletteToken
  featured: boolean
  testimonial?: Testimonial
}

/* ───────────── Lab: mockups PSD ───────────── */

export type MockupCategory = 'embalagem' | 'papelaria' | 'impresso' | 'bebida'

export type MockupDownload =
  | { status: 'available'; url: string }
  /** Arquivo ainda não publicado: a interface oferece a lista de espera. */
  | { status: 'coming-soon' }

export interface PsdMockup extends CmsDocument {
  title: string
  category: MockupCategory
  description: string
  dimensions: { width: number; height: number }
  dpi: number
  smartObjectLayers: number
  fileSizeMb: number
  license: string
  tags: string[]
  isNew: boolean
  cover: Cover
  accent: PaletteToken
  download: MockupDownload
}

/* ───────────── Lab: Packaging Studio ───────────── */

export type PackagingStructure = 'tuck-end' | 'sleeve'

/** Medidas internas em milímetros. */
export interface BoxDimensions {
  width: number
  height: number
  depth: number
}

export interface DimensionRange {
  min: number
  max: number
  step: number
}

export interface PackagingTemplate extends CmsDocument {
  name: string
  structure: PackagingStructure
  description: string
  bestFor: string[]
  defaults: BoxDimensions
  limits: Record<keyof BoxDimensions, DimensionRange>
  /** Sangria recomendada, em mm. */
  bleed: number
  material: string
}

/* ───────────── Insights ───────────── */

export type InsightCategory = 'direção criativa' | 'teoria das cores' | 'fluxo de trabalho'

export interface Author {
  name: string
  role: string
}

/**
 * Metadados do artigo. O corpo vive em `src/content/insights/<slug>.mdx`
 * e é carregado sob demanda por `loadInsightBody`.
 */
export interface InsightPost extends CmsDocument {
  title: string
  excerpt: string
  category: InsightCategory
  publishedAt: ISODateString
  readingMinutes: number
  author: Author
  cover: Cover
  accent: PaletteToken
  tags: string[]
  featured: boolean
}

/* ───────────── Configurações do site ───────────── */

export interface SocialLink {
  label: string
  handle: string
  url: string
}

export interface ArcadeReward {
  /** Texto do benefício, ex.: "10% OFF no primeiro projeto". */
  headline: string
  /** Regras exibidas junto ao formulário; devem citar não cumulatividade e novos clientes. */
  terms: string[]
}

export interface SiteSettings {
  studioName: string
  tagline: string
  description: string
  email: string
  socials: SocialLink[]
  newsletterPitch: string
  arcadeReward: ArcadeReward
}
