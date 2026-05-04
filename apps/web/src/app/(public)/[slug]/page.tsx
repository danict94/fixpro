import { redirect, notFound } from 'next/navigation'
import { api } from '@/lib/trpc/server'

type PageProps = {
  params: { slug: string }
}

export default async function SlugPage({ params }: PageProps) {
  const slug = params.slug

  const result = await api.taxonomy.getBySlug({ slug })

  if (!result) notFound()

  if (result.type === 'categoria') {
    redirect(`/categorie/${result.categoria.slug}`)
  }

  if (result.type === 'intervento') {
    redirect(`/richiesta?intervento=${result.intervento.slug}`)
  }

  if (result.type === 'servizio') {
    redirect(`/richiesta?servizio=${result.servizio.slug}`)
  }

  notFound()
}
