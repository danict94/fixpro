import 'server-only'
import { AsyncLocalStorage } from 'node:async_hooks'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'
import { prisma } from '@fixpro/db'
import { buildAdminEmail, sendAdminEmail, type AdminEmailVariant } from '@fixpro/api'
import { getAdminAppUrl } from './app-url'

const _authSecret = process.env.BETTER_AUTH_SECRET

if (!_authSecret) {
  throw new Error('[auth] BETTER_AUTH_SECRET is missing. Set it in your environment variables.')
}

if (_authSecret.length < 32) {
  throw new Error('[auth] BETTER_AUTH_SECRET must be at least 32 characters long.')
}

const adminBaseURL = getAdminAppUrl()
const adminEmailVariantStore = new AsyncLocalStorage<AdminEmailVariant>()

const ADMIN_EMAIL_SUBJECT: Record<AdminEmailVariant, string> = {
  invite: 'Invito admin - FixPro Admin',
  'force-reset': 'Reimposta il tuo accesso - FixPro Admin',
  'request-reset': 'Reimposta il tuo accesso - FixPro Admin',
}

export function getAdminResetPasswordRedirect() {
  return `${adminBaseURL}/reimposta-password`
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
      const variant = adminEmailVariantStore.getStore() ?? 'request-reset'

      await sendAdminEmail({
        to: user.email,
        subject: ADMIN_EMAIL_SUBJECT[variant],
        html: buildAdminEmail(url, variant),
      })
    },
  },
  plugins: [nextCookies()],
  user: {
    additionalFields: {
      role: { type: 'string', defaultValue: 'CLIENT', required: false, input: false },
      adminRole: { type: 'string', required: false, input: false },
    },
  },
  secret: _authSecret,
  baseURL: adminBaseURL,
  trustedOrigins: [adminBaseURL],
})

export async function requestAdminPasswordReset(
  email: string,
  variant: AdminEmailVariant = 'request-reset',
) {
  await adminEmailVariantStore.run(variant, async () => {
    await auth.api.requestPasswordReset({
      body: {
        email: email.toLowerCase().trim(),
        redirectTo: getAdminResetPasswordRedirect(),
      },
    })
  })
}