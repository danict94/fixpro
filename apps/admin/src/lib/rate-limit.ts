/**
 * Rate limiting per Route Handlers admin.
 *
 * Produzione:
 * - usa Upstash Redis se UPSTASH_REDIS_URL e UPSTASH_REDIS_TOKEN sono configurati.
 *
 * Fallback:
 * - usa in-memory solo per sviluppo/local.
 * - non è production-safe in ambienti multi-istanza/serverless.
 */

import { Redis } from '@upstash/redis'

interface WindowEntry {
  count: number
  resetAt: number
}

const store = new Map<string, WindowEntry>()

const redisUrl = process.env.UPSTASH_REDIS_URL
const redisToken = process.env.UPSTASH_REDIS_TOKEN

const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null

let warnedAboutMemoryFallback = false

function warnMemoryFallbackOnce() {
  if (process.env.NODE_ENV !== 'production') return
  if (warnedAboutMemoryFallback) return

  warnedAboutMemoryFallback = true
  console.warn(
    '[rate-limit] Production without Redis! Requests across instances will not be rate-limited.',
  )
}

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  limit: number
  windowSec: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

async function checkRedisRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  if (!redis) {
    throw new Error('[rate-limit] Redis client is not configured')
  }

  const now = Date.now()
  const windowMs = config.windowSec * 1000
  const windowStart = now - windowMs
  const key = `rate-limit:${identifier}:${config.windowSec}`
  const member = `${now}:${crypto.randomUUID()}`

  const results = await redis
    .pipeline()
    .zremrangebyscore(key, 0, windowStart)
    .zadd(key, { score: now, member })
    .zcard(key)
    .expire(key, config.windowSec)
    .exec()

  const count = Number(results[2] ?? 0)

  if (count > config.limit) {
    await redis.zrem(key, member)

    return {
      allowed: false,
      remaining: 0,
      resetAt: now + windowMs,
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, config.limit - count),
    resetAt: now + windowMs,
  }
}

function checkMemoryRateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  warnMemoryFallbackOnce()

  const now = Date.now()
  const key = `${identifier}:${config.windowSec}`
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowSec * 1000
    store.set(key, { count: 1, resetAt })

    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt,
    }
  }

  if (entry.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  entry.count += 1

  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  }
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  if (redis) {
    try {
      return await checkRedisRateLimit(identifier, config)
    } catch (error) {
      console.error('[rate-limit] Redis check failed, falling back to memory:', error)
      return checkMemoryRateLimit(identifier, config)
    }
  }

  return checkMemoryRateLimit(identifier, config)
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown'

  return req.headers.get('x-real-ip') ?? 'unknown'
}

/** 3 richieste / 10 minuti per IP — public forgot-password endpoint */
export const RESET_REQUEST_RATE_LIMIT: RateLimitConfig = {
  limit: 3,
  windowSec: 600,
}