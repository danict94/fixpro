/**
 * Rate limit for tRPC endpoints — Redis-based (production) with in-memory fallback (dev).
 * - Production: uses Upstash Redis (UPSTASH_REDIS_URL env var)
 * - Dev: falls back to in-memory Map if Redis unavailable
 * - Timeout: 500ms max for Redis calls to avoid blocking requests
 */

import { Redis } from '@upstash/redis'

interface WindowEntry {
  count: number
  resetAt: number
}

let redisClient: Redis | null = null
const fallbackStore = new Map<string, WindowEntry>()
let useRedis = false

// Initialize Redis client if URL provided
if (process.env.UPSTASH_REDIS_URL) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN || '',
    })
    useRedis = true
    console.log('[rate-limit] Using Upstash Redis for rate limiting')
  } catch (err) {
    console.warn('[rate-limit] Failed to initialize Redis, falling back to in-memory:', err)
    useRedis = false
  }
}

if (!useRedis && process.env.NODE_ENV === 'production') {
  console.warn('[rate-limit] ⚠️ Production without Redis! Requests across instances will not be rate-limited.')
}

// Cleanup in-memory store every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of fallbackStore) {
    if (entry.resetAt < now) fallbackStore.delete(key)
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  limit: number
  windowSec: number
}

export async function checkRateLimit(identifier: string, config: RateLimitConfig): Promise<boolean> {
  const now = Date.now()
  const key = `ratelimit:${identifier}:${config.windowSec}`

  if (useRedis && redisClient) {
    try {
      const result = await Promise.race([
        (async () => {
          const data = await redisClient!.get<number>(key)
          const count = (data ?? 0) as number

          if (count >= config.limit) {
            return false
          }

          await redisClient!.incr(key)
          if (count === 0) {
            await redisClient!.expire(key, config.windowSec)
          }
          return true
        })(),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 500)),
      ])
      return result
    } catch (err) {
      console.error('[rate-limit] Redis error, falling back to in-memory:', err)
      useRedis = false
    }
  }

  // Fallback: in-memory store (single-instance only)
  const entry = fallbackStore.get(key)

  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowSec * 1000
    fallbackStore.set(key, { count: 1, resetAt })
    return true
  }

  if (entry.count >= config.limit) {
    return false
  }

  entry.count++
  return true
}

// Rate limit configs
export const CREATE_REQUEST_LIMIT: RateLimitConfig = { limit: 10, windowSec: 3600 } // 10 per hour
export const UPLOAD_LIMIT: RateLimitConfig = { limit: 20, windowSec: 3600 } // 20 per hour
export const PURCHASE_LIMIT: RateLimitConfig = { limit: 50, windowSec: 3600 } // 50 per hour
export const RESEND_EMAIL_LIMIT: RateLimitConfig = { limit: 3, windowSec: 3600 } // 3 per hour
export const ADMIN_LOGIN_LIMIT: RateLimitConfig = { limit: 5, windowSec: 600 } // 5 per 10 minutes
export const AUTH_LOGIN_LIMIT: RateLimitConfig = { limit: 10, windowSec: 600 } // 10 per 10 minutes
