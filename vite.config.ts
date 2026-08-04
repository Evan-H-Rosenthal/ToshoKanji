import { defineConfig } from 'vite'
import fs from 'fs'
import crypto from 'crypto'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const VALID_LEARNING_CATEGORIES = new Set([
  'Nature',
  'PeopleSociety',
  'PlacesBuildings',
  'ActionsMovements',
  'AbstractConcepts',
  'NumbersTime',
  'ObjectsMaterials',
  'FoodLiving',
  'LanguageCommunication',
  'BodyHealth',
  'Colors',
  'PositionMeasurement',
  'EmotionsFeelings',
  'MindKnowledge',
  'QualitiesStates',
  'Misc',
])

const WORKBOX_PRECACHE_LIMIT_BYTES = 50 * 1024 * 1024

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

function kanjiCategoryWriter() {
  const categoryFile = path.resolve(__dirname, 'data/curated/learning-categories.json')
  const milestoneFile = path.resolve(__dirname, 'data/curated/kanji-milestone.json')
  const sourceManifestFile = path.resolve(__dirname, 'public/data/source-manifest.json')

  return {
    name: 'kanji-category-writer',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__tosho-kanji/category', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        let body = ''
        req.setEncoding('utf8')
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', () => {
          try {
            const payload = JSON.parse(body || '{}') as { kanjiId?: string; learningCategory?: string }
            const { kanjiId, learningCategory } = payload

            if (!kanjiId || !learningCategory || !VALID_LEARNING_CATEGORIES.has(learningCategory)) {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false, error: 'Invalid kanji id or category' }))
              return
            }

            const character = kanjiId.startsWith('k-') ? kanjiId.slice(2) : ''
            const milestone = JSON.parse(fs.readFileSync(milestoneFile, 'utf8')) as { kanji?: string[] }
            if (!character || !milestone.kanji?.includes(character)) {
              res.statusCode = 404
              res.end(JSON.stringify({ ok: false, error: 'Kanji not found' }))
              return
            }

            const categories = JSON.parse(fs.readFileSync(categoryFile, 'utf8')) as { categories?: Record<string, string> }
            if (!categories.categories) throw new Error('Category file has no categories map')
            categories.categories[character] = learningCategory
            const temporaryFile = `${categoryFile}.tmp`
            fs.writeFileSync(temporaryFile, `${JSON.stringify(categories, null, 2)}\n`, 'utf8')
            fs.renameSync(temporaryFile, categoryFile)

            if (fs.existsSync(sourceManifestFile)) {
              const sourceManifest = JSON.parse(fs.readFileSync(sourceManifestFile, 'utf8')) as {
                curatedInputs?: { learningCategories?: { sha256?: string } }
              }
              const digest = crypto.createHash('sha256').update(fs.readFileSync(categoryFile)).digest('hex')
              if (sourceManifest.curatedInputs?.learningCategories) {
                sourceManifest.curatedInputs.learningCategories.sha256 = digest
                const temporaryManifest = `${sourceManifestFile}.tmp`
                fs.writeFileSync(temporaryManifest, `${JSON.stringify(sourceManifest, null, 2)}\n`, 'utf8')
                fs.renameSync(temporaryManifest, sourceManifestFile)
              }
            }

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, kanjiId, learningCategory }))
          } catch (error) {
            res.statusCode = 500
            res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    kanjiCategoryWriter(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used - do not remove them.
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'ToshoKanji',
        short_name: 'ToshoKanji',
        description: 'Collect kanji and radicals through a gacha-inspired Japanese learning app.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#050411',
        theme_color: '#ff3d71',
        icons: [
          {
            src: '/icons/toshokanji-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icons/toshokanji-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/toshokanji-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/toshokanji-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,woff,woff2,png,svg}'],
        maximumFileSizeToCacheInBytes: WORKBOX_PRECACHE_LIMIT_BYTES,
        runtimeCaching: [
          {
            urlPattern: /\/data\/words\/manifest\.json$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'word-data-manifest',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 2, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /\/data\/words\/part-\d+\.json(?:\?.*)?$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'word-data-shards',
              expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory.
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/')
          if (normalizedId.endsWith('/kanji.generated.ts')) return 'kanji-data'
          if (normalizedId.endsWith('/components.generated.ts')) return 'component-data'
          if (normalizedId.endsWith('/radicals.generated.ts')) return 'radical-data'
        },
      },
    },
  },
})
