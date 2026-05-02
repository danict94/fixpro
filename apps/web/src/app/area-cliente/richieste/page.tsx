import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import { api } from '@/lib/trpc/server'
import { Button } from '@fixpro/ui'
import { RichiesteClient } from './_components/richieste-client'

export default async function RichiestePage() {
  const richieste = await api.requests.list()

  return (
    <div className="page-section space-y-6 lg:space-y-8">
      <section className="app-page-header">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-[680px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
              Area cliente
            </p>
            <h1 className="section-title mt-3 text-secondary">Le mie richieste</h1>
            <p className="muted-copy mt-3 text-sm leading-6 sm:text-[15px]">
              {richieste.length === 0
                ? 'Qui troverai tutte le richieste inviate ai professionisti.'
                : `${richieste.length} richiesta${richieste.length > 1 ? 'e' : ''} inviata${richieste.length > 1 ? 'e' : ''} ai professionisti.`}
            </p>
          </div>

          <Link href="/area-cliente/richieste/nuova">
            <Button className="primary-pill gap-2 px-5 py-3 text-sm font-semibold">
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              Nuova richiesta
            </Button>
          </Link>
        </div>
      </section>

      <RichiesteClient richieste={richieste} />
    </div>
  )
}
