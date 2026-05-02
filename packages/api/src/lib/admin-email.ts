export type AdminEmailVariant = 'invite' | 'force-reset' | 'request-reset'

const CONTENT: Record<AdminEmailVariant, { heading: string; body: string; cta: string; footer: string }> = {
  invite: {
    heading: 'Sei stato invitato come amministratore FixPro',
    body: 'Clicca il link sottostante per impostare la tua password e accedere al pannello amministrativo:',
    cta: 'Imposta password',
    footer: 'Il link scade in 15 minuti.',
  },
  'force-reset': {
    heading: 'Reimposta la tua password — FixPro Admin',
    body: 'Un Super Admin ha richiesto il reset della tua password. Clicca il link sottostante:',
    cta: 'Reimposta password',
    footer: "Il link scade in 15 minuti. Se non hai richiesto questo reset, contatta l'amministratore.",
  },
  'request-reset': {
    heading: 'Reimposta la tua password — FixPro Admin',
    body: 'Abbiamo ricevuto una richiesta di reset. Clicca il link sottostante per impostare una nuova password:',
    cta: 'Reimposta password',
    footer: 'Il link scade in 15 minuti. Se non hai richiesto il reset, ignora questo messaggio.',
  },
}

export function buildAdminEmail(resetUrl: string, variant: AdminEmailVariant): string {
  const c = CONTENT[variant]
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${c.heading}</h2>
      <p>${c.body}</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
        ${c.cta}
      </a>
      <p style="color: #666; font-size: 14px;">${c.footer}</p>
    </div>
  `
}

interface SendEmailOpts {
  to: string
  subject: string
  html: string
}

/** Invia email via Resend. Lancia se il server risponde non-OK. */
export async function sendAdminEmail({ to, subject, html }: SendEmailOpts): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: process.env.EMAIL_FROM!, to, subject, html }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => String(res.status))
    throw new Error(`[sendAdminEmail] Resend ${res.status}: ${text}`)
  }
}
