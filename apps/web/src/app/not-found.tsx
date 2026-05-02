import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F6F7FB]">
      <div className="page-container page-section flex min-h-screen items-center justify-center">
        <div className="surface-card w-full max-w-[560px] px-6 py-10 text-center sm:px-8">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
            Errore 404
          </p>
          <h1 className="section-title mt-3 text-secondary">Pagina non trovata</h1>
          <p className="muted-copy mx-auto mt-3 max-w-md text-sm leading-6 sm:text-[15px]">
            La pagina che stai cercando non esiste oppure è stata spostata.
          </p>
          <Link
            href="/"
            className="primary-pill mt-8 px-5 py-3 text-sm font-semibold"
          >
            Torna alla home
          </Link>
        </div>
      </div>
    </div>
  )
}
