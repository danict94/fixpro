import 'server-only'

import { UTApi } from 'uploadthing/server'
import { deleteAsset, getLocalAssetUrl, isLocalAssetStorage } from '@/lib/asset-storage'

let utapi: UTApi | null = null

function getUtApi() {
  if (!utapi) {
    utapi = new UTApi()
  }
  return utapi
}

export async function getPrivateAssetUrl(storageKey: string) {
  if (isLocalAssetStorage()) {
    return getLocalAssetUrl(storageKey)
  }

  const api = getUtApi()
  const signed = await api.generateSignedURL(storageKey, {
    keyType: 'customId',
    expiresIn: 60 * 15,
  })

  return signed.ufsUrl
}

export async function deleteStoredAsset(storageKey: string) {
  if (isLocalAssetStorage()) {
    await deleteAsset(storageKey)
    return
  }

  const api = getUtApi()
  await api.deleteFiles(storageKey, { keyType: 'customId' })
}
