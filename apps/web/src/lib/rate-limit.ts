/**
 * Rate limiting semplice per Route Handlers (in-memory, sliding window).
 *
 * NOTA produzione: in ambienti multi-istanza (Vercel, K8s) questo approccio
 * non garantisce limiti globali. Prima del go-live sostituire con Upstash Redis:
 *   pnpm add @upstash/ratelimit @upstash/redis
 *   usare Ratelimit.slidingWindow() con UPSTASH_REDIS_REST_URL/TOKEN
 *
 * In sviluppo e staging single-instance funziona correttamente.
 */

interface WindowEntry {
  count:     number
  resetAt:   number
}

// Map IP → sliding window entry
const store = new Map<string, WindowEntry>()

// Pulizia periodica per evitare memory leak
setInterval(
  () => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key)
    }
  },
  5 * 60 * 1000, // ogni 5 minuti
)

export interface RateLimitConfig {
  /** Numero massimo di richieste nella finestra */
  limit:     number
  /** Durata della finestra in secondi */
  windowSec: number
}

export interface RateLimitResult {
  allowed:   boolean
  remaining: number
  resetAt:   number
}

/**
 * Verifica il rate limit per un identificatore (tipicamente IP o userId).
 * Restituisce `allowed: false` se il limite è stato superato.
 */
export function checkRateLimit(
  identifier: string,
  config:     RateLimitConfig,
): RateLimitResult {
  const now     = Date.now()
  const key     = `${identifier}:${config.windowSec}`
  const entry   = store.get(key)

  if (!entry || entry.resetAt < now) {
    // Prima richiesta o finestra scaduta
    const resetAt = now + config.windowSec * 1000
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: config.limit - 1, resetAt }
  }

  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt }
}

/**
 * Estrae l'IP dalla request (compatibile con Vercel, Next.js, proxy standard).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown'
  return req.headers.get('x-real-ip') ?? 'unknown'
}

// ── Config preset per endpoint specifici ─────────────────────────────────────

/** Auth: login, registrazione — 10 tentativi/min per IP */
export const AUTH_RATE_LIMIT: RateLimitConfig = { limit: 10, windowSec: 60 }

/** Checkout Stripe — 5 sessioni/min per IP (anti-abuse checkout farming) */
export const CHECKOUT_RATE_LIMIT: RateLimitConfig = { limit: 5, windowSec: 60 }

/** API generiche protette — 60 req/min per IP */
export const API_RATE_LIMIT: RateLimitConfig = { limit: 60, windowSec: 60 }
