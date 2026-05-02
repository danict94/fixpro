'use client'

import Link from 'next/link'

export function RichiestaCardLink({
  href,
  children,
  disabled = false,
}: {
  href:     string
  children: React.ReactNode
  disabled?: boolean
}) {
  if (disabled) {
    return <div className="group block">{children}</div>
  }

  return (
    <Link href={href} className="group block">
      {children}
    </Link>
  )
}
