import { lazy, Suspense, useState } from 'react'
import { DesignLab } from '@/components/DesignLab'
import { HeroSection } from '@/components/HeroSection'
import { InsightsBlog } from '@/components/InsightsBlog'
import { PortfolioBento } from '@/components/PortfolioBento'

// O jogo só é baixado quando alguém aperta PLAY pela primeira vez.
const ArcadeMinigame = lazy(() => import('@/components/ArcadeMinigame'))

export function Home() {
  const [gameOpen, setGameOpen] = useState(false)
  const [gameRequested, setGameRequested] = useState(false)

  const openGame = () => {
    setGameRequested(true)
    setGameOpen(true)
  }

  return (
    <>
      <HeroSection onPlay={openGame} />
      <PortfolioBento />
      <DesignLab />
      <InsightsBlog />
      {gameRequested ? (
        <Suspense fallback={<GameLoading />}>
          <ArcadeMinigame open={gameOpen} onExit={() => setGameOpen(false)} />
        </Suspense>
      ) : null}
    </>
  )
}

function GameLoading() {
  return (
    <div
      role="status"
      className="on-dark fixed inset-0 z-50 grid place-items-center bg-ink/90 font-pixel text-xs text-butter"
    >
      <span className="animate-blink">INSERT COIN…</span>
    </div>
  )
}
