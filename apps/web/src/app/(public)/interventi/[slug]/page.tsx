import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { DetailedCostItem, MaterialItem } from '../_content'
import {
  getInterventoContentOrNull,
  getInterventoOrNull,
  interventoContentBySlug,
} from '../_content'

const euroFormatter = new Intl.NumberFormat('it-IT')

function formatPriceRange(min: number, max: number) {
  return `${euroFormatter.format(min)} - ${euroFormatter.format(max)} euro`
}

function buildCostGroups(slug: string, costs: DetailedCostItem[]) {

  const fallback = costs.slice(0, 4).map((item) => ({
    label: item.label,
    min: item.min,
    max: item.max,
    note: item.note,
  }))

  if (slug === 'rifacimento-bagno') {
    return [
      {
        label: 'Demolizione',
        min: 300,
        max: 900,
        note: 'Comprende rimozione di sanitari, rivestimenti e smaltimento del materiale di risulta.',
      },
      {
        label: 'Impianti',
        min: 980,
        max: 3150,
        note: 'Qui rientrano impianto idraulico ed elettrico, soprattutto se sposti doccia, wc o lavabo.',
      },
      {
        label: 'Materiali',
        min: 1300,
        max: 4700,
        note: 'Pesano piastrelle, collanti, impermeabilizzazione, sanitari, rubinetteria e box doccia.',
      },
      {
        label: 'Manodopera',
        min: 900,
        max: 2200,
        note: 'Il costo cresce se il bagno e piccolo ma complesso, con molti tagli, nicchie o finiture fuori standard.',
      },
    ]
  }

  if (slug === 'ristrutturazione-appartamento') {
    return [
      {
        label: 'Demolizione',
        min: 1000,
        max: 4000,
        note: 'Smantellamento iniziale, rimozione vecchie finiture e gestione dello smaltimento.',
      },
      {
        label: 'Impianti',
        min: 4000,
        max: 16000,
        note: 'La parte piu variabile del preventivo: elettrico, idraulico e predisposizioni nuove.',
      },
      {
        label: 'Materiali',
        min: 3500,
        max: 20000,
        note: 'Pavimenti, rivestimenti, porte, sanitari e finiture sono la voce che cambia di piu da un capitolato all altro.',
      },
      {
        label: 'Manodopera',
        min: 2500,
        max: 10000,
        note: 'Dipende da durata del cantiere, numero di maestranze e livello di coordinamento richiesto.',
      },
    ]
  }

  if (slug === 'perdita-acqua') {
    return [
      {
        label: 'Demolizione',
        min: 0,
        max: 120,
        note: 'Puoi evitarla se il guasto e visibile. Serve solo quando la perdita e dentro muro o pavimento.',
      },
      {
        label: 'Impianti',
        min: 90,
        max: 320,
        note: 'Include diagnosi, ricerca guasto e riparazione del componente o del tratto di tubazione.',
      },
      {
        label: 'Materiali',
        min: 20,
        max: 120,
        note: 'Raccordi, valvole, sifoni o piccoli ricambi incidono poco, ma vanno considerati.',
      },
      {
        label: 'Manodopera',
        min: 50,
        max: 180,
        note: 'Il tempo tecnico conta molto, soprattutto quando serve una ricerca accurata della perdita.',
      },
    ]
  }

  if (slug === 'tinteggiatura-casa') {
    return [
      {
        label: 'Demolizione',
        min: 0,
        max: 100,
        note: 'Di solito non c e una demolizione vera, ma puo servire rimuovere parti incoerenti o vecchie pellicole.',
      },
      {
        label: 'Impianti',
        min: 0,
        max: 80,
        note: 'In genere si parla piu di protezioni e smontaggio placche che di veri impianti.',
      },
      {
        label: 'Materiali',
        min: 180,
        max: 700,
        note: 'Primer, stucco, pittura e protezioni cambiano molto in base alla qualita scelta.',
      },
      {
        label: 'Manodopera',
        min: 250,
        max: 1100,
        note: 'La preparazione delle pareti spesso pesa piu della pittura stessa sul totale finale.',
      },
    ]
  }

  if (slug === 'installazione-climatizzatore') {
    return [
      {
        label: 'Demolizione',
        min: 0,
        max: 60,
        note: 'Di solito si limita ai fori e alle piccole aperture necessarie per il passaggio degli impianti.',
      },
      {
        label: 'Impianti',
        min: 190,
        max: 600,
        note: 'Collegamenti frigoriferi, linea elettrica e scarico condensa sono la parte tecnica principale.',
      },
      {
        label: 'Materiali',
        min: 80,
        max: 250,
        note: 'Canaline, staffe, rame e accessori incidono soprattutto quando il percorso e lungo o poco lineare.',
      },
      {
        label: 'Manodopera',
        min: 120,
        max: 350,
        note: 'Cresce se la posa e in facciata, in punti scomodi o richiede tempi lunghi di accesso.',
      },
    ]
  }

  if (slug === 'trasloco-appartamento') {
    return [
      {
        label: 'Demolizione',
        min: 0,
        max: 0,
        note: 'Nel trasloco non c e demolizione, ma puo esserci smontaggio di mobili grandi o complessi.',
      },
      {
        label: 'Impianti',
        min: 0,
        max: 0,
        note: 'Non ci sono impianti, quindi il peso economico si concentra su logistica, volume e servizi accessori.',
      },
      {
        label: 'Materiali',
        min: 80,
        max: 450,
        note: 'Scatole, protezioni, pluriball e coperte incidono molto quando hai molti oggetti fragili.',
      },
      {
        label: 'Manodopera',
        min: 300,
        max: 1800,
        note: 'Carico, trasporto, scarico, facchinaggio e rimontaggio sono le voci che determinano quasi tutto il totale.',
      },
    ]
  }

  return fallback
}

function buildDecisionItems(slug: string, materials: MaterialItem[]) {
  return [
    {
      title: 'Materiali',
      text:
        materials[0]?.note ??
        'Conviene decidere in anticipo materiali e finiture, per evitare preventivi vaghi e variazioni in corso d opera.',
    },
    {
      title: 'Layout',
      text:
        slug === 'trasloco-appartamento'
          ? 'Nel trasloco il layout significa sapere dove andranno i mobili una volta arrivati, cosi il lavoro e piu rapido e ordinato.'
          : 'Capire prima disposizione, ingombri e punti critici evita modifiche tardive che fanno perdere tempo e budget.',
    },
    {
      title: 'Tipologia intervento',
      text:
        slug === 'perdita-acqua'
          ? 'Distingui tra guasto visibile, perdita nascosta o emergenza: sono casi diversi e richiedono tempi e costi diversi.'
          : 'Devi chiarire se vuoi un intervento base, completo o con finiture piu alte: e questo che cambia davvero il preventivo.',
    },
  ]
}

export function generateStaticParams() {
  return Object.keys(interventoContentBySlug).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  const intervento = getInterventoOrNull(slug)
  const content = getInterventoContentOrNull(slug)

  if (!intervento || !content) {
    return {}
  }

  const title = `${intervento.nome}: costi, fasi e cosa sapere prima di iniziare`
  const description = `Scopri quanto costa ${intervento.nome.toLowerCase()}, come funziona il lavoro e quali errori evitare. Guida completa con esempi reali e prezzi aggiornati.`

  return {
    title,
    description,
    alternates: {
      canonical: `/interventi/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/interventi/${slug}`,
      type: 'article',
    },
  }
}

export default async function InterventoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const intervento = getInterventoOrNull(slug)
  const content = getInterventoContentOrNull(slug)

  if (!intervento || !content) {
    notFound()
  }

  const pricing = content.price
  const costGroups = buildCostGroups(intervento.slug, content.detailedCosts)
  const examples = content.realExamples
  const steps = content.guideSteps
  const decisionItems = buildDecisionItems(intervento.slug, content.materials)
  const mistakes = content.mistakes
  const faq = content.faq

  return (
    <div className="bg-background">
      <section className="bg-muted py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="max-w-[860px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
              Intervento
            </p>

            <h1 className="mt-3 text-[34px] font-semibold leading-[1.02] tracking-[-0.05em] text-secondary sm:text-[42px] lg:text-[50px]">
              {intervento.nome}: costi, fasi e cosa sapere prima di iniziare
            </h1>

            <p className="mt-4 max-w-[720px] text-[16px] leading-[1.7] text-muted-foreground">
              Una guida unica per capire quanto puoi spendere, come si svolge il lavoro e quali decisioni conviene prendere prima di chiedere un preventivo.
            </p>

            <div className="mt-5 flex flex-wrap gap-4 text-[13px] font-medium">
              <Link href={`/interventi/${intervento.slug}/guida`} className="text-primary transition hover:text-primary/80">
                Guida completa
              </Link>
              <Link href={`/interventi/${intervento.slug}/costo`} className="text-primary transition hover:text-primary/80">
                Vedi costi dettagliati
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-14">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="rounded-[24px] bg-card p-6 shadow-sm ring-1 ring-border/60">
            <p className="text-[14px] leading-7 text-secondary">
              Il costo per {intervento.nome.toLowerCase()} varia tra{' '}
              <span className="font-semibold text-primary">{pricing?.range}</span>
              {pricing?.note ? ` e cambia soprattutto per ${pricing.note.charAt(0).toLowerCase()}${pricing.note.slice(1)}` : '.'}
            </p>
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="max-w-[720px]">
            <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-secondary sm:text-[36px]">
              Come si divide il costo
            </h2>
          </div>

          <div className="mt-8 space-y-4">
            {costGroups.map((item) => (
              <div
                key={item.label}
                className="rounded-[22px] bg-card p-5 shadow-sm ring-1 ring-border/60"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <p className="text-[15px] font-semibold text-secondary">{item.label}</p>
                  <p className="text-[15px] font-semibold text-primary">
                    {formatPriceRange(item.min, item.max)}
                  </p>
                </div>

                <p className="mt-3 text-[13px] leading-6 text-muted-foreground">
                  {item.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="max-w-[720px]">
            <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-secondary sm:text-[36px]">
              Esempi di prezzo reali
            </h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {examples.map((item) => (
              <div
                key={item.title}
                className="rounded-[22px] bg-card p-5 shadow-sm ring-1 ring-border/60"
              >
                <p className="text-[15px] font-semibold text-secondary">{item.title}</p>
                <p className="mt-3 text-[13px] leading-6 text-muted-foreground">
                  {item.description}
                </p>
                <p className="mt-4 text-[18px] font-semibold text-primary">{item.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="max-w-[720px]">
            <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-secondary sm:text-[36px]">
              Come si svolge il lavoro
            </h2>
          </div>

          <div className="mt-8 space-y-5">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[22px] bg-card p-5 shadow-sm ring-1 ring-border/60"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-[760px]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {index + 1}
                      </div>
                      <h3 className="text-[16px] font-semibold text-secondary">{step.title}</h3>
                    </div>

                    <p className="mt-4 text-[14px] leading-7 text-muted-foreground">
                      {step.explanation}
                    </p>
                  </div>

                  <div className="w-full max-w-[340px] rounded-[18px] bg-muted p-4">
                    <p className="text-[13px] font-semibold text-secondary">Attenzione in questa fase</p>
                    <div className="mt-3 space-y-2">
                      {step.errors.map((error) => (
                        <p key={error} className="text-[13px] leading-6 text-muted-foreground">
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="max-w-[720px]">
            <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-secondary sm:text-[36px]">
              Cosa devi decidere prima della richiesta
            </h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {decisionItems.map((item) => (
              <div
                key={item.title}
                className="rounded-[22px] bg-card p-5 shadow-sm ring-1 ring-border/60"
              >
                <p className="text-[15px] font-semibold text-secondary">{item.title}</p>
                <p className="mt-3 text-[13px] leading-6 text-muted-foreground">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="max-w-[720px]">
            <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-secondary sm:text-[36px]">
              Errori comuni da evitare
            </h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {mistakes.map((item) => (
              <div
                key={item}
                className="rounded-[22px] bg-card p-5 shadow-sm ring-1 ring-border/60"
              >
                <p className="text-[14px] leading-7 text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="max-w-[720px]">
            <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-secondary sm:text-[36px]">
              FAQ
            </h2>
          </div>

          <div className="mt-8 space-y-4">
            {faq.map((item) => (
              <div
                key={item.question}
                className="rounded-[22px] bg-card p-5 shadow-sm ring-1 ring-border/60"
              >
                <h3 className="text-[16px] font-semibold text-secondary">{item.question}</h3>
                <p className="mt-3 text-[14px] leading-7 text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="rounded-[28px] bg-card px-6 py-8 text-center shadow-sm ring-1 ring-border/60 sm:px-8 sm:py-10">
            <div className="mx-auto max-w-[720px]">
              <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-secondary sm:text-[36px]">
                Hai gia un quadro chiaro del lavoro
              </h2>

              <p className="mt-4 text-[15px] leading-[1.65] text-muted-foreground">
                Se hai capito costi, fasi e scelte da fare, il prossimo passo utile e inviare una richiesta precisa per ricevere risposte piu adatte.
              </p>

              <div className="mt-6">
                <Link
                  href={`/richiesta?intervento=${intervento.slug}`}
                  className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  Richiedi preventivo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
