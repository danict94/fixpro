import 'server-only'

import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

export interface StoredAsset {
  url: string
  storageKey: string
}

export function sanitizeFilename(filename: string) {
  return filename
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function withTimestamp(filename: string) {
  const safeName = sanitizeFilename(filename || 'file')
  return `${Date.now()}-${safeName}`
}

function normalizeStorageKey(storageKey: string) {
  return storageKey
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .map((segment) => sanitizeFilename(segment))
    .join('/')
}

function uploadsRoot() {
  return path.join(process.cwd(), 'public', 'uploads')
}

function localAssetPath(storageKey: string) {
  return path.join(uploadsRoot(), ...normalizeStorageKey(storageKey).split('/'))
}

export function isLocalAssetStorage() {
  return process.env.NODE_ENV !== 'production'
}

export function getLocalAssetUrl(storageKey: string) {
  return `/uploads/${normalizeStorageKey(storageKey)}`
}

export async function uploadAsset(file: File, storageKey: string): Promise<StoredAsset> {
  const normalizedKey = normalizeStorageKey(storageKey)
  const outputPath = localAssetPath(normalizedKey)
  const buffer = Buffer.from(await file.arrayBuffer())

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, buffer)

  return {
    url: getLocalAssetUrl(normalizedKey),
    storageKey: normalizedKey,
  }
}

export async function deleteAsset(storageKey: string) {
  const normalizedKey = normalizeStorageKey(storageKey)
  const outputPath = localAssetPath(normalizedKey)

  try {
    await stat(outputPath)
  } catch {
    return
  }

  await rm(outputPath, { force: true })
}

export function companyLogoStorageKey(companyId: string, filename: string) {
  return `companies/${companyId}/logo/${withTimestamp(filename)}`
}

export function companyPortfolioStorageKey(companyId: string, filename: string) {
  return `companies/${companyId}/portfolio/${withTimestamp(filename)}`
}

export function requestImageStorageKey(requestId: string, filename: string) {
  return `requests/${requestId}/${withTimestamp(filename)}`
}
