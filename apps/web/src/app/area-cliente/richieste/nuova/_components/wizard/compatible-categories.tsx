'use client'

import type { CategoriaCompatibile } from './types'

const CATEGORY_HELP: Record<string, string> = {
  'impresa-edile': 'Gestione completa del lavoro',
  idraulico: 'Impianti e sanitari',
  piastrellista: 'Rivestimenti e finiture',
  muratore: 'Opere murarie e demolizioni',
  elettricista: 'Impianto elettrico',
  imbianchino: 'Pittura e finiture',
  traslocatore: 'Movimentazione e logistica',
  'ditta-di-traslochi': 'Movimentazione e logistica',
  'ditta-di-sgombero': 'Svuotamento e smaltimento',
  'tecnico-climatizzazione': 'Installazione e collegamenti',
  frigorista: 'Installazione e collegamenti',
  architetto: 'Progetto e pratiche',
  geometra: 'Progetto e pratiche',
  default: 'Intervento professionale specifico',
}

function normalizeCategoryKey(nome: string) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getCategoriaSupportText(nome: string) {
  const key = normalizeCategoryKey(nome)

  if (CATEGORY_HELP[key]) return CATEGORY_HELP[key]
  if (key.includes('impresa-edile')) return CATEGORY_HELP['impresa-edile']
  if (key.includes('idraul')) return CATEGORY_HELP.idraulico
  if (key.includes('piastrell')) return CATEGORY_HELP.piastrellista
  if (key.includes('murat')) return CATEGORY_HELP.muratore
  if (key.includes('elettric')) return CATEGORY_HELP.elettricista
  if (key.includes('imbianch')) return CATEGORY_HELP.imbianchino
  if (key.includes('trasloc')) return CATEGORY_HELP.traslocatore
  if (key.includes('sgomber')) return CATEGORY_HELP['ditta-di-sgombero']
  if (key.includes('climat') || key.includes('frigor')) return CATEGORY_HELP.frigorista
  if (key.includes('architet') || key.includes('geometra')) return CATEGORY_HELP.architetto

  return CATEGORY_HELP.default
}

interface CompatibleCategoriesProps {
  categorieCompatibili: CategoriaCompatibile[]
  selectedCategoriaNome?: string | null
}

export function CompatibleCategories({
  categorieCompatibili,
  selectedCategoriaNome,
}: CompatibleCategoriesProps) {
  const categorieOrdinate = [...categorieCompatibili].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1
    return a.priorita - b.priorita
  })

  if (categorieOrdinate.length === 0 && selectedCategoriaNome) {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-secondary">
          Chi può aiutarti per questo lavoro?
        </label>

        <div className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-sm text-primary">OK</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-secondary">{selectedCategoriaNome}</p>
              <p className="mt-1 text-xs font-medium text-primary">
                Figura professionale derivata dal servizio selezionato
              </p>
            </div>
          </div>
        </div>

        <p className="muted-copy text-xs">
          Riceverai risposte dai professionisti disponibili nella tua zona, in base al servizio
          richiesto.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-secondary">
        Chi può aiutarti per questo lavoro?
      </label>

      <p className="muted-copy text-sm">
        Per questo lavoro possono intervenire più figure professionali. Ti mostriamo le più adatte.
      </p>

      {categorieOrdinate.length > 0 ? (
        <div className="space-y-3">
          {categorieOrdinate.map((categoria) => (
            <div
              key={categoria.id}
              className={`rounded-2xl border px-4 py-3 ${
                categoria.isPrimary
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border bg-muted/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-sm text-primary">OK</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`text-sm text-secondary ${
                        categoria.isPrimary ? 'font-semibold' : 'font-medium'
                      }`}
                    >
                      {categoria.nome}
                    </p>
                    <span className="muted-copy text-xs">-</span>
                    <p className="muted-copy text-xs">
                      {getCategoriaSupportText(categoria.nome)}
                    </p>
                    {categoria.isPrimary && (
                      <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
                        Consigliato
                      </span>
                    )}
                  </div>

                  {categoria.isPrimary && (
                    <p className="mt-1 text-xs font-medium text-primary">
                      Figura principale per questo intervento
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[18px] border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          Non abbiamo ancora trovato categorie compatibili per questo intervento.
        </div>
      )}

      <p className="muted-copy text-xs">
        Riceverai risposte da più professionisti disponibili nella tua zona, in base al tipo di
        lavoro richiesto.
      </p>
    </div>
  )
}