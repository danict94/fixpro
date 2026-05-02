import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@fixpro/ui', '@fixpro/api', '@fixpro/db', '@fixpro/shared'],
  images: {
    qualities: [75, 85, 90],
  },
}

export default nextConfig