import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { FooterConnect } from '@/components/FooterConnect'
import { TopNav } from '@/components/TopNav'

/** Rola até a âncora da URL (ou ao topo) a cada navegação. */
function useHashScroll() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0 })
      return
    }
    let id: string
    try {
      id = decodeURIComponent(hash.slice(1))
    } catch {
      return
    }
    let active = true
    let focused = false
    let height = document.body.scrollHeight
    const align = (correcting: boolean) => {
      if (!active) return
      const target = document.getElementById(id)
      if (!target) return
      target.scrollIntoView({ behavior: correcting ? 'instant' : 'auto' })
      if (!focused) {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
        target.focus({ preventScroll: true })
        focused = true
      }
    }
    // O conteúdo lazy acima da âncora pode crescer depois da primeira rolagem.
    // Mantém a intenção da navegação, mas nunca disputa com a ação do visitante.
    const observer = new ResizeObserver(() => {
      const nextHeight = document.body.scrollHeight
      if (nextHeight === height && focused) return
      height = nextHeight
      align(true)
    })
    const stop = () => {
      active = false
      observer.disconnect()
    }
    observer.observe(document.body)
    const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const
    for (const event of inputs) window.addEventListener(event, stop, { passive: true })
    const frame = requestAnimationFrame(() => align(false))
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      for (const event of inputs) window.removeEventListener(event, stop)
    }
  }, [pathname, hash])
}

export function RootLayout() {
  useHashScroll()

  return (
    <>
      <a
        href="#conteudo"
        className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-xl border-[3px] border-ink bg-butter px-4 py-2 font-bold text-ink shadow-brutal focus:translate-y-0"
      >
        Pular para o conteúdo
      </a>
      <TopNav />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <FooterConnect />
    </>
  )
}
