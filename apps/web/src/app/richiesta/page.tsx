import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { api } from '@/lib/trpc/server'
import { prisma } from '@fixpro/db'
import { getActivePublicShowcaseTargetBySlug } from '@fixpro/api'
import { NuovaRichiestaWizard } from '@/app/area-cliente/richieste/nuova/_components/wizard'
import { resolveRequestPrefill } from '@/lib/request-prefill'

/**
 * Pagina pubblica /richiesta — punto di ingresso per il form richiesta.
 * - Utente loggato → redirect al wizard autenticato (preserva query params).
 * - Guest → wizard inline senza login obbligatorio.
 * Non è nel matcher del middleware, quindi non viene bloccata dall'auth.
 */

type SearchParams = Record<string, string | undefined>

export default async function RichiestaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const trimmedQuery =
    typeof params.q === 'string' ? params.q.trim() : ''

  if (session?.user) {
    const qs = new URLSearchParams()

    if (typeof params.ref === 'string') qs.set('ref', params.ref)
    if (typeof params.slug === 'string') qs.set('slug', params.slug)
    if (typeof params.macro === 'string') qs.set('macro', params.macro)
    if (typeof params.intervento === 'string') qs.set('intervento', params.intervento)
    if (typeof params.categoria === 'string') qs.set('categoria', params.categoria)
    if (typeof params.servizio === 'string') qs.set('servizio', params.servizio)
    if (typeof params.q === 'string') qs.set('q', params.q)

    const dest =
      qs.toString().length > 0
        ? `/area-cliente/richieste/nuova?${qs.toString()}`
        : '/area-cliente/richieste/nuova'

    redirect(dest)
  }

  const shouldResolveFromQuery =
    !params.intervento &&
    !params.categoria &&
    !params.servizio &&
    trimmedQuery.length >= 2

  const [settori, interventi, searchResults] = await Promise.all([
    api.taxonomy.getSettori(),
    api.taxonomy.getInterventi(),
    shouldResolveFromQuery
      ? api.taxonomy.searchTaxonomy({ q: trimmedQuery })
      : undefined,
  ])

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

  const initialCategoria = initialCategoriaId
    ? settori
        .flatMap((settore) => settore.categorie)
        .find((categoria) => categoria.id === initialCategoriaId) ?? null
    : null

  const initialServizio =
    initialServizioId && initialCategoria
      ? initialCategoria.servizi.find((servizio) => servizio.id === initialServizioId) ?? null
      : null

  const initialPrefillTitle =
    initialIntervento?.nome ??
    initialServizio?.nome ??
    initialCategoria?.nome ??
    null

  const initialPrefillSubtitle =
    initialIntervento && initialServizio
      ? initialServizio.nome
      : initialServizio && initialCategoria
        ? initialCategoria.nome
        : null

  return (
    <div className="bg-[#F6F7FB]">
      <div className="page-container page-section">
        <div className="mx-auto max-w-[960px] space-y-6">
          <section className="app-page-header">
            <div className="max-w-[680px]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
                Nuova richiesta
              </p>
              <h1 className="section-title mt-3 text-secondary">
                Descrivi il lavoro e trova i professionisti giusti
              </h1>
              <p className="muted-copy mt-3 text-sm leading-6 sm:text-[15px]">
                Compila la richiesta in pochi passaggi. Se preferisci, puoi iniziare subito anche
                senza accedere.
              </p>

              {initialPrefillTitle && (
                <div className="mt-5 rounded-[20px] border border-primary/20 bg-primary/5 px-4 py-3">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-primary">
                    Richiesta per
                  </p>
                  <p className="mt-1 text-sm font-semibold text-secondary">
                    {initialPrefillTitle}
                  </p>
                  {initialPrefillSubtitle && (
                    <p className="muted-copy mt-1 text-xs leading-5">
                      {initialPrefillSubtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          <NuovaRichiestaWizard
            settori={settori}
            interventi={interventi}
            isGuest
            targetCompany={targetCompany}
            initialInterventoId={initialInterventoId}
            initialSettoreId={initialSettoreId}
            initialCategoriaId={initialCategoriaId}
            initialServizioId={initialServizioId}
          />
        </div>
      </div>
    </div>
  )
}