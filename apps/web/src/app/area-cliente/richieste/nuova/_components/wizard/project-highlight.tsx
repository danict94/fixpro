'use client'

import type { ReactNode } from 'react'

function normalizeAutocompleteText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getAutocompleteVariants(query: string) {
  const normalizedQuery = normalizeAutocompleteText(query)

  if (!normalizedQuery) {
    return []
  }

  const variants = new Set<string>([normalizedQuery])
  const tokens = normalizedQuery.split(' ').filter(Boolean)

  for (const token of tokens) {
    variants.add(token)

    if (token.length >= 4) {
      variants.add(token.slice(0, -1))
    }

    if (token.endsWith('i') && token.length >= 4) {
      variants.add(`${token.slice(0, -1)}o`)
    }

    if (token.endsWith('e') && token.length >= 4) {
      variants.add(`${token.slice(0, -1)}a`)
    }
  }

  return Array.from(variants)
    .filter((variant) => variant.length >= 2)
    .sort((a, b) => b.length - a.length)
}

function findHighlightRange(text: string, query: string) {
  const variants = getAutocompleteVariants(query)

  if (variants.length === 0) {
    return null
  }

  const normalizedEntries = Array.from(text).flatMap((character, originalIndex) => {
    const normalizedCharacter = character
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')

    return Array.from(normalizedCharacter).map((value) => ({
      value,
      originalIndex,
    }))
  })

  const normalizedText = normalizedEntries.map((entry) => entry.value).join('')

  for (const variant of variants) {
    const startIndex = normalizedText.indexOf(variant)

    if (startIndex === -1) {
      continue
    }

    const start = normalizedEntries[startIndex]?.originalIndex
    const end = normalizedEntries[startIndex + variant.length - 1]?.originalIndex

    if (start === undefined || end === undefined) {
      continue
    }

    return { start, end: end + 1 }
  }

  return null
}

export function renderHighlightedText(text: string, query: string): ReactNode {
  const range = findHighlightRange(text, query)

  if (!range) {
    return text
  }

  return (
    <>
      {text.slice(0, range.start)}
      <span className="font-bold text-secondary">{text.slice(range.start, range.end)}</span>
      {text.slice(range.end)}
    </>
  )
}