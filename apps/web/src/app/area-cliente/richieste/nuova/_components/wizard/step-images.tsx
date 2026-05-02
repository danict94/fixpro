'use client'

import type { Dispatch, FormEventHandler, SetStateAction } from 'react'
import { CheckCircle, ImagePlus } from 'lucide-react'
import { Button } from '@fixpro/ui'

interface StepImagesProps {
  error: string | null
  onSubmit: FormEventHandler<HTMLFormElement>
  hasImages: boolean | null
  setHasImages: Dispatch<SetStateAction<boolean | null>>
  requestFiles: File[]
  setRequestFiles: Dispatch<SetStateAction<File[]>>
}

export function StepImages({
  error,
  onSubmit,
  hasImages,
  setHasImages,
  requestFiles,
  setRequestFiles,
}: StepImagesProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="surface-section space-y-5 px-5 py-5 sm:px-6">
        <div className="text-center space-y-2 py-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <ImagePlus className="h-7 w-7 stroke-primary" aria-hidden="true" />
          </div>
          <p className="font-medium text-secondary">Desideri aggiungere delle immagini?</p>
          <p className="muted-copy text-sm">
            Non hai alcuna immagine? Nessun problema.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {([
            { value: false, label: 'No' },
            { value: true, label: 'Sì' },
          ] as const).map(({ value, label }) => (
            <button
              key={String(value)}
              type="button"
              onClick={() => {
                setHasImages(value)
                if (!value) setRequestFiles([])
              }}
              className={`flex items-center justify-center gap-2 rounded-[22px] border py-4 text-sm font-medium transition-all duration-150
                ${hasImages === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-white text-muted-foreground hover:border-primary/50 hover:text-secondary'
                }`}
            >
              {hasImages === value && <CheckCircle className="h-4 w-4" aria-hidden="true" />}
              {label}
            </button>
          ))}
        </div>

        {hasImages === true && (
          <div className="rounded-[22px] border border-dashed border-border bg-muted/20 p-4">
            <div className="space-y-1 text-left">
              <p className="text-sm font-medium text-secondary">Carica immagini della richiesta</p>
              <p className="muted-copy text-xs">
                JPG, PNG o WEBP. Massimo 5 immagini. Le immagini verranno caricate subito dopo la creazione della richiesta.
              </p>
            </div>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => {
                const nextFiles = Array.from(event.target.files ?? []).slice(0, 5)
                setRequestFiles(nextFiles)
              }}
              className="block w-full text-sm text-secondary file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-primary-foreground"
            />

            {requestFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {requestFiles.map((file) => (
                  <div key={`${file.name}-${file.size}`} className="rounded-[18px] border border-border bg-white px-3 py-2 text-left">
                    <p className="truncate text-xs font-medium text-secondary">{file.name}</p>
                    <p className="muted-copy text-[11px]">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="rounded-[18px] border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">{error}</p>}
      <Button type="submit" className="primary-pill h-11 w-full text-sm font-semibold" disabled={hasImages === null}>Continua</Button>
    </form>
  )
}
