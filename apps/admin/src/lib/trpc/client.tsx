'use client'

import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@fixpro/api'

export const trpc = createTRPCReact<AppRouter>()
