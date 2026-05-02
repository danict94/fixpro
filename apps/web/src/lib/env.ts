import 'server-only'

function requireEnv(name: string, minLength = 1): string {
  const value = process.env[name]
  if (!value) throw new Error(`[env] ${name} is missing. Set it in your environment variables.`)
  if (value.length < minLength) throw new Error(`[env] ${name} must be at least ${minLength} characters long.`)
  return value
}

requireEnv('DATABASE_URL')
requireEnv('BETTER_AUTH_SECRET', 32)
requireEnv('STRIPE_SECRET_KEY')
requireEnv('STRIPE_WEBHOOK_SECRET')
requireEnv('RESEND_API_KEY')
requireEnv('TWILIO_ACCOUNT_SID')
requireEnv('TWILIO_AUTH_TOKEN')
requireEnv('TWILIO_VERIFY_SERVICE_SID')
requireEnv('TWILIO_WHATSAPP_CONTENT_SID')
