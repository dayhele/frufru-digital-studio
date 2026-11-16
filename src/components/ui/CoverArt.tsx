import type { Cover, GenerativeCover } from '@/lib/cms/types'
import { cn } from '@/lib/cn'
import { palette } from '@/lib/palette'

const W = 400
const H = 300
const INK = palette.ink

function Pattern({ cover }: { cover: GenerativeCover }) {
  const accent = palette[cover.accent]

  switch (cover.pattern) {
    case 'orbit':
      return (
        <g fill="none" stroke={INK} strokeWidth={3}>
          <ellipse cx={200} cy={150} rx={170} ry={62} transform="rotate(-14 200 150)" />
          <ellipse cx={200} cy={150} rx={118} ry={40} transform="rotate(-14 200 150)" strokeDasharray="2 10" strokeLinecap="round" />
          <circle cx={200} cy={150} r={64} fill={accent} />
          <circle cx={352} cy={92} r={11} fill={accent} />
          <path d="M60 214 l7 -18 l7 18 l18 7 l-18 7 l-7 18 l-7 -18 l-18 -7 z" fill={accent} strokeLinejoin="round" />
        </g>
      )
    case 'grid':
      return (
        <g stroke={INK} strokeWidth={3}>
          {Array.from({ length: 15 }, (_, i) => {
            const col = i % 5
            const row = Math.floor(i / 5)
            return (
              <rect
                key={i}
                x={22 + col * 73}
                y={20 + row * 90}
                width={62}
                height={76}
                rx={10}
                fill={(col + row) % 2 === 0 ? accent : 'none'}
              />
            )
          })}
        </g>
      )
    case 'stripes':
      return (
        <g stroke={accent} strokeWidth={26}>
          {Array.from({ length: 9 }, (_, i) => (
            <line key={i} x1={-120 + i * 80} y1={H + 20} x2={60 + i * 80} y2={-20} />
          ))}
        </g>
      )
    case 'blobs':
      return (
        <g fill={accent} stroke={INK} strokeWidth={3}>
          <ellipse cx={104} cy={104} rx={86} ry={64} />
          <ellipse cx={300} cy={196} rx={104} ry={74} />
          <circle cx={318} cy={62} r={30} />
          <circle cx={70} cy={240} r={22} fill="none" />
        </g>
      )
    case 'checker':
      return (
        <g fill={accent}>
          {Array.from({ length: 48 }, (_, i) => {
            const col = i % 8
            const row = Math.floor(i / 8)
            return (col + row) % 2 === 0 ? <rect key={i} x={col * 50} y={row * 50} width={50} height={50} /> : null
          })}
        </g>
      )
    case 'burst':
      return (
        <g fill={accent} stroke={INK} strokeWidth={3} strokeLinejoin="round">
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M200 150 L186 -60 L214 -60 Z" transform={`rotate(${i * 30} 200 150)`} />
          ))}
        </g>
      )
  }
}

interface CoverArtProps {
  cover: Cover
  className?: string
}

/** Capa de um documento do CMS: imagem real quando existir, arte vetorial enquanto não. */
export function CoverArt({ cover, className }: CoverArtProps) {
  if (cover.kind === 'image') {
    return (
      <img
        src={cover.src}
        alt={cover.alt}
        width={cover.width}
        height={cover.height}
        loading="lazy"
        decoding="async"
        className={cn('h-full w-full object-cover', className)}
      />
    )
  }

  return (
    <svg
      role="img"
      aria-label={cover.alt}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={cn('block h-full w-full', className)}
    >
      <rect width={W} height={H} fill={palette[cover.background]} />
      <Pattern cover={cover} />
      {cover.glyph ? (
        <g>
          <circle cx={200} cy={150} r={52} fill={palette.cream} stroke={INK} strokeWidth={3} />
          <text
            x={200}
            y={152}
            textAnchor="middle"
            dominantBaseline="central"
            fill={INK}
            fontSize={cover.glyph.length > 1 ? 40 : 52}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {cover.glyph}
          </text>
        </g>
      ) : null}
    </svg>
  )
}
