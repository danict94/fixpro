'use client'

import Link from 'next/link'
import { Building2, Home } from 'lucide-react'
import { TypeCard } from '@fixpro/ui'
import type { Role } from './wizard-types'

interface RoleSelectionProps {
  onSelectRole: (role: Role) => void
}

export function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TypeCard
          icon={Home}
          title="Sono un cliente"
          subtitle="Cerco professionisti per i miei lavori"
          onClick={() => onSelectRole('CLIENT')}
          className="surface-card rounded-[22px] border-0 p-7 text-left shadow-none"
          titleClassName="text-secondary"
          descriptionClassName="muted-copy text-sm"
        />

        <TypeCard
          icon={Building2}
          title="Sono un professionista"
          subtitle="Dico di cosa mi occupo e completo i servizi dopo il primo accesso"
          onClick={() => onSelectRole('COMPANY')}
          className="surface-card rounded-[22px] border-0 p-7 text-left shadow-none"
          titleClassName="text-secondary"
          descriptionClassName="muted-copy text-sm"
        />
      </div>

      <p className="muted-copy text-center text-sm">
        Hai già un account?{' '}
        <Link href="/accedi" className="text-primary font-semibold hover:underline">
          Accedi
        </Link>
      </p>
    </div>
  )
}
