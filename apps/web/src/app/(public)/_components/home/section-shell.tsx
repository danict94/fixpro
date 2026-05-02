import type { ReactNode } from 'react'

type SectionShellTone = 'default' | 'muted' | 'primarySoft' | 'white'
type SectionShellSpacing = 'sm' | 'md' | 'lg' | 'xl'

const toneClasses: Record<SectionShellTone, string> = {
  default: 'bg-background',
  muted: 'bg-[#F6F7FB]',
  primarySoft: 'bg-[#F4F3FF]',
  white: 'bg-white',
}

const spacingClasses: Record<SectionShellSpacing, string> = {
  sm: 'py-10 sm:py-12',
  md: 'py-12 sm:py-16',
  lg: 'py-16 sm:py-20',
  xl: 'py-20 sm:py-24',
}

export function SectionShell({
  children,
  tone = 'default',
  spacing = 'md',
  className = '',
  containerClassName = '',
}: {
  children: ReactNode
  tone?: SectionShellTone
  spacing?: SectionShellSpacing
  className?: string
  containerClassName?: string
}) {
  return (
    <section className={`${toneClasses[tone]} ${spacingClasses[spacing]} ${className}`}>
      <div
        className={`mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8 ${containerClassName}`}
      >
        {children}
      </div>
    </section>
  )
}