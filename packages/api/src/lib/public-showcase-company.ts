import type { prisma } from '@fixpro/db'
import { expireShowcaseSubscriptions } from './showcase-subscription'

type PublicShowcaseCompanyDb = Pick<typeof prisma, 'company' | 'showcaseSubscription'>

export type ActivePublicShowcaseCompanyWhereInput = {
  id?: string
  slug?: string
  province?: string
  categoriaSlug?: string
  now?: Date
}

export type ActivePublicShowcaseTarget = {
  id: string
  slug: string
  ragioneSociale: string
}

export const ACTIVE_PUBLIC_SHOWCASE_TARGET_SELECT = {
  id: true,
  slug: true,
  ragioneSociale: true,
} as const

/**
 * Regola unica per determinare se un'impresa può essere mostrata/contattata
 * pubblicamente come vetrina.
 *
 * Questa regola va riusata da:
 * - showcase.public.listFeatured
 * - showcase.public.getProfile
 * - /richiesta?ref=showcase
 * - /area-cliente/richieste/nuova?ref=showcase
 * - futuro step preview aziende nel wizard
 */
export function buildActivePublicShowcaseCompanyWhere({
  id,
  slug,
  province,
  categoriaSlug,
  now = new Date(),
}: ActivePublicShowcaseCompanyWhereInput = {}) {
  const normalizedId = id?.trim()
  const normalizedSlug = slug?.trim()
  const normalizedProvince = province?.trim().toUpperCase()
  const normalizedCategoriaSlug = categoriaSlug?.trim()

  return {
    status: 'APPROVED' as const,
    showcase: {
      status: 'ACTIVE' as const,
      expiresAt: { gt: now },
    },
    ...(normalizedId ? { id: normalizedId } : {}),
    ...(normalizedSlug ? { slug: normalizedSlug } : {}),
    ...(normalizedProvince ? { province: normalizedProvince } : {}),
    ...(normalizedCategoriaSlug
      ? {
          categories: {
            some: {
              categoria: {
                slug: normalizedCategoriaSlug,
              },
            },
          },
        }
      : {}),
  }
}

/**
 * Risolve una impresa target per richieste dirette da vetrina tramite slug.
 *
 * Se lo slug non appartiene a una impresa APPROVED con vetrina ACTIVE non scaduta,
 * ritorna null. In questo modo il funnel degrada in marketplace invece di creare
 * una richiesta diretta non autorizzata.
 */
export async function getActivePublicShowcaseTargetBySlug(
  db: PublicShowcaseCompanyDb,
  slug: string,
): Promise<ActivePublicShowcaseTarget | null> {
  const normalizedSlug = slug.trim()

  if (!normalizedSlug) {
    return null
  }

  await expireShowcaseSubscriptions(db)

  return db.company.findFirst({
    where: buildActivePublicShowcaseCompanyWhere({ slug: normalizedSlug }),
    select: ACTIVE_PUBLIC_SHOWCASE_TARGET_SELECT,
  })
}

/**
 * Risolve una impresa target per richieste dirette da vetrina tramite id.
 *
 * Serve lato backend quando il frontend invia targetCompanyId dal wizard.
 * Se l'impresa non è pubblicamente contattabile come vetrina, ritorna null.
 */
export async function getActivePublicShowcaseTargetById(
  db: PublicShowcaseCompanyDb,
  companyId: string,
): Promise<ActivePublicShowcaseTarget | null> {
  const normalizedCompanyId = companyId.trim()

  if (!normalizedCompanyId) {
    return null
  }

  await expireShowcaseSubscriptions(db, { companyId: normalizedCompanyId })

  return db.company.findFirst({
    where: buildActivePublicShowcaseCompanyWhere({ id: normalizedCompanyId }),
    select: ACTIVE_PUBLIC_SHOWCASE_TARGET_SELECT,
  })
}