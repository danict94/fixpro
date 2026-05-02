'use client'

import { useState } from 'react'
import { generateReactHelpers } from '@uploadthing/react'
import type { AppFileRouter } from '@/app/api/uploadthing/core'

const uploadthing = generateReactHelpers<AppFileRouter>()

type Endpoint = keyof AppFileRouter
type UploadInput = Record<string, string | number | boolean | undefined>
type UploadedFile = {
  url: string
  storageKey: string
}

type UploadCallbacks = {
  onClientUploadComplete?: (files: UploadedFile[]) => void
  onUploadError?: (error: Error) => void
}

function useUploadThingLocal(_endpoint: Endpoint, callbacks?: UploadCallbacks) {
  const [isUploading, setIsUploading] = useState(false)

  return {
    isUploading,
    startUpload: async (files: File[], input?: UploadInput) => {
      setIsUploading(true)
      try {
        const formData = new FormData()
        formData.set('uploader', _endpoint)

        for (const [key, value] of Object.entries(input ?? {})) {
          if (value !== undefined) {
            formData.set(key, String(value))
          }
        }

        for (const file of files) {
          formData.append('files', file)
        }

        const response = await fetch('/api/local-upload', {
          method: 'POST',
          body: formData,
        })

        const payload = (await response.json().catch(() => null)) as
          | { files?: UploadedFile[]; error?: string }
          | null

        if (!response.ok) {
          throw new Error(payload?.error ?? 'Upload non riuscito.')
        }

        const uploadedFiles = payload?.files ?? []
        callbacks?.onClientUploadComplete?.(uploadedFiles)
        return uploadedFiles
      } catch (error) {
        const uploadError = error instanceof Error ? error : new Error('Upload non riuscito.')
        callbacks?.onUploadError?.(uploadError)
        throw uploadError
      } finally {
        setIsUploading(false)
      }
    },
  }
}

export const useUploadThing =
  process.env.NODE_ENV === 'production'
    ? uploadthing.useUploadThing
    : useUploadThingLocal
