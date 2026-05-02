import type * as SentryTypes from '@sentry/node'

const dsn = process.env.SENTRY_DSN
const environment = process.env.NODE_ENV || 'development'
const isProduction = environment === 'production'

let sentryClientPromise: Promise<typeof SentryTypes | null> | null = null
let sentryInitialized = false

async function getSentry(): Promise<typeof SentryTypes | null> {
  if (!dsn) return null

  // In development evitiamo proprio di caricare @sentry/node dal package API,
  // perché in Next dev trascina OpenTelemetry/Fastify/Express nel bundle server.
  if (!isProduction) return null

  if (!sentryClientPromise) {
    sentryClientPromise = loadSentryNode()
      .then((Sentry) => {
        if (!sentryInitialized) {
          Sentry.init({
            dsn,
            environment,
            tracesSampleRate: 0.1,
            profilesSampleRate: 0,
            serverName: 'fixpro-api',
            beforeSend(event) {
              return sanitizeEvent(event) as SentryTypes.ErrorEvent | null
            },
          })

          sentryInitialized = true
        }

        return Sentry
      })
      .catch(() => null)
  }

  return sentryClientPromise
}

/**
 * Non usare `import('@sentry/node')` qui:
 * Next/Webpack lo rileva comunque e trascina OpenTelemetry nel bundle dev.
 */
async function loadSentryNode(): Promise<typeof SentryTypes> {
  const importer = new Function(
    'specifier',
    'return import(specifier)',
  ) as (specifier: string) => Promise<typeof SentryTypes>

  return importer('@sentry/node')
}

function sanitizeEvent(event: SentryTypes.Event): SentryTypes.Event {
  if (event.request?.headers) {
    const headers = event.request.headers as Record<string, unknown>
    delete headers['authorization']
    delete headers['x-api-key']
    delete headers['stripe-signature']
  }

  if (event.extra) {
    const extra = event.extra as Record<string, unknown>
    delete extra['creditCard']
    delete extra['password']
    delete extra['otp']
  }

  return event
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!dsn || !isProduction) return

  void getSentry().then((Sentry) => {
    Sentry?.captureException(error, {
      extra: context,
      tags: {
        service: 'fixpro-api',
        env: environment,
      },
    })
  })
}

export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>,
) {
  if (!dsn || !isProduction) return

  void getSentry().then((Sentry) => {
    Sentry?.captureMessage(message, {
      level,
      extra: context,
      tags: {
        service: 'fixpro-api',
        env: environment,
      },
    })
  })
}

export function addBreadcrumb(category: string, message: string, data?: Record<string, unknown>) {
  if (!dsn || !isProduction) return

  void getSentry().then((Sentry) => {
    Sentry?.addBreadcrumb({
      category,
      message,
      data,
      level: 'info',
    })
  })
}

export function setUser(userId: string, email?: string) {
  if (!dsn || !isProduction) return

  void getSentry().then((Sentry) => {
    Sentry?.setUser({
      id: userId,
      email: email ? '***@example.com' : undefined,
    })
  })
}