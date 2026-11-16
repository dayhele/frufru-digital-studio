import type { MDXComponents } from 'mdx/types'
import { BeforeAfter, ContrastSample } from './BeforeAfter'
import { ColorPalette } from './ColorPalette'

/** Tipografia dos artigos e componentes interativos disponíveis no MDX sem import. */
export const mdxComponents: MDXComponents = {
  h2: (props) => <h2 className="mt-12 font-display text-3xl leading-tight text-ink sm:text-4xl" {...props} />,
  h3: (props) => <h3 className="mt-8 font-display text-2xl text-ink" {...props} />,
  p: (props) => <p className="mt-5 text-lg leading-[1.75] text-ink" {...props} />,
  ul: (props) => <ul className="mt-5 list-disc space-y-2 pl-6 text-lg leading-relaxed text-ink marker:text-ink" {...props} />,
  ol: (props) => <ol className="mt-5 list-decimal space-y-2 pl-6 text-lg leading-relaxed text-ink marker:font-bold" {...props} />,
  a: (props) => <a className="font-bold underline decoration-pink decoration-4 underline-offset-4 hover:bg-pink" {...props} />,
  strong: (props) => <strong className="font-extrabold" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="my-10 rounded-2xl border-[3px] border-ink bg-butter p-6 font-accent text-2xl leading-snug text-ink shadow-brutal [&_p]:mt-0 [&_p]:font-accent [&_p]:text-2xl"
      {...props}
    />
  ),
  code: (props) => <code className="rounded border-2 border-ink bg-cloud px-1.5 py-0.5 font-mono text-[0.9em]" {...props} />,
  hr: () => <hr className="my-12 border-t-[3px] border-dashed border-ink" />,
  ColorPalette,
  BeforeAfter,
  ContrastSample,
}
