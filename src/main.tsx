import '@fontsource-variable/plus-jakarta-sans/wght.css'
import '@fontsource/tilt-warp/400.css'
import '@fontsource/press-start-2p/400.css'
import '@fontsource/croissant-one/400.css'
import './app/globals.css'

import { LucideProvider } from 'lucide-react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import { RootLayout } from './app/layout'
import { Home } from './app/routes/Home'
import { InsightPostPage } from './app/routes/InsightPost'
import { NotFound } from './app/routes/NotFound'

const root = document.getElementById('root')
if (!root) throw new Error('Elemento #root ausente em index.html')

createRoot(root).render(
  <StrictMode>
    {/* Traço grosso em todos os ícones, no mesmo peso das bordas neobrutalistas. */}
    <LucideProvider strokeWidth={2.5}>
      <BrowserRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<Home />} />
            <Route path="insights/:slug" element={<InsightPostPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LucideProvider>
  </StrictMode>,
)
