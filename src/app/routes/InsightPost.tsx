import { ArrowLeft, Clock } from 'lucide-react'
import type { MDXContent } from 'mdx/types'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { buttonClasses } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CoverArt } from '@/components/ui/CoverArt'
import { mdxComponents } from '@/components/mdx/mdxComponents'
import { getInsightBySlug, loadInsightBody } from '@/lib/cms/client'
import { useCms } from '@/lib/cms/useCms'
import { formatDate } from '@/lib/format'
import { NotFound } from './NotFound'

export function InsightPostPage() {
  const { slug = '' } = useParams()
  const fetchPost = useCallback(() => getInsightBySlug(slug), [slug])
  const post = useCms(fetchPost, slug)
  const [Body, setBody] = useState<{ Content: MDXContent } | null>(null)
  const [bodyFailed, setBodyFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setBody(null)
    setBodyFailed(false)
    loadInsightBody(slug).then(
      (Content) => {
        if (cancelled) return
        if (Content) setBody({ Content })
        else setBodyFailed(true)
      },
      () => {
        if (!cancelled) setBodyFailed(true)
      },
    )
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    if (post.status === 'ready' && post.data) document.title = `${post.data.title} — Frufru Digital Studio`
    return () => {
      document.title = 'Frufru Digital Studio — design fofo, mas entrega'
    }
  }, [post])

  if (post.status === 'ready' && !post.data) return <NotFound />
  if (post.status === 'error') {
    return <p role="alert" className="min-h-screen px-6 pt-36 font-bold">Não foi possível carregar o artigo. Recarregue a página ou volte aos Insights.</p>
  }
  if (post.status !== 'ready' || !post.data) {
    return <div aria-busy="true" className="min-h-screen bg-cream" />
  }

  const meta = post.data

  return (
    <article className="bg-cream px-4 pb-24 pt-32 sm:px-6">
      <header className="mx-auto max-w-3xl">
        <Link to="/#insights" className={buttonClasses({ variant: 'cream', size: 'sm' })}>
          <ArrowLeft aria-hidden size={16} /> Todos os insights
        </Link>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Badge tone={meta.accent}>{meta.category}</Badge>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink/85">
            <Clock aria-hidden size={14} /> {meta.readingMinutes} min de leitura
          </span>
        </div>
        <h1 className="mt-5 font-display text-4xl leading-[1.05] text-ink sm:text-6xl">{meta.title}</h1>
        <p className="mt-5 font-accent text-xl leading-snug text-ink sm:text-2xl">{meta.excerpt}</p>
        <p className="mt-6 text-sm font-semibold text-ink/85">
          {meta.author.name} · {meta.author.role} · <time dateTime={meta.publishedAt}>{formatDate(meta.publishedAt)}</time>
        </p>
      </header>

      <div className="mx-auto mt-10 aspect-[21/9] max-w-4xl overflow-hidden rounded-2xl border-[3px] border-ink shadow-brutal-lg">
        <CoverArt cover={meta.cover} />
      </div>

      <div className="mx-auto mt-12 max-w-[68ch]">
        {Body ? (
          <Body.Content components={mdxComponents} />
        ) : bodyFailed ? (
          <p role="alert" className="font-bold">O conteúdo deste artigo está indisponível. Recarregue a página para tentar novamente.</p>
        ) : (
          <p role="status" className="font-pixel text-[0.6rem]">
            <span className="animate-blink">CARREGANDO…</span>
          </p>
        )}
        <ul aria-label="Tags" className="mt-14 flex flex-wrap gap-2 border-t-[3px] border-ink pt-6">
          {meta.tags.map((tag) => (
            <li key={tag}>
              <Badge tone="cloud">#{tag}</Badge>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
