import { Bell, Download, FileArchive, Layers, Package, Printer, Ruler, Sparkles } from 'lucide-react'
import { lazy, Suspense, useRef, useState } from 'react'
import { useNearViewport } from '@/hooks/useNearViewport'
import { getPackagingTemplates, getPsdMockups } from '@/lib/cms/client'
import type { MockupCategory, PsdMockup } from '@/lib/cms/types'
import { useCms } from '@/lib/cms/useCms'
import { cn } from '@/lib/cn'
import { Badge } from './ui/Badge'
import { buttonClasses } from './ui/Button'
import { CoverArt } from './ui/CoverArt'
import { SectionHeading } from './ui/SectionHeading'

// A ferramenta 3D só é baixada quando a seção se aproxima da tela.
const PackagingStudio = lazy(() => import('./lab/PackagingStudio'))

const categoryLabel: Record<MockupCategory, string> = {
  embalagem: 'Embalagem',
  papelaria: 'Papelaria',
  impresso: 'Impresso',
  bebida: 'Bebida',
}

const numberFormat = new Intl.NumberFormat('pt-BR')

export function DesignLab() {
  return (
    <section
      id="lab"
      aria-labelledby="lab-title"
      className="border-t-[3px] border-ink bg-cloud px-4 py-24 sm:px-6 lg:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="lab-title"
          eyebrow="02 · Lab & Tools"
          tone="cloud"
          title="recursos para quem também desenha"
          description="Duas prateleiras, cada uma com um propósito: mockups PSD prontos para apresentar e um estúdio de embalagens para montar a caixa e baixar a faca."
        />

        <nav aria-label="Áreas do Lab" className="mt-8 flex flex-wrap gap-3">
          <a href="#lab-mockups" className={buttonClasses({ variant: 'cream', size: 'sm' })}>
            <Layers aria-hidden size={16} /> A · Mockups PSD
          </a>
          <a href="#lab-packaging" className={buttonClasses({ variant: 'cream', size: 'sm' })}>
            <Package aria-hidden size={16} /> B · Packaging Studio
          </a>
        </nav>

        <MockupGallery />
        <PackagingShelf />
      </div>
    </section>
  )
}

/* ───────────────────────── A · Mockups PSD ───────────────────────── */

function MockupGallery() {
  const mockups = useCms(getPsdMockups)
  const [category, setCategory] = useState<MockupCategory | 'todos'>('todos')

  const categories =
    mockups.status === 'ready' ? Array.from(new Set(mockups.data.map((m) => m.category))) : []
  const visible =
    mockups.status === 'ready'
      ? mockups.data.filter((m) => category === 'todos' || m.category === category)
      : []

  return (
    <div id="lab-mockups" aria-labelledby="lab-mockups-title" role="region" className="mt-16 scroll-mt-28">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-ink pb-4">
        <div>
          <p className="font-pixel text-[0.6rem] text-ink">PRATELEIRA A</p>
          <h3 id="lab-mockups-title" className="mt-2 font-display text-3xl text-ink sm:text-4xl">
            Galeria de mockups PSD
          </h3>
          <p className="mt-2 max-w-xl text-ink/85">
            Prévia demonstrativa de packs em preparação. Capas e especificações são ilustrativas; os arquivos PSD/ZIP ainda não foram publicados.
          </p>
        </div>
        <div role="group" aria-label="Filtrar mockups por categoria" className="flex flex-wrap gap-2">
          {(['todos', ...categories] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
              className={cn(
                'rounded-lg border-2 border-ink px-3 py-1.5 text-sm font-bold brutal-press-sm',
                category === value ? 'on-dark bg-ink text-cream' : 'bg-cream text-ink',
              )}
            >
              {value === 'todos' ? 'Todos' : categoryLabel[value]}
            </button>
          ))}
        </div>
      </div>

      {mockups.status === 'error' ? (
        <p role="alert" className="mt-8 font-bold">
          Não deu para carregar os mockups agora.
        </p>
      ) : null}

      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy={mockups.status === 'loading'}>
        {visible.map((mockup) => (
          <li key={mockup.id}>
            <MockupCard mockup={mockup} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function MockupCard({ mockup }: { mockup: PsdMockup }) {
  const titleId = `mockup-${mockup.slug}`
  const { width, height } = mockup.dimensions

  return (
    <article
      aria-labelledby={titleId}
      className="flex h-full flex-col overflow-hidden rounded-2xl border-[3px] border-ink bg-cream shadow-brutal"
    >
      <div className="relative aspect-[4/3] border-b-[3px] border-ink">
        <CoverArt cover={mockup.cover} />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge tone="cream">{categoryLabel[mockup.category]}</Badge>
          {mockup.isNew ? (
            <Badge tone="pink" pixel>
              <Sparkles aria-hidden size={10} /> NOVO
            </Badge>
          ) : null}
        </div>
        <Badge tone="pistachio" pixel className="absolute bottom-3 right-3">
          PSD
        </Badge>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h4 id={titleId} className="font-display text-xl leading-tight text-ink">
          {mockup.title}
        </h4>
        <p className="mt-2 text-sm leading-relaxed text-ink/85">{mockup.description}</p>

        <ul aria-label="Especificações do arquivo" className="mt-4 flex flex-wrap gap-2">
          <li>
            <Badge tone="pistachio">
              <Layers aria-hidden size={12} /> {mockup.smartObjectLayers} smart objects
            </Badge>
          </li>
          <li>
            <Badge tone="pistachio">
              <Printer aria-hidden size={12} /> {mockup.dpi} dpi · impressão
            </Badge>
          </li>
          <li>
            <Badge tone="cloud">
              <Ruler aria-hidden size={12} /> {numberFormat.format(width)}×{numberFormat.format(height)} px
            </Badge>
          </li>
          <li>
            <Badge tone="butter">
              <FileArchive aria-hidden size={12} /> ZIP · {mockup.fileSizeMb} MB
            </Badge>
          </li>
        </ul>

        <p className="mt-4 text-xs font-semibold text-ink/85">Licença: {mockup.license}</p>

        <div className="mt-auto pt-5">
          {mockup.download.status === 'available' ? (
            <a
              href={mockup.download.url}
              download
              className={buttonClasses({ variant: 'pistachio', className: 'w-full' })}
              aria-label={`Baixar ZIP do mockup ${mockup.title}`}
            >
              <Download aria-hidden size={18} /> Baixar ZIP
            </a>
          ) : (
            <a
              href="#newsletter"
              className={buttonClasses({ variant: 'butter', className: 'w-full' })}
              aria-label={`Avise-me quando o mockup ${mockup.title} for publicado`}
            >
              <Bell aria-hidden size={18} /> Em breve · me avise
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

/* ───────────────────────── B · Packaging Studio ───────────────────────── */

function PackagingShelf() {
  const ref = useRef<HTMLDivElement>(null)
  const near = useNearViewport(ref)
  const templates = useCms(getPackagingTemplates)

  return (
    <div
      ref={ref}
      id="lab-packaging"
      role="region"
      aria-labelledby="lab-packaging-title"
      className="mt-24 scroll-mt-28"
    >
      <div className="border-b-[3px] border-ink pb-4">
        <p className="font-pixel text-[0.6rem] text-ink">PRATELEIRA B</p>
        <h3 id="lab-packaging-title" className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          Packaging Studio
        </h3>
        <p className="mt-2 max-w-2xl text-ink/85">
          Escolha a estrutura, ajuste as medidas, dobre a caixa em 3D e baixe a faca (dieline) em SVG, pronta para editar
          ou mandar para a gráfica.
        </p>
      </div>

      <div className="mt-8">
        {near && templates.status === 'ready' ? (
          <Suspense fallback={<StudioSkeleton />}>
            <PackagingStudio templates={templates.data} />
          </Suspense>
        ) : templates.status === 'error' ? (
          <p role="alert" className="font-bold">Não foi possível carregar as estruturas. Recarregue a página para tentar novamente.</p>
        ) : (
          <StudioSkeleton />
        )}
      </div>
    </div>
  )
}

function StudioSkeleton() {
  return (
    <div
      role="status"
      className="grid min-h-[28rem] place-items-center rounded-2xl border-[3px] border-ink bg-cream shadow-brutal"
    >
      <span className="font-pixel text-[0.6rem] text-ink">
        <span className="animate-blink">CARREGANDO ESTÚDIO…</span>
      </span>
    </div>
  )
}
