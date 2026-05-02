'use client'

import Link from 'next/link'

/**
 * Wrapper 'use client' per usare next/link come wrapper di Card in Server Components.
 * Link è un Client Component con onClick interno — non può essere usato direttamente
 * come wrapper di contenuto Server Component senza questo boundary.
 */
export function CardLink({
  href,
  className = 'group block',
  children,
}: {
  href:       string
  className?: string
  children:   React.ReactNode
}) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
