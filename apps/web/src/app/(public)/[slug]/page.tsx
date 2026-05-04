export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

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