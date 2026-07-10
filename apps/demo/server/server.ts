import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer, type ServerResponse } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDemoApiHandler } from './demo-api.js'

const port = Number.parseInt(
  process.env.DEMO_APP_PORT ?? process.env.PORT ?? '4174',
  10,
)
const distDir = fileURLToPath(new URL('../../dist/', import.meta.url))
const indexFile = path.join(distDir, 'index.html')

const apiHandler = createDemoApiHandler({
  apiBaseUrl:
    process.env.DEMO_SERVER_API_BASE_URL ?? process.env.VITE_API_BASE_URL,
  environmentKey: process.env.VITE_ENVIRONMENT_KEY,
})

const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

function sendJsonError(res: ServerResponse, statusCode: number, message: string) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(JSON.stringify({ code: 'SERVER_ERROR', message }))
}

async function resolveStaticFile(requestPath: string): Promise<string> {
  const decodedPath = decodeURIComponent(requestPath.split('?')[0] ?? '/')
  const safeRelativePath = path.normalize(decodedPath).replace(/^([/\\])+/, '')
  const candidate = path.resolve(distDir, safeRelativePath || 'index.html')

  if (!candidate.startsWith(distDir)) {
    return indexFile
  }

  try {
    const candidateStat = await stat(candidate)

    if (candidateStat.isFile()) {
      return candidate
    }
  } catch {
    // Fall through to the SPA shell.
  }

  return indexFile
}

async function serveStaticFile(requestPath: string, res: ServerResponse) {
  const filePath = await resolveStaticFile(requestPath)
  const extension = path.extname(filePath)

  res.writeHead(200, {
    'Content-Type': contentTypes[extension] ?? 'application/octet-stream',
    'Cache-Control':
      filePath === indexFile
        ? 'no-store'
        : 'public, max-age=31536000, immutable',
  })

  createReadStream(filePath).pipe(res)
}

const server = createServer((req, res) => {
  void Promise.resolve()
    .then(async () => {
      if (await apiHandler(req, res)) {
        return
      }

      await serveStaticFile(req.url ?? '/', res)
    })
    .catch((error: unknown) => {
      if (res.headersSent) {
        res.destroy(error instanceof Error ? error : undefined)
        return
      }

      sendJsonError(
        res,
        500,
        'The demo backend encountered an unexpected error.',
      )
    })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Demo app server listening on http://0.0.0.0:${port}`)
})
