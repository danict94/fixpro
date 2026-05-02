export interface ParsedRequestMetaItem {
  label: string
  value: string
}

export interface ParsedRequestDescription {
  meta: ParsedRequestMetaItem[]
  description: string
  hasMeta: boolean
}

function normalizeLineEndings(value: string) {
  return value.replace(/\r\n/g, '\n')
}

function normalizeMetaLabel(label: string) {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function toDisplayLabel(label: string) {
  const normalized = normalizeMetaLabel(label)

  if (normalized === 'mq' || normalized.startsWith('superficie')) {
    return 'Superficie'
  }

  if (normalized.startsWith('quantita')) {
    return 'Quantita'
  }

  return label.trim()
}

export function parseRequestDescription(value: string | null | undefined): ParsedRequestDescription {
  const input = normalizeLineEndings(value ?? '').trim()

  if (!input) {
    return { meta: [], description: '', hasMeta: false }
  }

  const lines = input.split('\n')
  const firstMeaningfulIndex = lines.findIndex((line) => line.trim().length > 0)

  if (firstMeaningfulIndex === -1 || lines[firstMeaningfulIndex]?.trim() !== '[META]') {
    return { meta: [], description: input, hasMeta: false }
  }

  const meta: ParsedRequestMetaItem[] = []
  const descriptionLines: string[] = []
  let inDescription = false

  for (const rawLine of lines.slice(firstMeaningfulIndex + 1)) {
    const line = rawLine.trim()

    if (!inDescription) {
      if (!line) {
        continue
      }

      if (line.toLowerCase().startsWith('descrizione:')) {
        inDescription = true
        const [, remainder = ''] = rawLine.split(/descrizione:/i)
        if (remainder.trim()) {
          descriptionLines.push(remainder.trim())
        }
        continue
      }

      const separatorIndex = rawLine.indexOf(':')

      if (separatorIndex > -1) {
        const label = rawLine.slice(0, separatorIndex).trim()
        const content = rawLine.slice(separatorIndex + 1).trim()

        if (label && content) {
          meta.push({
            label: toDisplayLabel(label),
            value: content,
          })
          continue
        }
      }
    }

    descriptionLines.push(rawLine)
  }

  return {
    meta,
    description: descriptionLines.join('\n').trim(),
    hasMeta: meta.length > 0,
  }
}
