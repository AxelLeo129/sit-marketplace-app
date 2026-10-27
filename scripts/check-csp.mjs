/**
 * Verificación antes de publicar: la URL de la API de .env.production debe estar
 * permitida en la CSP de firebase.json (connect-src). Si no, la app publicada no
 * podría llamar a la API y nadie podría iniciar sesión.
 *
 * Uso: node scripts/check-csp.mjs (lo corre "npm run deploy").
 */
import { readFileSync } from 'node:fs'

function fail(message) {
  console.error(`\n✗ ${message}\n`)
  process.exit(1)
}

let env
try {
  env = readFileSync('.env.production', 'utf8')
} catch {
  fail('Falta .env.production. Cópialo de .env.production.example y pon la URL real de la API.')
}

const apiUrl = env.match(/^VITE_API_URL=(.+)$/m)?.[1]?.trim()
if (!apiUrl) fail('.env.production no tiene VITE_API_URL.')

const { origin, protocol } = new URL(apiUrl)
if (protocol !== 'https:') fail(`La API en producción debe usar HTTPS: ${apiUrl}`)

const headers = JSON.parse(readFileSync('firebase.json', 'utf8')).hosting.headers
const csp = headers
  .flatMap((rule) => rule.headers)
  .find((header) => header.key === 'Content-Security-Policy')?.value

const connectSrc = csp?.match(/connect-src ([^;]+)/)?.[1].split(/\s+/) ?? []
if (!connectSrc.includes(origin)) {
  fail(
    `La CSP de firebase.json no permite la API (${origin}).\n` +
      `  Cambia "https://api.example.com" en connect-src por ${origin}.`,
  )
}

console.log(`✓ CSP permite la API: ${origin}`)
