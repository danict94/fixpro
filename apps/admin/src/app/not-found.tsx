import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-foreground">Pagina non trovata</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          La pagina che stai cercando non esiste oppure non è più disponibile.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Torna alla dashboard admin
        </Link>
      </div>
    </div>
  )
}
