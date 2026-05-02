import { homeInterventi } from '@fixpro/shared'

export interface InterventoSummary {
  nome: string
  slug: string
  icon: string
  descrizione: string
  requestSlug?: string
}

export type MacroInterventoGroupIcon =
  | 'bath'
  | 'house'
  | 'hammer'
  | 'droplets'
  | 'truck'
  | 'wrench'
  | 'clipboard'

export interface MacroInterventoGroup {
  slug: string
  title: string
  description: string
  href: string
  icon: MacroInterventoGroupIcon
  interventoSlugs: string[]
  detailInterventoSlugs?: string[]
}

const categoryInterventi = [
  {
    nome: 'Ristrutturazione casa',
    slug: 'ristrutturazione-casa',
    icon: 'house',
    descrizione: 'Lavori completi di casa, muratura, impianti e finiture.',
  },
  {
    nome: 'Rifacimento cucina',
    slug: 'rifacimento-cucina',
    icon: 'house',
    descrizione: 'Rinnovo completo della cucina con impianti, rivestimenti e finiture.',
  },
  {
    nome: 'Tinteggiatura pareti',
    slug: 'tinteggiatura-pareti',
    icon: 'paint',
    descrizione: 'Tinteggiatura di pareti interne con rinnovo colore e finitura.',
  },
  {
    nome: 'Sostituzione sanitari',
    slug: 'sostituzione-sanitari',
    icon: 'bathroom',
    descrizione: 'Sostituzione di wc, bidet o lavabo con nuovi elementi.',
  },
  {
    nome: 'Sostituzione vasca o doccia',
    slug: 'sostituzione-vasca-doccia',
    icon: 'bathroom',
    descrizione: 'Sostituzione di vasca o doccia con eventuali adattamenti locali.',
  },
  {
    nome: 'Posa piastrelle bagno',
    slug: 'posa-piastrelle-bagno',
    icon: 'tile',
    descrizione: 'Posa o sostituzione di piastrelle e rivestimenti nel bagno.',
  },
  {
    nome: 'Riparazione perdita acqua',
    slug: 'riparazione-perdita-acqua',
    icon: 'droplets',
    descrizione: 'Riparazione di perdite da tubazioni, rubinetti, sanitari o collegamenti idraulici.',
  },
  {
    nome: 'Riparazione tetto',
    slug: 'riparazione-tetto',
    icon: 'hammer',
    descrizione: 'Riparazione di infiltrazioni, tegole o parti danneggiate del tetto.',
  },
  {
    nome: 'Sgombero appartamento',
    slug: 'sgombero-appartamento',
    icon: 'truck',
    descrizione: 'Sgombero di appartamento, cantina o locale con ritiro degli ingombranti.',
  },
  {
    nome: 'Progetto ristrutturazione',
    slug: 'progetto-ristrutturazione',
    icon: 'clipboard',
    descrizione: 'Progettazione tecnica e distributiva prima di una ristrutturazione.',
  },
  {
    nome: 'Pratica CILA',
    slug: 'pratica-cila',
    icon: 'clipboard',
    descrizione: 'Gestione della pratica CILA per lavori edilizi di manutenzione straordinaria.',
  },
  {
    nome: 'Pratica SCIA',
    slug: 'pratica-scia',
    icon: 'clipboard',
    descrizione: 'Gestione della pratica SCIA per interventi soggetti a segnalazione certificata.',
  },
] satisfies readonly InterventoSummary[]

const requestSlugAliases: Record<string, string> = {
  'ristrutturazione-appartamento': 'ristrutturazione-casa',
  'tinteggiatura-casa': 'tinteggiatura-pareti',
  'perdita-acqua': 'riparazione-perdita-acqua',
}

export const interventiBySlug: Readonly<Record<string, InterventoSummary>> =
  Object.fromEntries(
    [...homeInterventi, ...categoryInterventi].map((item): [string, InterventoSummary] => [
      item.slug,
      item,
    ]),
  )

export function resolveRequestInterventoSlug(slug: string) {
  return requestSlugAliases[slug] ?? slug
}

export const macroInterventoGroups: readonly MacroInterventoGroup[] = [
  {
    slug: 'bagno',
    title: 'Bagno & Sanitari',
    description: 'Rifacimenti, sanitari, doccia e lavori che riguardano il bagno.',
    href: '/richiesta?macro=bagno',
    icon: 'bath',
    interventoSlugs: [
      'rifacimento-bagno',
      'sostituzione-sanitari',
      'sostituzione-vasca-doccia',
      'posa-piastrelle-bagno',
    ],
    detailInterventoSlugs: [
      'rifacimento-bagno',
      'sostituzione-sanitari',
      'sostituzione-vasca-doccia',
      'installazione-box-doccia',
      'sigillatura-bagno',
      'riparazione-scarico-wc',
      'posa-piastrelle-bagno',
      'sostituzione-rubinetto',
      'scarico-intasato',
      'riparazione-perdita-acqua',
    ],
  },
  {
    slug: 'casa',
    title: 'Costruzione & Ristrutturazione',
    description: 'Ristrutturazioni interne, cucina e tinteggiature per rinnovare gli spazi.',
    href: '/richiesta?macro=casa',
    icon: 'house',
    interventoSlugs: [
      'ristrutturazione-casa',
      'rifacimento-cucina',
      'tinteggiatura-pareti',
    ],
    detailInterventoSlugs: [
      'ristrutturazione-casa',
      'nuova-costruzione-casa',
      'ampliamento-casa',
      'rifacimento-cucina',
      'demolizione-muro',
      'costruzione-tramezzo',
      'apertura-porta-finestra',
      'rinforzo-strutturale',
      'intonaci-e-rasature',
      'tinteggiatura-pareti',
      'posa-pavimento',
      'posa-piastrelle-bagno',
      'cartongesso',
      'controsoffitto',
      'riparazione-muro',
      'riparazione-pavimento',
      'pulizia-fine-cantiere',
    ],
  },
  {
    slug: 'esterni',
    title: 'Esterni',
    description: 'Coperture e infiltrazioni per proteggere tetto, terrazze e parti esposte.',
    href: '/richiesta?macro=esterni',
    icon: 'hammer',
    interventoSlugs: ['riparazione-tetto'],
    detailInterventoSlugs: [
      'rifacimento-tetto',
      'riparazione-tetto',
      'installazione-grondaie',
      'rifacimento-facciata',
      'cappotto-termico',
      'tinteggiatura-facciata',
      'rifacimento-balconi',
      'rifacimento-frontalini-balconi',
      'ripristino-ringhiere-balconi',
      'impermeabilizzazione-terrazzo',
      'rifacimento-terrazzo',
      'sistemazione-giardino',
      'potatura-piante-siepi',
      'installazione-recinzione',
      'riparazione-cancello-automatico',
    ],
  },
  {
    slug: 'impianti',
    title: 'Impianti',
    description: 'Acqua, climatizzazione e interventi tecnici da affidare a figure specializzate.',
    href: '/richiesta?macro=impianti',
    icon: 'droplets',
    interventoSlugs: ['riparazione-perdita-acqua', 'installazione-climatizzatore'],
    detailInterventoSlugs: [
      'rifacimento-impianto-elettrico',
      'rifacimento-impianto-idraulico',
      'installazione-caldaia',
      'installazione-climatizzatore',
      'riparazione-perdita-acqua',
      'scarico-intasato',
      'manutenzione-caldaia',
      'riparazione-caldaia',
      'sostituzione-boiler-scaldacqua',
      'sostituzione-prese-interruttori',
      'messa-a-norma-impianto-elettrico',
      'installazione-quadro-elettrico',
      'installazione-wallbox',
      'sostituzione-rubinetto',
      'riparazione-scarico-wc',
    ],
  },
  {
    slug: 'traslochi',
    title: 'Traslochi',
    description: 'Sgomberi, trasporti e gestione operativa quando devi liberare o spostare casa.',
    href: '/richiesta?macro=traslochi',
    icon: 'truck',
    interventoSlugs: ['sgombero-appartamento', 'trasloco-appartamento'],
    detailInterventoSlugs: [
      'trasloco-appartamento',
      'trasloco-ufficio',
      'sgombero-appartamento',
    ],
  },
  {
    slug: 'manutenzione',
    title: 'Manutenzione',
    description: 'Interventi ricorrenti per ripristinare comfort, ordine e funzionalita in casa.',
    href: '/richiesta?macro=manutenzione',
    icon: 'wrench',
    interventoSlugs: [
      'riparazione-perdita-acqua',
      'tinteggiatura-pareti',
      'installazione-climatizzatore',
    ],
    detailInterventoSlugs: [
      'riparazione-perdita-acqua',
      'scarico-intasato',
      'sostituzione-rubinetto',
      'riparazione-scarico-wc',
      'manutenzione-caldaia',
      'riparazione-caldaia',
      'sostituzione-prese-interruttori',
      'riparazione-muro',
      'riparazione-pavimento',
      'montaggio-mobili',
      'sostituzione-serratura',
      'sostituzione-vetro-rotto',
      'riparazione-cancello-automatico',
      'derattizzazione',
      'disinfestazione-insetti',
      'lavaggio-tappeti-divani',
      'pulizia-fine-cantiere',
    ],
  },
  {
    slug: 'progettazione-pratiche',
    title: 'Progettazione e pratiche',
    description: 'Supporto tecnico per pratiche edilizie, rilievi, progetto e avvio dei lavori.',
    href: '/richiesta?macro=progettazione-pratiche',
    icon: 'clipboard',
    interventoSlugs: ['progetto-ristrutturazione', 'pratica-cila', 'pratica-scia'],
    detailInterventoSlugs: [
      'progetto-ristrutturazione',
      'direzione-lavori',
      'pratica-cila',
      'pratica-scia',
      'certificazione-energetica-ape',
    ],
  },
]

export function getGroupDetailInterventoSlugs(group: MacroInterventoGroup) {
  return group.detailInterventoSlugs ?? group.interventoSlugs
}
