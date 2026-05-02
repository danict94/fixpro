import 'server-only'
import './env'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { magicLink, phoneNumber } from 'better-auth/plugins'
import { nextCookies } from 'better-auth/next-js'
import { prisma } from '@fixpro/db'
import twilio from 'twilio'
import { Resend } from 'resend'

const _authSecret = process.env.BETTER_AUTH_SECRET!
const appBaseURL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'

// ─── Provider helpers (lazy init per evitare errori se le env mancano) ────────

function getTwilioClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!,
  )
}

function normalizePhoneToE164(phone: string) {
  const cleaned = phone.replace(/[\s\-().]/g, '')
  if (cleaned.startsWith('+')) return cleaned
  if (cleaned.startsWith('00')) return `+${cleaned.slice(2)}`
  if (cleaned.startsWith('39') && cleaned.length >= 11) return `+${cleaned}`
  return `+39${cleaned}`
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!)
}

// ─── Email template ───────────────────────────────────────────────────────────

function buildVerificationEmail(userName: string, verificationUrl: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verifica il tuo account — FixPro</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;padding:40px 32px;">
          <!-- Logo / Nome -->
          <tr>
            <td style="padding-bottom:28px;text-align:center;">
              <span style="font-size:22px;font-weight:700;color:#1a56db;">FixPro</span>
            </td>
          </tr>
          <!-- Titolo -->
          <tr>
            <td style="padding-bottom:12px;">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#09090b;">
                Ciao ${userName}, conferma il tuo indirizzo email
              </h1>
            </td>
          </tr>
          <!-- Testo -->
          <tr>
            <td style="padding-bottom:28px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#71717a;">
                Clicca il pulsante qui sotto per attivare il tuo account FixPro.
                Il link è valido per 24 ore.
              </p>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding-bottom:28px;text-align:center;">
              <a href="${verificationUrl}"
                 style="display:inline-block;background:#1a56db;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
                Conferma email
              </a>
            </td>
          </tr>
          <!-- Fallback link -->
          <tr>
            <td style="padding-bottom:8px;">
              <p style="margin:0;font-size:13px;color:#a1a1aa;">
                Se il pulsante non funziona, copia e incolla questo link nel browser:
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:28px;">
              <p style="margin:0;font-size:12px;word-break:break-all;color:#1a56db;">${verificationUrl}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #f4f4f5;padding-top:20px;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center;">
                Se non hai creato un account su FixPro, ignora questa email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildResetPasswordEmail(userName: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reimposta la password - FixPro</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;padding:40px 32px;">
          <tr>
            <td style="padding-bottom:28px;text-align:center;">
              <span style="font-size:22px;font-weight:700;color:#1a56db;">FixPro</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:12px;">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#09090b;">
                Ciao ${userName}, reimposta la tua password
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:28px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#71717a;">
                Usa il pulsante qui sotto per scegliere una nuova password. Il link resta valido per 1 ora.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:28px;text-align:center;">
              <a href="${resetUrl}"
                 style="display:inline-block;background:#1a56db;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
                Reimposta password
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:8px;">
              <p style="margin:0;font-size:13px;color:#a1a1aa;">
                Se il pulsante non funziona, copia e incolla questo link nel browser:
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:28px;">
              <p style="margin:0;font-size:12px;word-break:break-all;color:#1a56db;">${resetUrl}</p>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #f4f4f5;padding-top:20px;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center;">
                Se non hai richiesto il reset della password, puoi ignorare questa email in sicurezza.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildMagicLinkEmail(loginUrl: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Accedi a FixPro</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;padding:40px 32px;">
          <tr>
            <td style="padding-bottom:28px;text-align:center;">
              <span style="font-size:22px;font-weight:700;color:#1a56db;">FixPro</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:12px;">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#09090b;">
                Accedi al tuo account FixPro
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:28px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#71717a;">
                Usa il pulsante qui sotto per entrare in FixPro senza password. Il link resta valido per pochi minuti.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:28px;text-align:center;">
              <a href="${loginUrl}"
                 style="display:inline-block;background:#1a56db;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
                Accedi a FixPro
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:8px;">
              <p style="margin:0;font-size:13px;color:#a1a1aa;">
                Se il pulsante non funziona, copia e incolla questo link nel browser:
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:28px;">
              <p style="margin:0;font-size:12px;word-break:break-all;color:#1a56db;">${loginUrl}</p>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #f4f4f5;padding-top:20px;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center;">
                Se non hai richiesto questo accesso, puoi ignorare questa email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── Auth configuration ───────────────────────────────────────────────────────

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  emailAndPassword: {
    enabled: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`\n[DEV] Password reset link per ${user.email}:\n\x1b[36m${url}\x1b[0m\n`)
      }

      if (!process.env.RESEND_API_KEY) {
        if (process.env.NODE_ENV !== 'production') {
          return
        }
        throw new Error('RESEND_API_KEY mancante. Impossibile inviare l\'email di reset password.')
      }

      const resend = getResend()
      const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'FixPro <noreply@fixpro.it>',
        to: user.email,
        subject: 'Reimposta la tua password - FixPro',
        html: buildResetPasswordEmail(user.name, url),
      })

      if (error) {
        console.error('[auth] Resend sendResetPassword error:', error)
        throw new Error('Impossibile inviare l\'email di reset password. Riprova tra poco.')
      }
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`\n[DEV] Email verification link per ${user.email}:\n\x1b[36m${url}\x1b[0m\n`)
      }
      const resend = getResend()

      const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'FixPro <noreply@fixpro.it>',
        to: user.email,
        subject: 'Conferma il tuo indirizzo email — FixPro',
        html: buildVerificationEmail(user.name, url),
      })

      if (error) {
        console.error('[auth] Resend sendVerificationEmail error:', error)
        throw new Error('Impossibile inviare l\'email di verifica. Riprova tra poco.')
      }
    },
    sendOnSignUp: true,
  },

  plugins: [
    magicLink({
      disableSignUp: true,
      expiresIn: 10 * 60,
      sendMagicLink: async ({ email, url }) => {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`\n[DEV] Magic link per ${email}:\n\x1b[36m${url}\x1b[0m\n`)
        }

        if (!process.env.RESEND_API_KEY) {
          if (process.env.NODE_ENV !== 'production') {
            return
          }
          throw new Error('RESEND_API_KEY mancante. Impossibile inviare il magic link.')
        }

        const resend = getResend()
        const { error } = await resend.emails.send({
          from: process.env.EMAIL_FROM ?? 'FixPro <noreply@fixpro.it>',
          to: email,
          subject: 'Il tuo link di accesso FixPro',
          html: buildMagicLinkEmail(url),
        })

        if (error) {
          console.error('[auth] Resend sendMagicLink error:', error)
          throw new Error('Impossibile inviare il link di accesso. Riprova tra poco.')
        }
      },
    }),
    phoneNumber({
      sendOTP: async ({ phoneNumber: phone, code }) => {
        const to = normalizePhoneToE164(phone)
        const client = getTwilioClient()

        try {
          await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
            .verifications.create({
              to,
              channel: 'sms',
            })
        } catch (err) {
          console.error('[auth] Twilio sendOTP error:', { phoneNumber: to, code, err })
          throw err
        }
      },
      verifyOTP: async ({ phoneNumber: phone, code }) => {
        const to = normalizePhoneToE164(phone)
        const client = getTwilioClient()

        try {
          const check = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
            .verificationChecks.create({
              to,
              code,
            })

          return check.status === 'approved'
        } catch (err) {
          console.error('[auth] Twilio verifyOTP error:', { phoneNumber: to, err })
          return false
        }
      },
    }),
    nextCookies(),
  ],

  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'CLIENT',
        required: false,
        input: false,
      },
    },
  },

  secret: _authSecret,
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
})

export function getUserResetPasswordRedirect() {
  return `${appBaseURL}/reset-password`
}

export async function requestUserPasswordReset(email: string) {
  await auth.api.requestPasswordReset({
    body: {
      email: email.toLowerCase().trim(),
      redirectTo: getUserResetPasswordRedirect(),
    },
  })
}

export async function requestUserEmailVerification(email: string, callbackURL = '/accedi') {
  await auth.api.sendVerificationEmail({
    body: {
      email: email.toLowerCase().trim(),
      callbackURL,
    },
  })
}

export async function requestUserMagicLink(
  email: string,
  callbackURL = '/area-cliente',
  requestHeaders?: HeadersInit,
) {
  await auth.api.signInMagicLink({
    body: {
      email: email.toLowerCase().trim(),
      callbackURL,
      errorCallbackURL: '/accedi',
    },
    headers: requestHeaders ? new Headers(requestHeaders) : new Headers(),
  })
}
