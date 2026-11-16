import { Component, Suspense, lazy, useId, useMemo, useState, type ReactNode } from 'react'
import { Download } from 'lucide-react'
import type { BoxDimensions, PackagingTemplate, PaletteToken } from '@/lib/cms/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/lib/cn'
import { buildDieline, dielineFileName, dielineToSvg, type Dieline } from '@/lib/packaging/dieline'
import { palette, surfaceClass } from '@/lib/palette'

const BoxViewer = lazy(() => import('./BoxViewer'))

const SWATCHES: Array<{ token: PaletteToken; label: string }> = [
  { token: 'cream', label: 'Creme' },
  { token: 'pink', label: 'Rosa' },
  { token: 'pistachio', label: 'Pistache' },
  { token: 'butter', label: 'Manteiga' },
  { token: 'cloud', label: 'Azul nuvem' },
]

const DIMENSIONS: Array<{ key: keyof BoxDimensions; label: string }> = [
  { key: 'width', label: 'Largura' },
  { key: 'height', label: 'Altura' },
  { key: 'depth', label: 'Profundidade' },
]

const rangeClasses = 'h-6 w-full cursor-pointer accent-ink'
const groupTitleClasses = 'mb-2 text-sm font-bold text-ink'

let webglSupport: boolean | null = null

/** Testa uma única vez se o navegador entrega um contexto WebGL. */
function hasWebgl(): boolean {
  if (webglSupport !== null) return webglSupport
  try {
    const canvas = document.createElement('canvas')
    // O renderer atual do Three usa WebGL 2; WebGL 1 não basta para esta prévia.
    const context = canvas.getContext('webgl2')
    webglSupport = context !== null
    context?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webglSupport = false
  }
  return webglSupport
}

function formatMm(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

function ViewerFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8 text-center">
      <p className="max-w-xs text-sm font-medium text-ink">
        <span className="mb-1 block font-display text-xl">Sem 3D por aqui</span>
        Seu navegador não liberou o WebGL, então a prévia 3D ficou de fora. A faca logo abaixo e o download
        funcionam normalmente.
      </p>
    </div>
  )
}

function ViewerSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8" role="status">
      <div className="flex flex-col items-center gap-3">
        <div className="h-28 w-24 rounded-lg border-[3px] border-dashed border-ink/50 motion-safe:animate-pulse" />
        <p className="text-sm font-bold text-ink">Carregando a prévia 3D…</p>
      </div>
    </div>
  )
}

/** Se o chunk 3D ou o contexto WebGL falharem, o resto da ferramenta continua de pé. */
class ViewerBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? <ViewerFallback /> : this.props.children
  }
}

function DielinePreview({ dieline, bleed, title }: { dieline: Dieline; bleed: number; title: string }) {
  const fontSize = Math.min(9, Math.max(4.5, dieline.width * 0.02))
  return (
    <svg
      viewBox={`0 0 ${dieline.width} ${dieline.height}`}
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid meet"
      className="block h-auto max-h-[440px] w-full"
    >
      <path
        d={dieline.cut}
        fill="none"
        stroke={palette.pink}
        strokeWidth={bleed * 2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d={dieline.cut}
        fill={palette.cream}
        stroke={palette.ink}
        strokeWidth={1.75}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <g stroke={palette.ink} strokeWidth={1.25} strokeDasharray="5 4" fill="none">
        {dieline.creases.map((crease, i) => (
          <line
            key={i}
            x1={crease.x1}
            y1={crease.y1}
            x2={crease.x2}
            y2={crease.y2}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
      <g stroke={palette.ink} strokeWidth={0.75} strokeDasharray="1 3" fill="none" opacity={0.65}>
        {dieline.safeAreas.map((area, i) => (
          <rect key={i} {...area} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
      <g fill={palette.ink} fontSize={fontSize} fontWeight={600} className="font-sans" aria-hidden="true">
        {dieline.labels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            dominantBaseline="middle"
            transform={label.rotate ? `rotate(${label.rotate} ${label.x} ${label.y})` : undefined}
          >
            {label.text}
          </text>
        ))}
      </g>
      <text x={dieline.margin} y={dieline.height - 4} fill={palette.ink} fontSize={3.5} fontWeight={600}>
        {formatMm(dieline.flatWidth)} × {formatMm(dieline.flatHeight)} mm · peça aberta
      </text>
    </svg>
  )
}

function clampDims(dims: BoxDimensions, template: PackagingTemplate): BoxDimensions {
  const clamp = (key: keyof BoxDimensions) => {
    const { min, max, step } = template.limits[key]
    const source = Number.isFinite(dims[key]) ? dims[key] : min
    const bounded = Math.min(max, Math.max(min, source))
    const snapped = min + Math.round((bounded - min) / step) * step
    return Math.min(max, Math.max(min, Number(snapped.toFixed(6))))
  }
  return { width: clamp('width'), height: clamp('height'), depth: clamp('depth') }
}

export default function PackagingStudio({ templates }: { templates: PackagingTemplate[] }) {
  const uid = useId()
  const reducedMotion = usePrefersReducedMotion()
  const [webgl] = useState(hasWebgl)

  const [templateId, setTemplateId] = useState<string | null>(templates[0]?.id ?? null)
  const template = templates.find((item) => item.id === templateId) ?? templates[0]

  const [customDims, setCustomDims] = useState<{ templateId: string; dims: BoxDimensions } | null>(null)
  const [fold, setFold] = useState(100)
  const [color, setColor] = useState<PaletteToken>('pink')
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const dims = useMemo<BoxDimensions | null>(() => {
    if (!template) return null
    // Medidas editadas valem só para o modelo em que foram feitas; trocar de modelo volta ao padrão.
    const source = customDims?.templateId === template.id ? customDims.dims : template.defaults
    return clampDims(source, template)
  }, [template, customDims])

  const dieline = useMemo(
    () => (template && dims ? buildDieline(template.structure, dims, template.bleed) : null),
    [template, dims],
  )

  if (!template || !dims || !dieline) {
    return (
      <div className="rounded-2xl border-[3px] border-ink bg-cream p-6 shadow-brutal">
        <p className="font-medium text-ink">Nenhum modelo de embalagem disponível no momento.</p>
      </div>
    )
  }

  const selectTemplate = (id: string) => {
    setTemplateId(id)
    setCustomDims(null)
    setDownloadError(null)
  }

  const setDimension = (key: keyof BoxDimensions, value: number) => {
    if (!Number.isFinite(value)) return
    setCustomDims({ templateId: template.id, dims: { ...dims, [key]: value } })
  }

  const download = () => {
    setDownloadError(null)
    try {
      const svg = dielineToSvg(dieline, { name: template.name, dims, bleed: template.bleed })
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
      const link = document.createElement('a')
      try {
        link.href = url
        link.download = dielineFileName(template.name, dims)
        link.rel = 'noopener'
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
      } finally {
        link.remove()
        // Não revoga no mesmo tick: navegadores podem consumir o Blob após o clique.
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
      }
    } catch {
      setDownloadError('Não foi possível preparar o SVG. Tente baixar novamente neste navegador.')
    }
  }

  const sizeText = `${formatMm(dims.width)} × ${formatMm(dims.height)} × ${formatMm(dims.depth)} mm`
  const foldId = `${uid}-fold`

  return (
    <div className="overflow-hidden rounded-2xl border-[3px] border-ink bg-cream shadow-brutal">
      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* Prévia 3D */}
        <div className="relative min-h-[360px] border-b-[3px] border-ink bg-cloud lg:min-h-[520px] lg:border-b-0 lg:border-r-[3px]">
          <Badge tone="cloud" pixel className="absolute left-4 top-4 z-10">
            3D
          </Badge>
          <div className="absolute inset-0">
            {webgl ? (
              <ViewerBoundary>
                <Suspense fallback={<ViewerSkeleton />}>
                  <BoxViewer
                    structure={template.structure}
                    dims={dims}
                    fold={fold / 100}
                    color={palette[color]}
                    reducedMotion={reducedMotion}
                  />
                </Suspense>
              </ViewerBoundary>
            ) : (
              <ViewerFallback />
            )}
          </div>
          {webgl && (
            <p className="pointer-events-none absolute inset-x-4 bottom-3 text-center text-xs font-bold text-ink/70">
              Arraste para girar · role ou pince para aproximar
            </p>
          )}
        </div>

        {/* Controles */}
        <div className="flex flex-col gap-6 p-5 sm:p-6">
          <div role="group" aria-labelledby={`${uid}-structure`}>
            <p id={`${uid}-structure`} className={groupTitleClasses}>
              Estrutura
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {templates.map((item) => {
                const selected = item.id === template.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectTemplate(item.id)}
                    className={cn(
                      'rounded-xl border-[3px] border-ink p-3 text-left text-ink brutal-press-sm',
                      selected ? 'bg-pink' : 'bg-cream',
                    )}
                  >
                    <span className="block font-display text-lg leading-tight">{item.name}</span>
                    <span className="mt-1 block text-sm font-medium leading-snug">{item.description}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div role="group" aria-labelledby={`${uid}-dims`}>
            <p id={`${uid}-dims`} className={groupTitleClasses}>
              Medidas internas nominais
            </p>
            <div className="flex flex-col gap-3">
              {DIMENSIONS.map(({ key, label }) => {
                const id = `${uid}-${key}`
                const range = template.limits[key]
                return (
                  <div key={key}>
                    <div className="flex items-baseline justify-between gap-3">
                      <label htmlFor={id} className="text-sm font-bold text-ink">
                        {label}
                      </label>
                      <output htmlFor={id} className="text-sm font-bold tabular-nums text-ink">
                        {formatMm(dims[key])} mm
                      </output>
                    </div>
                    <input
                      id={id}
                      type="range"
                      min={range.min}
                      max={range.max}
                      step={range.step}
                      value={dims[key]}
                      aria-valuetext={`${formatMm(dims[key])} milímetros`}
                      onChange={(event) => setDimension(key, event.target.valueAsNumber)}
                      className={rangeClasses}
                    />
                    <div className="flex justify-between text-xs font-medium text-ink/70" aria-hidden="true">
                      <span>{formatMm(range.min)}</span>
                      <span>{formatMm(range.max)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={foldId} className="text-sm font-bold text-ink">
                Dobra
              </label>
              <output htmlFor={foldId} className="text-sm font-bold tabular-nums text-ink">
                {fold}%
              </output>
            </div>
            <input
              id={foldId}
              type="range"
              min={0}
              max={100}
              step={1}
              value={fold}
              aria-valuetext={fold === 0 ? 'planificada' : fold === 100 ? 'montada' : `${fold}% montada`}
              onChange={(event) => setFold(event.target.valueAsNumber)}
              className={rangeClasses}
            />
            <div className="mt-2 flex flex-wrap gap-3">
              <Button size="sm" variant="cream" aria-pressed={fold === 0} onClick={() => setFold(0)}>
                Planificar
              </Button>
              <Button size="sm" variant="pistachio" aria-pressed={fold === 100} onClick={() => setFold(100)}>
                Montar
              </Button>
            </div>
          </div>

          <div role="group" aria-labelledby={`${uid}-color`}>
            <p id={`${uid}-color`} className={groupTitleClasses}>
              Cor do papel
            </p>
            <div className="flex flex-wrap gap-3">
              {SWATCHES.map((swatch) => {
                const selected = swatch.token === color
                return (
                  <button
                    key={swatch.token}
                    type="button"
                    aria-pressed={selected}
                    aria-label={swatch.label}
                    title={swatch.label}
                    onClick={() => setColor(swatch.token)}
                    className={cn(
                      'h-11 w-11 rounded-full border-[3px] border-ink',
                      surfaceClass[swatch.token],
                      selected ? 'shadow-brutal-sm ring-[3px] ring-ink ring-offset-2 ring-offset-cream' : 'brutal-press-sm',
                    )}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Faca */}
      <div className="border-t-[3px] border-ink p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
          <div className="rounded-xl border-[3px] border-ink bg-butter p-3 sm:p-4">
            <DielinePreview
              dieline={dieline}
              bleed={template.bleed}
              title={`Faca planificada de ${template.name}, ${sizeText}`}
            />
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-display text-2xl leading-tight text-ink">Faca · {template.name}</h3>
              <p className="mt-1 text-sm font-medium text-ink">{sizeText} (L × A × P)</p>
            </div>

            <ul className="flex flex-col gap-2 text-sm font-bold text-ink">
              <li className="flex items-center gap-3">
                <span className="w-9 border-t-[3px] border-ink" aria-hidden="true" />
                corte
              </li>
              <li className="flex items-center gap-3">
                <span className="w-9 border-t-[3px] border-dashed border-ink" aria-hidden="true" />
                vinco
              </li>
              <li className="flex items-center gap-3">
                <span className="h-3 w-9 rounded-sm border-2 border-ink bg-pink" aria-hidden="true" />
                sangria {formatMm(template.bleed)} mm
              </li>
              <li className="flex items-center gap-3">
                <span className="w-9 border-t-2 border-dotted border-ink" aria-hidden="true" />
                segurança por painel {formatMm(dieline.safety)} mm
              </li>
            </ul>

            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-ink">
              <dt className="font-bold">Tamanho aberto</dt>
              <dd className="font-medium tabular-nums">
                {formatMm(dieline.flatWidth)} × {formatMm(dieline.flatHeight)} mm
              </dd>
              <dt className="font-bold">Material</dt>
              <dd className="font-medium">{template.material}</dd>
            </dl>

            <div>
              <Button onClick={download}>
                <Download size={20} strokeWidth={2.5} aria-hidden="true" />
                Baixar dieline (SVG)
              </Button>
              {downloadError && <p role="alert" className="mt-3 text-sm font-bold text-ink">{downloadError}</p>}
              <p className="mt-3 text-sm font-medium text-ink/80">
                SVG vetorial em milímetros, escala 1:1 ao imprimir a 100%, sem ajustar à página.
                Estudo sem compensação de espessura: valide material, folgas, cola, CMYK e arte-final
                com a gráfica. Guias de segurança por painel não substituem essa conferência.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
