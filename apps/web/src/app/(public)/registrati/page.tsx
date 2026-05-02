import { api } from '@/lib/trpc/server'
import { RegistrazioneWizard } from './_components/wizard'

export const metadata = {
  title: 'Registrati',
}

export default async function RegistratiPage() {
  const settori = await api.taxonomy.getSettori()

  const settoriOptions = settori.map((settore) => ({
    id: settore.id,
    nome: settore.nome,
    categorie: settore.categorie.map((categoria) => ({
      id: categoria.id,
      nome: categoria.nome,
      slug: categoria.slug,
      servizi: categoria.servizi.map((servizio) => ({
        id: servizio.id,
        nome: servizio.nome,
      })),
    })),
  }))

  return (
    <main className="relative overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute left-1/2 top-10 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/7 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -right-28 top-44 h-80 w-80 rounded-full bg-emerald-400/7 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1240px] px-5 py-10 sm:px-7 sm:py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-[820px] text-center">
          <div className="mx-auto h-1 w-16 rounded-full bg-primary" />

          <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">
            Inizia da qui
          </p>

          <h1 className="mx-auto mt-3 max-w-[680px] text-[38px] font-semibold leading-[1.02] tracking-[-0.055em] text-secondary sm:text-[46px] lg:text-[54px]">
            Come vuoi usare FixPro?
          </h1>

          <p className="mx-auto mt-5 max-w-[580px] text-[15px] leading-7 text-muted-foreground sm:text-[16px]">
            Scegli il percorso più adatto e completa la registrazione in pochi
            passaggi.
          </p>
        </div>

        <div className="relative mx-auto mt-10 max-w-3xl sm:mt-12">
          <RegistrazioneWizard settori={settoriOptions} />
        </div>
      </div>
    </main>
  )
}