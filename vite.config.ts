import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { meta as bluestemMeta } from './src/scenarios/bluestem/meta'
import { meta as rimexMeta } from './src/scenarios/rimex/meta'
import { meta as sunsetMeta } from './src/scenarios/sunset/meta'

/**
 * Scenario selection. One scenario is compiled per build, so a prospect's
 * bundle never carries another company's data:
 *
 *   npm run dev / build / preview              bluestem (default)
 *   npm run dev:rimex / build:rimex / …        rimex  (vite --mode rimex)
 *   npm run dev:sunset / build:sunset / …      sunset (vite --mode sunset)
 *
 * VITE_SCENARIO also works, for CI. Each scenario gets its own public/ (so its
 * own favicon) and its own outDir, so both builds can sit side by side.
 */
const SCENARIOS = {
  bluestem: { meta: bluestemMeta, outDir: 'dist' },
  rimex: { meta: rimexMeta, outDir: 'dist-rimex' },
  sunset: { meta: sunsetMeta, outDir: 'dist-sunset' },
} as const
type ScenarioKey = keyof typeof SCENARIOS

function pickScenario(mode: string): ScenarioKey {
  const requested = mode in SCENARIOS ? mode : (process.env.VITE_SCENARIO ?? 'bluestem')
  if (!(requested in SCENARIOS)) {
    throw new Error(`Unknown scenario '${requested}'. Known: ${Object.keys(SCENARIOS).join(', ')}`)
  }
  return requested as ScenarioKey
}

export default defineConfig(({ mode }) => {
  const key = pickScenario(mode)
  const { meta, outDir } = SCENARIOS[key]
  const dir = (p: string) => fileURLToPath(new URL(p, import.meta.url))
  console.log(`\n  scenario: ${key}  →  ${outDir}/\n`)

  return {
    // Relative base so the built app deploys to any Pages path.
    base: './',
    plugins: [
      react(),
      {
        name: 'scenario-html',
        // 'pre' so the placeholders are gone before Vite parses the HTML's URLs.
        transformIndexHtml: {
          order: 'pre' as const,
          handler: (html: string) =>
            html
              .replace('%SCENARIO_TITLE%', meta.title)
              .replace('%SCENARIO_THEME_COLOR%', meta.themeColor)
              .replace('%SCENARIO_FAVICON_TYPE%', meta.faviconType)
              .replace('%SCENARIO_FAVICON%', meta.favicon),
        },
      },
    ],
    resolve: {
      alias: { '@scenario': dir(`./src/scenarios/${key}/index.ts`) },
    },
    publicDir: dir(`./src/scenarios/${key}/public`),
    build: { outDir, emptyOutDir: true },
  }
})
