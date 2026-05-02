import { Package } from 'lucide-react'
import { api } from '@/lib/trpc/server'
import { prisma } from '@fixpro/db'
import { CREDIT_PACKAGES } from '@fixpro/shared'
import { Card, CardContent, Badge } from '@fixpro/ui'
import { PackageRowActions } from './_components/package-row-actions'
import { NewPackagePanel } from './_components/new-package-panel'

export const metadata = { title: 'Pacchetti crediti' }

export default async function PacchettiPage() {
  // Seed automatico: se non ci sono pacchetti nel DB, crea i 3 default da shared
  const count = await prisma.creditPackage.count()
  if (count === 0) {
    await prisma.creditPackage.createMany({
      data: CREDIT_PACKAGES.map((p, i) => ({
        name:        p.name,
        credits:     p.credits,
        priceCents:  p.priceCents,
        validityMonths: p.validityMonths,
        description: p.description,
        popular:     p.popular,
        active:      true,
        sortOrder:   i,
      })),
    })
  }

  const packages = await api.admin.packages.list()

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pacchetti crediti</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestisci i pacchetti acquistabili dalle imprese. Solo i pacchetti attivi sono visibili nel checkout.
          </p>
        </div>
      </div>

      {/* Tabella pacchetti */}
      {packages.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ordine</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Crediti</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Prezzo</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Validità</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descrizione</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Stato</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => (
                    <tr key={pkg.id} className={`border-b last:border-0 ${!pkg.active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 text-muted-foreground">{pkg.sortOrder}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{pkg.name}</span>
                          {pkg.popular && (
                            <Badge className="text-xs">Popolare</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{pkg.credits}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">
                        €{(pkg.priceCents / 100).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {pkg.validityMonths} mesi
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{pkg.description ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={pkg.active ? 'outline' : 'secondary'} className="text-xs">
                          {pkg.active ? 'Attivo' : 'Disattivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <PackageRowActions pkg={pkg} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <Package className="mx-auto mb-3 h-8 w-8 stroke-muted-foreground" strokeWidth={1.5} />
          <p className="text-sm font-medium text-muted-foreground">
            Nessun pacchetto creato. Aggiungine uno per consentire agli imprenditori di acquistare crediti.
          </p>
        </div>
      )}

      {/* Form nuovo pacchetto */}
      <NewPackagePanel />

    </div>
  )
}
