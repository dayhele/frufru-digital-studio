import mdx from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    // MDX precisa virar JSX antes do plugin do React (Fast Refresh incluso).
    { enforce: 'pre', ...mdx() },
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
    tailwindcss(),
  ],
  resolve: {
    // Lê o alias "@/..." direto do tsconfig.json.
    tsconfigPaths: true,
  },
})
