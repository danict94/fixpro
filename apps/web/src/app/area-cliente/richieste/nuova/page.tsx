import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { api } from '@/lib/trpc/server'
import { prisma } from '@fixpro/db'
import { getActivePublicShowcaseTargetBySlug } from '@fixpro/api'
import { NuovaRichiestaWizard } from './_components/wizard'
import { resolveRequestPrefill } from '@/lib/request-prefill'

export default async function NuovaRichiestaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams

  const trimmedQuery =
    typeof params.q === 'string' ? params.q.trim() : ''

  const shouldResolveFromQuery =
    !params.intervento &&
    !params.categoria &&
    !params.servizio &&
    trimmedQuery.length >= 2

  const [settori, interventi, session, searchResults] = await Promise.all([
    api.taxonomy.getSettori(),
    api.taxonomy.getInterventi(),
    auth.api.getSession({ headers: await headers() }),
    shouldResolveFromQuery
      ? api.taxonomy.searchTaxonomy({ q: trimmedQuery })
      : undefined,
  ])

  const user = session?.user

  const userPhone =
    (user as Record<string, unknown> | undefined)?.phoneNumber as string | undefined

  // Flusso contatto diretto da vetrina: ?ref=showcase&slug=<company-slug>
  let targetCompany: { id: string; ragioneSociale: string } | null = null

  if (params.ref === 'showcase' && typeof params.slug === 'string') {
    const activeTargetCompany =
      await getActivePublicShowcaseTargetBySlug(prisma, params.slug)

    if (activeTargetCompany) {
      targetCompany = {
        id: activeTargetCompany.id,
        ragioneSociale: activeTargetCompany.ragioneSociale,
      }
    }
  }

  const {
    initialSettoreId,
    initialInterventoId,
    initialCategoriaId,
    initialServizioId,
  } = resolveRequestPrefill({
    params,
    settori,
    interventi,
    searchResults,
  })

  const initialIntervento = initialInterventoId
    ? interventi.find((intervento) => intervento.id === initialInterventoId) ?? null
    : null

  return (
    <div className="page-section space-y-6 lg:space-y-8">
      <section className="app-page-header">
        <div className="max-w-[680px]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
            Area cliente
          </p>
          <h1 className="section-title mt-3 text-secondary">Nuova richiesta</h1>
          <p className="muted-copy mt-3 text-sm leading-6 sm:text-[15px]">
            Inserisci i dettagli del lavoro e invia la richiesta ai professionisti più adatti.
          </p>

          {initialIntervento && (
            <div className="mt-5 rounded-[20px] border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-primary">
                Richiesta per
              </p>
              <p className="mt-1 text-sm font-semibold text-secondary">
                {initialIntervento.nome}
              </p>
            </div>
          )}
        </div>
      </section>

      <NuovaRichiestaWizard
        settori={settori}
        interventi={interventi}
        initialUser={
          user
            ? {
                name:
                  user.name.split(' ').slice(0, -1).join(' ') || user.name,
                surname: user.name.split(' ').slice(-1)[0] ?? '',
                email: user.email,
                phone: userPhone ?? '',
              }
            : undefined
        }
        targetCompany={targetCompany}
        initialInterventoId={initialInterventoId}
        initialSettoreId={initialSettoreId}
        initialCategoriaId={initialCategoriaId}
        initialServizioId={initialServizioId}
      />
    </div>
  )
}