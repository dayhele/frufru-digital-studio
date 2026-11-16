import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { buttonClasses } from '@/components/ui/Button'

export function NotFound() {
  return (
    <section className="paper-dots grid min-h-[80vh] place-items-center px-4 pb-20 pt-36">
      <div className="max-w-lg rounded-2xl border-[3px] border-ink bg-butter p-8 text-center shadow-brutal-lg">
        <p className="font-pixel text-sm text-ink">ERRO 404</p>
        <h1 className="mt-4 font-display text-4xl text-ink">essa fase não existe</h1>
        <p className="mt-3 text-lg text-ink/85">O gato procurou pela galáxia inteira e não achou esta página.</p>
        <Link to="/" className={buttonClasses({ variant: 'pink', className: 'mt-6' })}>
          <ArrowLeft aria-hidden size={18} /> Voltar ao início
        </Link>
      </div>
    </section>
  )
}
