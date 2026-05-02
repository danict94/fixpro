import Link from 'next/link';
import { headers } from 'next/headers';
import {
  Bell,
  Plus,
  ArrowRight,
  MapPin,
  CalendarDays,
  MessageSquare,
  CheckCircle,
  Wrench,
} from 'lucide-react';

import { auth } from '@/lib/auth';
import { api } from '@/lib/trpc/server';

// Tipi per richieste e attività
interface RequestItem {
  id: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'FULFILLED' | 'REJECTED' | 'EXPIRED';
  title: string;
  city?: string | null;
  createdAt: string | Date;
  categoria: { nome: string; slug: string };
}

interface ActivityItem {
  type: 'response' | 'status';
  title: string;
  subtitle: string;
}

// Configurazione badge di stato
const STATUS_CONFIG = {
  DRAFT: { label: 'Bozza', cls: 'bg-muted text-muted-foreground' },
  PENDING: { label: 'In attesa', cls: 'bg-warning/10 text-warning' },
  APPROVED: { label: 'Approvata', cls: 'bg-success/10 text-success' },
  FULFILLED: { label: 'Completata', cls: 'bg-success/10 text-success' },
  REJECTED: { label: 'Rifiutata', cls: 'bg-danger/10 text-danger' },
  EXPIRED: { label: 'Scaduta', cls: 'bg-muted text-muted-foreground' },
} as const;

// Categorie principali (slug e label)
const CATEGORIES = [
  { slug: 'bath', label: 'Bagno & Sanitari' },
  { slug: 'house', label: 'Costruzioni & Ristrutturazione' },
  { slug: 'droplets', label: 'Impianti & Riparazioni' },
  { slug: 'truck', label: 'Traslochi & Sgomberi' },
  { slug: 'wrench', label: 'Manutenzione casa' },
  { slug: 'clipboard', label: 'Progettazione tecnica' },
];

export default async function DashboardPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  // Ottieni le ultime richieste dell’utente
  const richieste = await api.requests.list()

  const firstName = session?.user.name?.split(' ')[0] ?? 'Utente';
  const ultimeRichieste = richieste.slice(0, 3);
  const activity = buildActivity(ultimeRichieste);

  return (
    <div className="page-container space-y-6 sm:space-y-8">

      {/* HERO */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-secondary">
            Ciao {firstName} 👋
          </h1>
          <p className="muted-copy text-sm">
            Ecco cosa sta succedendo con le tue richieste.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-10 w-10 rounded-full bg-card shadow-soft flex items-center justify-center">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </button>
          <Link href="/area-cliente/richieste/nuova">
            <button className="btn-primary flex items-center gap-2">
              Invia nuova richiesta
              <Plus className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>

      {/* GRIGLIA PRINCIPALE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLONNA SINISTRA: RICHIESTE + AZIONI */}
        <div className="lg:col-span-2 space-y-6">
          {/* Le tue richieste */}
          <div className="surface-card p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold text-secondary">
                Le tue richieste
              </h2>
              <Link href="/area-cliente/richieste" className="secondary-link">
                Vedi tutte <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-4">
              {ultimeRichieste.map((r: RequestItem) => {
                const cfg = STATUS_CONFIG[r.status];
                return (
                  <div
                    key={r.id}
                    className="rounded-[18px] border border-border bg-card px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  >
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                        <Wrench className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-secondary">{r.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          {r.city ?? '—'}
                          <CalendarDays className="h-3 w-3 ml-2" />
                          {new Date(r.createdAt).toLocaleDateString('it-IT')}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className={`text-xs px-3 py-1 rounded-full ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                      <Link href={`/area-cliente/richieste/${r.id}`}>
                        <span className="text-sm text-primary flex items-center gap-1">
                          Vedi <ArrowRight className="h-3 w-3" />
                        </span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Azioni rapide */}
          <div className="surface-card p-6">
            <h2 className="text-lg font-semibold text-secondary mb-4">
              Azioni rapide
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <QuickAction href="/area-cliente/richieste/nuova" label="Nuova richiesta" />
              <QuickAction href="/area-cliente/richieste" label="Le mie richieste" />
              <QuickAction href="/area-cliente/contatti" label="Messaggi" />
            </div>
          </div>
        </div>

        {/* COLONNA DESTRA: ATTIVITÀ */}
        <div className="space-y-6">
          <div className="surface-card p-6">
            <h2 className="text-lg font-semibold text-secondary mb-4">
              Attività recente
            </h2>
            <div className="space-y-4">
              {activity.length > 0 ? (
                activity.map((a: ActivityItem, i: number) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      {a.type === 'response' ? (
                        <MessageSquare className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-success" />
                      )}
                    </div>
                    <div>
                      <p className="text-secondary">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.subtitle}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nessuna attività recente.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SEZIONI EXTRA: GUIDE COSTI & ESPLORE CATEGORIE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Guida ai costi (FAQ snella) */}
        <section className="text-sm">
          <p className="text-primary text-xs uppercase font-semibold">Guide ai costi</p>
          <p className="text-base font-semibold text-secondary mt-1">
            Non sai quanto può costare il tuo lavoro?
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Consulta le nostre guide prezzi per capire i costi indicativi e cosa incide sul prezzo finale.
          </p>
          <ul className="mt-3 space-y-1">
            <li>
              <Link href="/interventi/ristrutturazione-bagno" className="secondary-link">
                Quanto costa ristrutturare il bagno?
              </Link>
            </li>
            <li>
              <Link href="/interventi/rifacimento-impianto-elettrico" className="secondary-link">
                Quanto costa rifare un impianto elettrico?
              </Link>
            </li>
            <li>
              <Link href="/interventi/riparazione-perdita-acqua" className="secondary-link">
                Quanto costa riparare una perdita d’acqua?
              </Link>
            </li>
          </ul>
          <Link href="/interventi" className="secondary-link inline-flex items-center gap-1 mt-3">
            Scopri tutte le guide
            <ArrowRight className="h-3 w-3" />
          </Link>
        </section>

        {/* Esplora categorie (elenco con barre verticali) */}
        <section className="text-sm">
          <p className="text-primary text-xs uppercase font-semibold">Esplora categorie</p>
          <p className="text-base font-semibold text-secondary mt-1">
            Lavori più richiesti
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 mt-2">
            {CATEGORIES.map((cat, idx) => (
              <span key={cat.slug} className="flex items-center text-sm">
                {idx > 0 && <span className="text-muted-foreground px-1">|</span>}
                <Link href={`/categorie/${cat.slug}`} className="secondary-link">
                  {cat.label}
                </Link>
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* COMPONENTI AUSILIARI */

// Pulsante azione rapida
function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="surface-card p-4 hover:shadow-soft transition text-sm font-medium text-secondary"
    >
      {label}
    </Link>
  );
}

// Costruzione attività (esempio: genera eventi da richieste)
function buildActivity(richieste: RequestItem[]): ActivityItem[] {
  return richieste.slice(0, 3).map((r) => ({
    type: 'status',
    title: 'Richiesta aggiornata',
    subtitle: r.title,
  }));
}