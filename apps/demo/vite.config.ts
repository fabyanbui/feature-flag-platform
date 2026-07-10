import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createDemoApiHandler } from './server/demo-api.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const demoApiHandler = createDemoApiHandler({
    apiBaseUrl: env.DEMO_SERVER_API_BASE_URL ?? env.VITE_API_BASE_URL,
    environmentKey: env.VITE_ENVIRONMENT_KEY,
  })

  return {
    plugins: [
      react(),
      {
        name: 'demo-backend-api',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            void demoApiHandler(req, res)
              .then((handled) => {
                if (!handled) {
                  next()
                }
              })
              .catch(next)
          })
        },
      },
    ],
  }
})
