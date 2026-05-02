'use client'

import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import superjson from 'superjson'
import type { AppRouter } from '@fixpro/api'

export const trpc = createTRPCReact<AppRouter>()

export function createTRPCClientConfig() {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        transformer: superjson,
      }),
    ],
  })
}
