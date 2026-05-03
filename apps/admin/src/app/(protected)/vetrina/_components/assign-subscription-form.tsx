'use client'

import type { FormEvent } from 'react'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, Search, Sparkles, UserPlus, Zap } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@fixpro/ui'
import { trpc } from '@/lib/trpc/client'

type Tier = 'BASE' | 'PLUS' | 'PRO'

type CompanySearchResult = {
  id: string
  ragioneSociale: string
  city: string | null
  province: string | null
}

type SelectedCompany = {
  id: string
  ragioneSociale: string
  city: string | null
}

const TIER_OPTIONS: { value: Tier; label: string; icon: typeof Sparkles }[] = [
  { value: 'BASE', label: 'Vetrina Base', icon: Sparkles },
  { value: 'PLUS', label: 'Vetrina Plus', icon: Zap },
  { value: 'PRO', label: 'Vetrina Pro', icon: Crown },
]

export function AssignSubscriptionForm() {
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<SelectedCompany | null>(null)
  const [tier, setTier] = useState<Tier>('BASE')
  const [months, setMonths] = useState('1')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Ricerca imprese (debounced via input)
  const searchQuery = trpc.admin.companies.list.useQuery(
    { search: search.trim(), status: 'APPROVED' },
    { enabled: search.trim().length >= 2 },
  )

  function handleSearchInput(val: string) {
    setSearch(val)
    setSelectedCompany(null)
    setShowDropdown(true)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {}, 300)
  }

  function selectCompany(c: SelectedCompany) {
    setSelectedCompany(c)
    setSearch(c.ragioneSociale)
    setShowDropdown(false)
  }

  const assign = trpc.showcase.admin.assignSubscription.useMutation({
    onSuccess: () => {
      setError(null)
      setSuccess(true)
      setSearch('')
      setSelectedCompany(null)
      setTier('BASE')
      setMonths('1')
      setTimeout(() => setSuccess(false), 4000)
      router.refresh()
    },
    onError: (err) => setError(err.message),
  })

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!selectedCompany) {
      setError("Seleziona un'impresa")
      return
    }

    assign.mutate({
      companyId: selectedCompany.id,
      tier,
      months: parseInt(months, 10) || 1,
    })
  }

  const results = (searchQuery.data?.slice(0, 8) ?? []) as CompanySearchResult[]

  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 stroke-primary" strokeWidth={1.9} />
          <CardTitle className="text-sm font-medium text-foreground">
            Assegna subscription vetrina
          </CardTitle>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          Assegna manualmente un piano vetrina a un&apos;impresa. Utile per trial, promozioni o
          attivazioni manuali.
        </p>
      </CardHeader>

      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ricerca impresa */}
          <div className="relative space-y-1.5">
            <label className="text-xs font-medium text-foreground">Impresa</label>

            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 stroke-muted-foreground"
                strokeWidth={1.9}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => search.length >= 2 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder="Cerca per ragione sociale…"
                autoComplete="off"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Dropdown risultati */}
            {showDropdown && search.trim().length >= 2 && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-border bg-background shadow-lg">
                {searchQuery.isLoading ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">Ricerca…</div>
                ) : results.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    Nessuna impresa trovata
                  </div>
                ) : (
                  results.map((c: CompanySearchResult) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() =>
                        selectCompany({
                          id: c.id,
                          ragioneSociale: c.ragioneSociale,
                          city: c.city,
                        })
                      }
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {c.ragioneSociale}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[c.city, c.province].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {selectedCompany && (
            <div className="rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">
              Selezionata: <span className="font-semibold">{selectedCompany.ragioneSociale}</span>
            </div>
          )}

          {/* Tier */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Piano</label>

            <div className="grid grid-cols-3 gap-2">
              {TIER_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTier(value)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    tier === value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-background text-foreground hover:border-primary/50'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      tier === value ? 'stroke-primary' : 'stroke-muted-foreground'
                    }`}
                    strokeWidth={1.9}
                  />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Durata */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Durata (mesi)</label>

            <select
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {[1, 2, 3, 6, 12, 24].map((m) => (
                <option key={m} value={m}>
                  {m} {m === 1 ? 'mese' : 'mesi'}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-success">Subscription assegnata con successo.</p>}

          <Button
            type="submit"
            disabled={assign.isPending || !selectedCompany}
            className="w-full gap-1.5 sm:w-auto"
          >
            <UserPlus className="h-4 w-4" strokeWidth={1.9} />
            {assign.isPending ? 'Assegnazione…' : 'Assegna subscription'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}