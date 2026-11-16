import { ArrowUpRight, Quote, X } from 'lucide-react'
import { useState } from 'react'
import { getProjects } from '@/lib/cms/client'
import type { BentoSize, Discipline, Project } from '@/lib/cms/types'
import { useCms } from '@/lib/cms/useCms'
import { cn } from '@/lib/cn'
import { surfaceClass } from '@/lib/palette'
import { scrollToSection } from '@/lib/scrollToSection'
import { Badge } from './ui/Badge'
import { Button, buttonClasses } from './ui/Button'
import { CoverArt } from './ui/CoverArt'
import { Modal } from './ui/Modal'
import { SectionHeading } from './ui/SectionHeading'

/** Células do bento: a grade tem 4 colunas no desktop e 2 no tablet. */
const bentoCell: Record<BentoSize, string> = {
  hero: 'sm:col-span-2 lg:col-span-2 lg:row-span-2',
  tall: 'lg:row-span-2',
  wide: 'sm:col-span-2',
  standard: '',
}

const disciplineLabel: Record<Discipline, string> = {
  identidade: 'Identidade',
  embalagem: 'Embalagem',
  editorial: 'Editorial',
  digital: 'Digital',
}

const filters: Array<{ value: Discipline | 'todos'; label: string }> = [
  { value: 'todos', label: 'Tudo' },
  { value: 'identidade', label: 'Identidade' },
  { value: 'embalagem', label: 'Embalagem' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'digital', label: 'Digital' },
]

export function PortfolioBento() {
  const projects = useCms(getProjects)
  const [filter, setFilter] = useState<Discipline | 'todos'>('todos')
  const [active, setActive] = useState<Project | null>(null)

  const visible =
    projects.status === 'ready'
      ? projects.data.filter((p) => filter === 'todos' || p.disciplines.includes(filter))
      : []

  return (
    <section
      id="work"
      aria-labelledby="work-title"
      className="paper-dots relative border-t-[3px] border-ink bg-cream px-4 py-24 sm:px-6 lg:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            id="work-title"
            eyebrow="01 · Trabalhos"
            tone="pink"
            title="marcas que não pedem licença"
            description="Cases conceituais para explorar identidades, embalagens e editoriais. Clientes, métricas e depoimentos abaixo são fictícios; não representam trabalhos comerciais comprovados."
          />
          <div role="group" aria-label="Filtrar por disciplina" className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'rounded-lg border-2 border-ink px-3 py-1.5 text-sm font-bold brutal-press-sm',
                  filter === f.value ? 'on-dark bg-ink text-cream' : 'bg-cream text-ink',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {projects.status === 'loading' ? (
          <div aria-busy="true" className="mt-12 grid auto-rows-[15rem] gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="rounded-2xl border-[3px] border-ink/30 bg-cloud/50" />
            ))}
          </div>
        ) : null}

        {projects.status === 'error' ? (
          <p role="alert" className="mt-12 font-bold">
            Não deu para carregar os trabalhos agora. Tente recarregar a página.
          </p>
        ) : null}

        {projects.status === 'ready' ? (
          <ul className="mt-12 grid grid-flow-row-dense auto-rows-[15rem] gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((project) => (
              <li key={project.id} className={bentoCell[filter === 'todos' ? project.bentoSize : 'standard']}>
                <ProjectCard project={project} onOpen={() => setActive(project)} />
              </li>
            ))}
            <li className={filter === 'todos' ? 'sm:col-span-2' : ''}>
              <a
                href="#contact"
                className="on-dark flex h-full flex-col justify-between rounded-2xl border-[3px] border-ink bg-ink p-6 text-cream brutal-card-press"
              >
                <span className="font-pixel text-[0.6rem] text-butter">PRÓXIMA FASE</span>
                <span className="font-display text-3xl leading-tight">a sua marca pode ser o próximo case.</span>
                <span className="inline-flex items-center gap-2 font-bold text-pink">
                  Contar meu projeto <ArrowUpRight aria-hidden size={18} />
                </span>
              </a>
            </li>
          </ul>
        ) : null}
      </div>

      <Modal open={active !== null} onClose={() => setActive(null)} labelledBy="case-title">
        {active ? <CaseStudy project={active} onClose={() => setActive(null)} /> : null}
      </Modal>
    </section>
  )
}

function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const isHero = project.bentoSize === 'hero'

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border-[3px] border-ink brutal-card-press',
        surfaceClass[project.accent],
      )}
    >
      <div className="relative min-h-0 flex-1 overflow-hidden border-b-[3px] border-ink">
        <CoverArt
          cover={project.cover}
          className="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {project.disciplines.map((d) => (
            <Badge key={d} tone="cream">
              {disciplineLabel[d]}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex items-end justify-between gap-3 bg-cream p-4">
        <div>
          <h3 className={cn('font-display leading-tight text-ink', isHero ? 'text-3xl' : 'text-xl')}>
            {/* O botão estica sobre o cartão inteiro: um alvo grande, um único tab stop. */}
            <button
              type="button"
              onClick={onOpen}
              className="text-left after:absolute after:inset-0 after:content-['']"
              aria-haspopup="dialog"
            >
              {project.title}
            </button>
          </h3>
          {isHero || project.bentoSize === 'wide' ? (
            <p className="mt-1 text-sm text-ink/85">{project.summary}</p>
          ) : null}
        </div>
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-lg border-2 border-ink bg-pink shadow-brutal-sm"
        >
          <ArrowUpRight size={18} />
        </span>
      </div>
    </article>
  )
}

function CaseStudy({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <article className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl border-[3px] border-ink bg-cream shadow-brutal-lg">
      <p className="border-b-2 border-ink bg-butter px-5 py-3 text-sm font-bold">Case demonstrativo · cliente, métricas e depoimento fictícios.</p>
      <header
        className={cn(
          'flex items-center justify-between gap-4 border-b-[3px] border-ink px-5 py-3',
          surfaceClass[project.accent],
        )}
      >
        <p className="font-pixel text-[0.6rem] text-ink">
          CASE · {project.client.toUpperCase()} · {project.year}
        </p>
        <Button size="sm" variant="cream" onClick={onClose} aria-label="Fechar case">
          <X aria-hidden size={16} />
        </Button>
      </header>

      <div className="overflow-y-auto">
        <div className="aspect-[16/7] border-b-[3px] border-ink">
          <CoverArt cover={project.cover} />
        </div>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 id="case-title" className="font-display text-4xl leading-tight text-ink sm:text-5xl">
              {project.title}
            </h2>
            <p className="mt-3 font-accent text-xl text-ink">{project.summary}</p>

            <h3 className="mt-8 font-pixel text-[0.6rem] text-ink">O DESAFIO</h3>
            <p className="mt-2 leading-relaxed text-ink">{project.challenge}</p>
            <h3 className="mt-6 font-pixel text-[0.6rem] text-ink">A SOLUÇÃO</h3>
            <p className="mt-2 leading-relaxed text-ink">{project.solution}</p>

            {project.testimonial ? (
              <figure className="mt-8 rounded-2xl border-[3px] border-ink bg-butter p-5 shadow-brutal">
                <Quote aria-hidden size={22} />
                <blockquote className="mt-2 font-accent text-xl leading-snug text-ink">
                  {project.testimonial.quote}
                </blockquote>
                <figcaption className="mt-3 text-sm font-bold text-ink">
                  {project.testimonial.author} · <span className="font-medium">{project.testimonial.role}</span>
                </figcaption>
              </figure>
            ) : null}
          </div>

          <aside className="space-y-6">
            <dl className="grid grid-cols-2 gap-3">
              {project.metrics.map((m) => (
                <div key={m.label} className="rounded-xl border-[3px] border-ink bg-cloud p-3 shadow-brutal-sm">
                  <dt className="text-xs font-bold text-ink/85">{m.label}</dt>
                  <dd className="font-display text-3xl text-ink">{m.value}</dd>
                </div>
              ))}
            </dl>

            <div>
              <h3 className="font-pixel text-[0.6rem] text-ink">ENTREGAS</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {project.deliverables.map((d) => (
                  <li key={d}>
                    <Badge tone="pistachio">{d}</Badge>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-pixel text-[0.6rem] text-ink">PALETA</h3>
              <ul className="mt-3 grid grid-cols-2 gap-2">
                {project.palette.map((swatch) => (
                  <li key={swatch.hex} className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="size-8 shrink-0 rounded-md border-2 border-ink"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <span className="text-sm">
                      <span className="block font-bold">{swatch.name}</span>
                      <span className="font-mono text-xs">{swatch.hex}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {project.gallery.map((cover, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-xl border-[3px] border-ink">
                  <CoverArt cover={cover} />
                </div>
              ))}
            </div>

            <a
              href="#contact"
              onClick={(event) => {
                event.preventDefault()
                onClose()
                scrollToSection('contact')
              }}
              className={buttonClasses({ variant: 'pink', className: 'w-full' })}>
              Quero um projeto assim <ArrowUpRight aria-hidden size={18} />
            </a>
          </aside>
        </div>
      </div>
    </article>
  )
}
