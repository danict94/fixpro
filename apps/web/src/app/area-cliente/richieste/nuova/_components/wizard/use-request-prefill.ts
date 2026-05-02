'use client'

import { useEffect } from 'react'
import type { Intervento, Settore } from './types'

function findSelectedServizio(settori: Settore[], servizioId: string) {
  if (!servizioId) return null

  for (const settore of settori) {
    for (const categoria of settore.categorie) {
      const servizio = categoria.servizi.find((item) => item.id === servizioId)

      if (servizio) {
        return {
          ...servizio,
          categoria: {
            id: categoria.id,
            slug: categoria.slug,
            nome: categoria.nome,
          },
          settore: {
            id: settore.id,
            nome: settore.nome,
          },
        }
      }
    }
  }

  return null
}

export function useRequestPrefill({
  settori,
  interventi,
  initialInterventoId,
  servizioId,
  setSearchQuery,
  setCategoriaId,
}: {
  settori: Settore[]
  interventi: Intervento[]
  initialInterventoId?: string
  servizioId: string
  setSearchQuery: (value: string) => void
  setCategoriaId: (value: string) => void
}) {
  const selectedServizio = findSelectedServizio(settori, servizioId)

  useEffect(() => {
    if (!initialInterventoId) return

    const intervento = interventi.find((item) => item.id === initialInterventoId)
    if (!intervento) return

    setSearchQuery(intervento.nome)
  }, [initialInterventoId, interventi, setSearchQuery])

  useEffect(() => {
    if (!selectedServizio) return

    setCategoriaId(selectedServizio.categoriaId)
  }, [selectedServizio, setCategoriaId])

  return {
    selectedServizio,
  }
}