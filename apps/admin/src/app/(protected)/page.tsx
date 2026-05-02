import Link from 'next/link'
import { ArrowRight, Building2, Clock, FileText, LifeBuoy, TrendingUp } from 'lucide-react'
import { api } from '@/lib/trpc/server'
import { Card, CardContent, StatCard } from '@fixpro/ui'

export const metadata = { title: 'Dashboard' }

export default async function AdminDashboardPage() {
  const stats = await api.admin.stats()

  return (
    <div className="page-section space-y-6 lg:space-y-8">
      <section className="surface-section px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[720px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
              Controllo piattaforma
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-secondary">
              Dashboard
            </h1>
            <p className="muted-copy mt-2 text-sm leading-6">
              Panoramica operativa di richieste, imprese e rescue da monitorare nel pannello
              amministrativo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/richieste?status=PENDING" className="secondary-link">
              Richieste in attesa
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Richieste in attesa"
          value={stats.pendingRequests}
          icon={FileText}
          tone="warning"
          className="surface-card border-0"
        />
        <StatCard
          label="Imprese da approvare"
          value={stats.pendingCompanies}
          icon={Building2}
          tone="brand"
          className="surface-card border-0"
        />
        <StatCard
          label="Rescue aperti"
          value={stats.openRescues}
          icon={LifeBuoy}
          tone="danger"
          className="surface-card border-0"
        />
        <StatCard
          label="Richieste oggi"
          value={stats.todayRequests}
          icon={TrendingUp}
          tone="success"
          className="surface-card border-0"
        />
        <StatCard
          label="Questa settimana"
          value={stats.weekRequests}
          icon={Clock}
          tone="muted"
          className="surface-card border-0"
        />
      </section>

      <section className="surface-section px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-secondary">Azioni rapide</h2>
            <p className="muted-copy mt-1 text-sm">
              Apri subito le code principali e raggiungi le sezioni che richiedono moderazione.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="surface-card border-0 shadow-none">
            <CardContent className="p-5">
              <p className="text-base font-semibold text-secondary">Richieste da moderare</p>
              <p className="muted-copy mt-2 text-sm leading-6">
                {stats.pendingRequests} richieste attendono approvazione o rifiuto.
              </p>
              <Link href="/richieste?status=PENDING" className="secondary-link mt-4">
                Vedi tutte
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </CardContent>
          </Card>

          <Card className="surface-card border-0 shadow-none">
            <CardContent className="p-5">
              <p className="text-base font-semibold text-secondary">Nuove imprese</p>
              <p className="muted-copy mt-2 text-sm leading-6">
                {stats.pendingCompanies} imprese sono ancora in attesa di verifica.
              </p>
              <Link href="/imprese?status=PENDING" className="secondary-link mt-4">
                Vedi tutte
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </CardContent>
          </Card>

          <Card className="surface-card border-0 shadow-none">
            <CardContent className="p-5">
              <p className="text-base font-semibold text-secondary">Rescue aperti</p>
              <p className="muted-copy mt-2 text-sm leading-6">
                {stats.openRescues} richieste di rimborso richiedono gestione.
              </p>
              <Link href="/rescue?status=OPEN" className="secondary-link mt-4">
                Vedi tutti
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
