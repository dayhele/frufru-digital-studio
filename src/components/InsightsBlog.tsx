import { ArrowUpRight, Clock } from 'lucide-react'
import { Link } from 'react-router'
import { getInsightPosts } from '@/lib/cms/client'
import type { InsightPost } from '@/lib/cms/types'
import { useCms } from '@/lib/cms/useCms'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { surfaceClass } from '@/lib/palette'
import { Badge } from './ui/Badge'
import { CoverArt } from './ui/CoverArt'
import { SectionHeading } from './ui/SectionHeading'

export function InsightsBlog() {
  const posts = useCms(getInsightPosts)
  const featured = posts.status === 'ready' ? (posts.data.find((p) => p.featured) ?? posts.data[0]) : undefined
  const rest = posts.status === 'ready' ? posts.data.filter((p) => p !== featured) : []

  return (
    <section
      id="insights"
      aria-labelledby="insights-title"
      className="border-t-[3px] border-ink bg-cream px-4 py-24 sm:px-6 lg:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="insights-title"
          eyebrow="03 · Insights"
          tone="butter"
          title="caderno do estúdio"
          description="Direção criativa, teoria das cores e fluxos de trabalho, com paletas que você copia e comparações que você arrasta."
        />

        {posts.status === 'error' ? (
          <p role="alert" className="mt-10 font-bold">
            Não deu para carregar os artigos agora.
          </p>
        ) : null}

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.35fr_1fr]" aria-busy={posts.status === 'loading'}>
          {featured ? <PostCard post={featured} large /> : null}
          <div className="grid gap-6">
            {rest.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function PostCard({ post, large = false }: { post: InsightPost; large?: boolean }) {
  return (
    <article
      className={cn(
        'group relative flex overflow-hidden rounded-2xl border-[3px] border-ink brutal-card-press',
        surfaceClass[post.accent],
        large ? 'flex-col' : 'flex-col sm:flex-row',
      )}
    >
      <div
        className={cn(
          'shrink-0 overflow-hidden border-ink',
          large ? 'aspect-[16/9] border-b-[3px]' : 'aspect-[16/9] border-b-[3px] sm:aspect-auto sm:w-40 sm:border-b-0 sm:border-r-[3px]',
        )}
      >
        <CoverArt cover={post.cover} className="transition-transform duration-500 group-hover:scale-[1.04]" />
      </div>
      <div className="flex flex-1 flex-col gap-3 bg-cream p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={post.accent}>{post.category}</Badge>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink/85">
            <Clock aria-hidden size={12} /> {post.readingMinutes} min · <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          </span>
        </div>
        <h3 className={cn('font-display leading-tight text-ink', large ? 'text-3xl sm:text-4xl' : 'text-xl')}>
          <Link to={`/insights/${post.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {post.title}
          </Link>
        </h3>
        {large ? <p className="text-lg leading-relaxed text-ink/85">{post.excerpt}</p> : null}
        <span aria-hidden className="mt-auto inline-flex items-center gap-1.5 text-sm font-bold text-ink">
          Ler artigo <ArrowUpRight size={16} />
        </span>
      </div>
    </article>
  )
}
