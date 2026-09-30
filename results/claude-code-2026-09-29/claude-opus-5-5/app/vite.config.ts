/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Fonts are only requested once text using them renders, which for a
 * client-rendered page is after the JS runs. Preloading the two faces the
 * clock and headings use (Latin subsets) starts them with the HTML instead,
 * so the digits don't swap typefaces mid-intro.
 */
function preloadCriticalFonts(): Plugin {
  const critical = [/cinzel-latin-wght-normal-.*\.woff2$/, /eb-garamond-latin-wght-normal-.*\.woff2$/]
  let base = '/'
  return {
    name: 'preload-critical-fonts',
    apply: 'build',
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml: {
      order: 'post',
      handler(_html, { bundle }) {
        const files = Object.keys(bundle ?? {})
        return critical.flatMap((pattern) => {
          const file = files.find((name) => pattern.test(name))
          if (!file) throw new Error(`preload-critical-fonts: no asset matches ${pattern}`)
          return {
            tag: 'link',
            attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `${base}${file}`, crossorigin: '' },
            injectTo: 'head' as const,
          }
        })
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), preloadCriticalFonts()],
  test: {
    // Unit tests live next to the code; e2e/ belongs to Playwright.
    include: ['src/**/*.test.ts'],
  },
})
