'use client'

import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import type { auth } from './auth'
import { getAdminAppUrl } from './app-url'

export const authClient = createAuthClient({
  baseURL: getAdminAppUrl(),
  plugins: [inferAdditionalFields<typeof auth>()],
})