interface RequestLocationInput {
  city?: string | null
  province?: string | null
}

interface RequestDisplayTitleInput extends RequestLocationInput {
  title: string
  interventoNome?: string | null
}

export function formatRequestLocation({ city, province }: RequestLocationInput) {
  const cleanCity = city?.trim()
  const cleanProvince = province?.trim().toUpperCase()

  if (cleanCity && cleanProvince) return `${cleanCity} (${cleanProvince})`
  if (cleanCity) return cleanCity
  if (cleanProvince) return cleanProvince
  return ''
}

export function formatRequestDisplayTitle({
  title,
  interventoNome,
  city,
  province,
}: RequestDisplayTitleInput) {
  const baseTitle = interventoNome?.trim() || title.trim()
  const location = formatRequestLocation({ city, province })

  return location ? `${baseTitle} - ${location}` : baseTitle
}

export function formatRequestPublishedLabel(createdAt: Date | string) {
  return `Pubblicata il ${new Date(createdAt).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })}`
}
