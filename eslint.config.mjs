import js from '@eslint/js'
import nextVitals from 'eslint-config-next/core-web-vitals'
import tseslint from 'typescript-eslint'

const globalIgnores = {
  ignores: [
    '**/node_modules/**',
    '**/.next/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/generated/**',
    'packages/db/prisma/generated/**',
    '**/next-env.d.ts',
  ],
}

const nextAppFiles = [
  'apps/web/src/**/*.{js,jsx,ts,tsx,mjs,cjs}',
  'apps/admin/src/**/*.{js,jsx,ts,tsx,mjs,cjs}',
]

const packageFiles = ['packages/**/*.{js,jsx,ts,tsx,mjs,cjs}']

export default [
  globalIgnores,

  js.configs.recommended,

  ...tseslint.configs.recommended,

  ...nextVitals.map((config) => ({
    ...config,
    files: nextAppFiles,
  })),

  {
    files: packageFiles,
    rules: {
      'no-undef': 'off',
    },
  },
]