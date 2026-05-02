// ── Pacchetti crediti disponibili ────────────────────────────────────────────
export const CREDIT_PACKAGES = [
  {
    id:          'starter',
    name:        'Starter',
    credits:     5,
    priceCents:  900,
    validityMonths: 12,
    description: 'Ideale per iniziare',
    popular:     false,
  },
  {
    id:          'standard',
    name:        'Standard',
    credits:     15,
    priceCents:  2400,
    validityMonths: 12,
    description: 'Il più scelto dalle imprese',
    popular:     true,
  },
  {
    id:          'pro',
    name:        'Pro',
    credits:     30,
    priceCents:  4500,
    validityMonths: 12,
    description: 'Per massimizzare i contatti',
    popular:     false,
  },
] as const

export type CreditPackageId = typeof CREDIT_PACKAGES[number]['id']
export type CreditPackage   = typeof CREDIT_PACKAGES[number]

// ── Utility masking contatti ──────────────────────────────────────────────────

export function maskEmail(email: string): string {
  const at = email.indexOf('@')
  if (at < 1) return '****'
  return `${email[0]}****${email.slice(at)}`
}

export function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length < 7) return '****'
  return `${d.slice(0, 3)}****${d.slice(-3)}`
}

export function maskName(name: string): string {
  return name
    .split(' ')
    .map((w) => (w.length > 1 ? `${w[0]}****` : w))
    .join(' ')
}
