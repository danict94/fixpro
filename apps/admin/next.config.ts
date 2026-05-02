import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@fixpro/ui', '@fixpro/api', '@fixpro/db', '@fixpro/shared'],
}

export default nextConfig
