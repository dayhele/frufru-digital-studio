import { Menu, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { cn } from '@/lib/cn'
import { buttonClasses } from './ui/Button'

const links = [
  { to: '/#work', label: 'Trabalhos' },
  { to: '/#lab', label: 'Lab & Tools' },
  { to: '/#insights', label: 'Insights' },
  { to: '/#contact', label: 'Contato' },
] as const

export function TopNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const menuButton = useRef<HTMLButtonElement>(null)

  // Fecha o menu móvel ao navegar.
  useEffect(() => setMenuOpen(false), [location.key])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButton.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
      <nav
        aria-label="Principal"
        className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl border-[3px] border-ink bg-cream py-2 pl-3 pr-2 shadow-brutal sm:pl-4"
      >
        <Link to="/" className="flex shrink-0 items-center gap-2 rounded-lg" aria-label="Frufru Digital Studio, início">
          <img src="/brand/mascot.png" alt="" width={42} height={34} className="h-8 w-auto" />
          <img src="/brand/wordmark.png" alt="" width={1024} height={196} className="hidden h-6 w-auto sm:block" />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className="rounded-lg px-3 py-2 text-sm font-bold text-ink transition-colors hover:bg-pink"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link to="/#contact" className={buttonClasses({ variant: 'pink', size: 'sm' })}>
            <Send aria-hidden size={16} />
            <span>Orçamento</span>
          </Link>
          <button
            type="button"
            ref={menuButton}
            className="grid size-10 place-items-center rounded-lg border-2 border-ink bg-butter brutal-press-sm md:hidden"
            aria-expanded={menuOpen}
            aria-controls="menu-movel"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden size={20} /> : <Menu aria-hidden size={20} />}
          </button>
        </div>
      </nav>

      <ul
        id="menu-movel"
        hidden={!menuOpen}
        className={cn(
          'mx-auto mt-2 max-w-6xl overflow-hidden rounded-2xl border-[3px] border-ink bg-cream shadow-brutal md:hidden',
        )}
      >
        {links.map((link) => (
          <li key={link.to} className="border-b-2 border-ink last:border-b-0">
            <Link to={link.to} className="block px-5 py-3.5 font-display text-xl text-ink hover:bg-pink">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </header>
  )
}
