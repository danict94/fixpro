import { redirect, notFound } from 'next/navigation'
import { api } from '@/lib/trpc/server'

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const result = await api.taxonomy.getBySlug({ slug })

  if (!result) notFound()

  // categoria → redirect SEO corretto
  if (result.type === 'categoria') {
    redirect(`/categorie/${result.categoria.slug}`)
  }

  // intervento → funnel
  if (result.type === 'intervento') {
    redirect(`/richiesta?intervento=${result.intervento.slug}`)
  }

  // servizio → funnel
  if (result.type === 'servizio') {
    redirect(`/richiesta?servizio=${result.servizio.slug}`)
  }

  // fallback sicurezza
  notFound()
}