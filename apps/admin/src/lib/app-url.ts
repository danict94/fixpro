const LOCAL_ADMIN_URL = 'http://localhost:3001'

function normalizeUrl(url: string) {
  return url.replace(/\/$/, '')
}

export function getAdminAppUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_ADMIN_URL ??
    process.env.BETTER_AUTH_URL

  if (configuredUrl) {
    return normalizeUrl(configuredUrl)
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[env] NEXT_PUBLIC_ADMIN_URL is missing. Set it to the public admin URL.',
    )
  }

  return LOCAL_ADMIN_URL
}