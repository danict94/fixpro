'use client'

import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields, magicLinkClient, phoneNumberClient } from 'better-auth/client/plugins'
import type { auth } from './auth'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  plugins: [
    magicLinkClient(),
    phoneNumberClient(),
    inferAdditionalFields<typeof auth>(),
  ],
})

export type Session = typeof authClient.$Infer.Session
