/**
 * Seed tassonomia ufficiale FixPro + piani vetrina + admin iniziale.
 *
 * Modello mantenuto:
 * - Settore   = macro-area
 * - Categoria = mestiere/professione
 * - Servizio  = capacità/offerta dichiarabile dall'impresa
 * - Intervento = bisogno espresso dal cliente
 * - MatchingInterventoCat / MatchingInterventoServizio = ponte controllato domanda/offerta
 *
 * Requisiti schema consigliati:
 * - Settore.attivo Boolean @default(true)
 * - Categoria.attivo Boolean @default(true)
 * - Servizio.attivo Boolean @default(true)
 * - Intervento.attivo Boolean @default(true)
 * - MatchingInterventoCat.attivo Boolean @default(true)
 * - MatchingInterventoServizio.attivo Boolean @default(true)
 *
 * Admin: creato via ADMIN_EMAIL da env. Password gestita solo da Better Auth.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function servizioSlug(categoriaSlug: string, servizioNome: string): string {
  return `${categoriaSlug}-${toSlug(servizioNome)}`
}

function assertUnique(values: string[], label: string): void {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }

  if (duplicates.size > 0) {
    throw new Error(`${label} duplicati: ${Array.from(duplicates).join(', ')}`)
  }
}

function assertOnePrimary(interventoSlug: string, categorie: InterventoCategoriaSeed[]): void {
  const primary = categorie.filter((categoria) => categoria.isPrimary)
  if (primary.length !== 1) {
    throw new Error(
      `Intervento '${interventoSlug}' deve avere esattamente una categoria primary; trovate ${primary.length}`,
    )
  }
}

type CategoriaSeed = {
  nome: string
  slug: string
  descrizione: string
  alias: string[]
  searchTerms: string[]
  servizi: string[]
}

type SettoreSeed = {
  nome: string
  slug: string
  descrizione: string
  fase: 'CORE' | 'ADJACENT'
  ordine: number
  categorie: CategoriaSeed[]
}

type InterventoCategoriaSeed = {
  slug: string
  isPrimary: boolean
  priorita: number
}

type InterventoServizioSeed = {
  catSlug: string
  nome: string
}

type InterventoSeed = {
  nome: string
  slug: string
  descrizione: string
  alias: string[]
  searchTerms: string[]
  ordine: number
  categorie: InterventoCategoriaSeed[]
  servizi: InterventoServizioSeed[]
}

const taxonomy: SettoreSeed[] = [
  {
    nome: 'Edilizia e ristrutturazioni',
    slug: 'edilizia-e-ristrutturazioni',
    descrizione:
      'Lavori edili, ristrutturazioni complete e parziali, muratura, cappotti e interventi strutturali.',
    fase: 'CORE',
    ordine: 1,
    categorie: [
      {
        nome: 'Impresa edile',
        slug: 'impresa-edile',
        descrizione:
          'Impresa che esegue ristrutturazioni complete, lavori edili, facciate, cappotti e interventi strutturali.',
        alias: ['impresa ristrutturazioni', 'impresa costruzioni', 'ditta edile', 'ditta ristrutturazioni'],
        searchTerms: [
          'impresa edile',
          'ristrutturazioni',
          'ditta ristrutturazioni',
          'lavori edili',
          'impresa costruzioni',
          'ristrutturazione casa',
          'facciata',
          'cappotto termico',
        ],
        servizi: [
          'Ristrutturazione appartamento',
          'Ristrutturazione bagno',
          'Ristrutturazione cucina',
          'Rifacimento balconi',
          'Rifacimento facciata',
          'Demolizioni e rimozioni',
          'Costruzione muri e tramezze',
          'Rifacimento solaio',
          'Cappotto termico',
          'Intonaci e rasature',
          'Impermeabilizzazione facciata',
        ],
      },
      {
        nome: 'Muratore',
        slug: 'muratore',
        descrizione: 'Specialista in piccola e media muratura, riparazioni e interventi puntuali in opera.',
        alias: ['muratore edile', 'manutenzione muratura'],
        searchTerms: ['muratore', 'muratura', 'piccola muratura', 'riparazione muri', 'muro', 'crepe muro'],
        servizi: [
          'Piccola muratura',
          'Riparazione crepe e lesioni',
          'Intonaci esterni',
          'Rasatura facciata',
          'Ripristino frontalini',
          'Chiusura aperture',
          'Posa mattoni e blocchi',
        ],
      },
    ],
  },
  {
    nome: 'Impianti',
    slug: 'impianti',
    descrizione: 'Installazione, riparazione e manutenzione di impianti idraulici, elettrici, termici e climatici.',
    fase: 'CORE',
    ordine: 2,
    categorie: [
      {
        nome: 'Idraulico',
        slug: 'idraulico',
        descrizione: 'Specialista in impianti idraulici, riparazioni perdite, sanitari e scarichi.',
        alias: ['idraulico-termoidraulico', 'impiantista idraulico'],
        searchTerms: [
          'idraulico',
          'perdita acqua',
          'perdita idrica',
          'rubinetto',
          'sanitari',
          'scarico intasato',
          'impianto idraulico',
          'scaldacqua',
          'boiler',
        ],
        servizi: [
          'Sostituzione rubinetto',
          'Riparazione perdita acqua',
          'Installazione sanitari',
          'Sostituzione boiler o scaldacqua',
          'Installazione impianto idraulico',
          'Scarichi intasati',
          'Installazione lavatrice o lavastoviglie',
        ],
      },
      {
        nome: 'Elettricista',
        slug: 'elettricista',
        descrizione: 'Installazione e manutenzione impianti elettrici civili e industriali, messa a norma.',
        alias: ['impiantista elettrico', 'tecnico elettrico'],
        searchTerms: [
          'elettricista',
          'impianto elettrico',
          'presa elettrica',
          'quadro elettrico',
          'messa a norma',
          'wallbox',
          'punti luce',
        ],
        servizi: [
          'Sostituzione prese e interruttori',
          'Installazione impianto elettrico',
          'Messa a norma impianto',
          'Installazione quadro elettrico',
          'Installazione punti luce',
          'Caricatore auto elettrica (wallbox)',
        ],
      },
      {
        nome: 'Termoidraulico',
        slug: 'termoidraulico',
        descrizione: 'Installazione e manutenzione caldaie, riscaldamento, pompe di calore e climatizzatori.',
        alias: ['termotecnico', 'impiantista termico', 'tecnico caldaie', 'tecnico climatizzatori'],
        searchTerms: [
          'termoidraulico',
          'caldaia',
          'riscaldamento',
          'climatizzatore',
          'condizionatore',
          'pompa di calore',
          'radiatori',
        ],
        servizi: [
          'Installazione caldaia',
          'Manutenzione caldaia',
          'Riparazione caldaia',
          'Sostituzione radiatori',
          'Installazione pompa di calore',
          'Installazione riscaldamento a pavimento',
          'Installazione climatizzatore',
          'Manutenzione climatizzatore',
        ],
      },
      {
        nome: 'Antennista',
        slug: 'antennista',
        descrizione: 'Installazione e riparazione impianti antenna TV, satellitare e sistemi di ricezione.',
        alias: ['tecnico antenna', 'impiantista TV'],
        searchTerms: ['antennista', 'antenna TV', 'satellite', 'decoder', 'impianto televisivo'],
        servizi: ['Installazione antenna TV', 'Installazione antenna satellitare', 'Riparazione impianto TV'],
      },
    ],
  },
  {
    nome: 'Finiture e interni',
    slug: 'finiture-e-interni',
    descrizione: 'Tinteggiatura, pavimentazione, piastrelle, falegnameria, vetri e infissi per interni.',
    fase: 'CORE',
    ordine: 3,
    categorie: [
      {
        nome: 'Imbianchino',
        slug: 'imbianchino',
        descrizione: 'Tinteggiatura pareti e soffitti, trattamenti decorativi e rivestimenti pittorici.',
        alias: ['pittore', 'tinteggiatore', 'verniciatore interni'],
        searchTerms: ['imbianchino', 'tinteggiatura', 'imbiancare', 'pittura interni', 'verniciare pareti'],
        servizi: [
          'Tinteggiatura pareti interne',
          'Tinteggiatura soffitti',
          'Tinteggiatura facciata',
          'Decorazione pareti',
          'Applicazione carta da parati',
        ],
      },
      {
        nome: 'Pavimentista',
        slug: 'pavimentista',
        descrizione: 'Posa e riparazione pavimenti in gres, parquet, resina e materiali lapidei.',
        alias: ['posatore pavimenti', 'tecnico pavimentazioni'],
        searchTerms: ['pavimentista', 'posa pavimento', 'parquet', 'gres', 'resina', 'pavimento'],
        servizi: [
          'Posa pavimento in gres',
          'Posa parquet',
          'Posa pavimento in resina',
          'Riparazione pavimento',
          'Levigatura parquet',
          'Posa pavimento esterno',
        ],
      },
      {
        nome: 'Piastrellista',
        slug: 'piastrellista',
        descrizione: 'Posa rivestimenti e piastrelle per bagno, cucina e ambienti umidi.',
        alias: ['posatore piastrelle', 'rivestimentista'],
        searchTerms: ['piastrellista', 'piastrelle', 'rivestimento bagno', 'rivestimento cucina', 'fughe'],
        servizi: ['Posa piastrelle bagno', 'Posa piastrelle cucina', 'Riparazione fughe e piastrelle'],
      },
      {
        nome: 'Falegname',
        slug: 'falegname',
        descrizione: 'Lavorazione del legno, porte, mobili su misura e serramenti in legno.',
        alias: ['ebanista', 'mobiliere', 'carpentiere legno'],
        searchTerms: ['falegname', 'porta interna', 'mobili su misura', 'armadio', 'infissi legno'],
        servizi: [
          'Installazione porte interne',
          'Riparazione mobili',
          'Realizzazione mobili su misura',
          'Installazione armadio a muro',
        ],
      },
      {
        nome: 'Serramentista e vetraio',
        slug: 'serramentista-vetraio',
        descrizione: 'Sostituzione vetri, installazione finestre, infissi e serramenti vetrati.',
        alias: ['vetraio', 'tecnico infissi', 'serramentista'],
        searchTerms: ['vetraio', 'vetro rotto', 'finestre', 'infissi', 'doppio vetro', 'serramenti'],
        servizi: [
          'Sostituzione vetro rotto',
          'Installazione finestre',
          'Installazione infissi',
          'Sostituzione vetrocamera',
        ],
      },
    ],
  },
  {
    nome: 'Esterni e pertinenze',
    slug: 'esterni-e-pertinenze',
    descrizione: "Coperture, giardini, recinzioni e lavori esterni all'abitazione.",
    fase: 'CORE',
    ordine: 4,
    categorie: [
      {
        nome: 'Impresa coperture',
        slug: 'impresa-coperture',
        descrizione: 'Rifacimento e riparazione tetti, terrazzi, grondaie e impermeabilizzazioni.',
        alias: ['copritetto', 'impresa tetti', 'impresa impermeabilizzazioni'],
        searchTerms: ['coperture', 'tetto', 'rifacimento tetto', 'riparazione tetto', 'terrazza', 'infiltrazione'],
        servizi: [
          'Rifacimento tetto',
          'Riparazione tetto',
          'Installazione grondaie',
          'Impermeabilizzazione terrazzo',
          'Rifacimento terrazza',
        ],
      },
      {
        nome: 'Giardiniere',
        slug: 'giardiniere',
        descrizione: 'Manutenzione, progettazione e cura di giardini privati e aree verdi.',
        alias: ['giardinaggio', 'manutentore verde', 'paesaggista'],
        searchTerms: ['giardiniere', 'giardino', 'potatura', 'siepe', 'erba', 'irrigazione', 'prato'],
        servizi: [
          'Potatura piante e siepi',
          'Manutenzione giardino',
          'Progettazione giardino',
          'Rimozione alberi',
          'Irrigazione automatica',
        ],
      },
      {
        nome: 'Fabbro',
        slug: 'fabbro',
        descrizione: 'Lavorazione del ferro, serrature, cancelli, inferriate, recinzioni e automazioni.',
        alias: ['carpentiere ferro', 'tecnico automazioni cancello', 'serrature'],
        searchTerms: ['fabbro', 'cancello', 'inferriate', 'recinzione', 'cancello automatico', 'serratura'],
        servizi: [
          'Sostituzione serratura',
          'Installazione cancello',
          'Installazione inferriate',
          'Riparazione cancello automatico',
          'Installazione recinzione',
        ],
      },
    ],
  },
  {
    nome: 'Manutenzione rapida',
    slug: 'manutenzione-rapida',
    descrizione: 'Piccole riparazioni domestiche, disinfestazione, pulizie professionali e interventi veloci.',
    fase: 'CORE',
    ordine: 5,
    categorie: [
      {
        nome: 'Tuttofare',
        slug: 'tuttofare',
        descrizione: 'Piccole riparazioni domestiche, montaggi e interventi di manutenzione ordinaria.',
        alias: ['factotum', 'manutentore domestico', 'handyman'],
        searchTerms: ['tuttofare', 'handyman', 'piccole riparazioni', 'montaggio mobili', 'IKEA', 'mensola'],
        servizi: [
          'Montaggio mobili IKEA',
          'Appendere quadri e mensole',
          'Piccole riparazioni domestiche',
          'Sigillatura e stuccatura',
          'Sostituzione lampadine e plafoniere',
        ],
      },
      {
        nome: 'Disinfestatore',
        slug: 'disinfestatore',
        descrizione: 'Trattamenti professionali contro insetti, roditori e parassiti.',
        alias: ['derattizzatore', 'tecnico disinfestazione'],
        searchTerms: ['disinfestatore', 'disinfestazione', 'topi', 'blatte', 'formiche', 'zanzare', 'roditori'],
        servizi: ['Disinfestazione insetti', 'Derattizzazione', 'Trattamento tarme'],
      },
      {
        nome: 'Pulitore professionale',
        slug: 'pulitore-professionale',
        descrizione: 'Pulizie straordinarie, fine cantiere, lavaggio tappeti, divani, vetri e facciate.',
        alias: ['addetto pulizie', 'impresa pulizie', 'impresa di pulizia'],
        searchTerms: ['pulizie professionali', 'pulizia appartamento', 'pulizia fine cantiere', 'tappeti', 'divano'],
        servizi: [
          'Pulizia fine cantiere',
          'Pulizia straordinaria appartamento',
          'Lavaggio tappeti e divani',
          'Pulizia vetri e facciate',
        ],
      },
    ],
  },
  {
    nome: 'Progettazione tecnica',
    slug: 'progettazione-tecnica',
    descrizione: 'Progettazione, pratiche edilizie, perizie e direzione lavori.',
    fase: 'ADJACENT',
    ordine: 6,
    categorie: [
      {
        nome: 'Geometra',
        slug: 'geometra',
        descrizione: 'Pratiche catastali, rilievi metrici, perizie e direzione lavori.',
        alias: ['tecnico geometra', 'consulente pratiche edilizie'],
        searchTerms: ['geometra', 'pratica catastale', 'CILA', 'CILAS', 'SCIA', 'rilievo', 'perizia immobiliare'],
        servizi: [
          'Pratica catastale',
          'Rilievo metrico',
          'Perizia immobiliare',
          'Direzione lavori',
          'Pratica CILA',
          'Pratica SCIA',
          'Pratica CILAS',
        ],
      },
      {
        nome: 'Architetto',
        slug: 'architetto',
        descrizione: 'Progettazione architettonica, ristrutturazioni, interior design e pratiche urbanistiche.',
        alias: ['studio architettura', 'progettista'],
        searchTerms: ['architetto', 'progetto ristrutturazione', 'interior design', 'permesso costruire'],
        servizi: ['Progetto ristrutturazione', 'Interior design', 'Progetto ampliamento', 'Permesso di costruire'],
      },
      {
        nome: 'Ingegnere',
        slug: 'ingegnere',
        descrizione: 'Perizie strutturali, certificazioni energetiche, progettazione impianti e relazioni tecniche.',
        alias: ['ingegnere civile', 'ingegnere strutturale', 'perito industriale'],
        searchTerms: ['ingegnere', 'perizia strutturale', 'APE', 'certificazione energetica', 'sismica'],
        servizi: [
          'Perizia strutturale',
          'Certificazione energetica (APE)',
          'Progetto impianti',
          'Relazione tecnica sismica',
        ],
      },
    ],
  },
  {
    nome: 'Interior e valorizzazione casa',
    slug: 'interior-e-valorizzazione-casa',
    descrizione: 'Consulenza arredamento, home staging e valorizzazione estetica degli spazi.',
    fase: 'ADJACENT',
    ordine: 7,
    categorie: [
      {
        nome: 'Interior designer',
        slug: 'interior-designer',
        descrizione: 'Consulenza e progettazione degli spazi interni, arredamento e home staging.',
        alias: ['decoratore interni', 'consulente arredamento'],
        searchTerms: ['interior designer', 'arredamento', 'home staging', 'illuminazione', 'restyling casa'],
        servizi: ['Consulenza arredamento', 'Home staging', 'Progetto illuminazione', 'Scelta materiali e finiture'],
      },
    ],
  },
  {
    nome: 'Traslochi e sgomberi',
    slug: 'traslochi-e-sgomberi',
    descrizione: 'Traslochi residenziali e commerciali, sgomberi e smaltimento mobili.',
    fase: 'ADJACENT',
    ordine: 8,
    categorie: [
      {
        nome: 'Traslocatore',
        slug: 'traslocatore',
        descrizione: 'Traslochi appartamenti e uffici, sgomberi, smontaggio e rimontaggio mobili.',
        alias: ['impresa traslochi', 'azienda traslochi', 'sgomberi'],
        searchTerms: ['traslocatore', 'trasloco', 'sgombero', 'smontaggio mobili', 'imballaggio'],
        servizi: [
          'Trasloco appartamento',
          'Trasloco ufficio',
          'Sgombero appartamento',
          'Smaltimento mobili',
          'Montaggio e smontaggio mobili',
        ],
      },
    ],
  },
]

const interventiData: InterventoSeed[] = [
  {
    nome: 'Ristrutturazione casa',
    slug: 'ristrutturazione-casa',
    descrizione: 'Ristrutturazione completa o estesa della casa con più lavorazioni coordinate.',
    alias: ['rifare casa', 'ristrutturare casa', 'ristrutturazione completa casa'],
    searchTerms: ['ristrutturazione casa', 'rifare casa', 'lavori casa completi', 'ristrutturare abitazione'],
    ordine: 1,
    categorie: [
      { slug: 'impresa-edile', isPrimary: true, priorita: 1 },
      { slug: 'idraulico', isPrimary: false, priorita: 2 },
      { slug: 'elettricista', isPrimary: false, priorita: 3 },
      { slug: 'imbianchino', isPrimary: false, priorita: 4 },
      { slug: 'pavimentista', isPrimary: false, priorita: 5 },
    ],
    servizi: [
      { catSlug: 'impresa-edile', nome: 'Ristrutturazione appartamento' },
      { catSlug: 'impresa-edile', nome: 'Demolizioni e rimozioni' },
      { catSlug: 'idraulico', nome: 'Installazione impianto idraulico' },
      { catSlug: 'elettricista', nome: 'Installazione impianto elettrico' },
      { catSlug: 'imbianchino', nome: 'Tinteggiatura pareti interne' },
    ],
  },
  {
    nome: 'Nuova costruzione casa',
    slug: 'nuova-costruzione-casa',
    descrizione: 'Realizzazione di una nuova casa con opere edili, progettuali e tecniche coordinate.',
    alias: ['costruire casa', 'casa nuova', 'nuova abitazione'],
    searchTerms: ['nuova costruzione casa', 'costruire casa', 'nuova abitazione', 'edificazione casa'],
    ordine: 2,
    categorie: [
      { slug: 'impresa-edile', isPrimary: true, priorita: 1 },
      { slug: 'architetto', isPrimary: false, priorita: 2 },
      { slug: 'geometra', isPrimary: false, priorita: 3 },
      { slug: 'ingegnere', isPrimary: false, priorita: 4 },
    ],
    servizi: [
      { catSlug: 'impresa-edile', nome: 'Costruzione muri e tramezze' },
      { catSlug: 'impresa-edile', nome: 'Rifacimento solaio' },
      { catSlug: 'architetto', nome: 'Progetto ampliamento' },
      { catSlug: 'geometra', nome: 'Direzione lavori' },
    ],
  },
  {
    nome: 'Ampliamento casa',
    slug: 'ampliamento-casa',
    descrizione: 'Ampliamento di una casa esistente con nuove superfici e opere murarie.',
    alias: ['allargare casa', 'aggiungere stanza', 'estensione casa'],
    searchTerms: ['ampliamento casa', 'allargare casa', 'estensione abitazione', 'nuova stanza casa'],
    ordine: 3,
    categorie: [
      { slug: 'impresa-edile', isPrimary: true, priorita: 1 },
      { slug: 'architetto', isPrimary: false, priorita: 2 },
      { slug: 'geometra', isPrimary: false, priorita: 3 },
    ],
    servizi: [
      { catSlug: 'architetto', nome: 'Progetto ampliamento' },
      { catSlug: 'impresa-edile', nome: 'Costruzione muri e tramezze' },
      { catSlug: 'geometra', nome: 'Direzione lavori' },
    ],
  },
  {
    nome: 'Rifacimento bagno',
    slug: 'rifacimento-bagno',
    descrizione: 'Rifacimento completo del bagno con demolizioni, impianti, rivestimenti e sanitari.',
    alias: ['ristrutturazione bagno', 'bagno nuovo', 'rifare bagno'],
    searchTerms: ['rifacimento bagno', 'ristrutturazione bagno', 'bagno nuovo', 'rifare bagno', 'bagno da rifare'],
    ordine: 4,
    categorie: [
      { slug: 'impresa-edile', isPrimary: true, priorita: 1 },
      { slug: 'idraulico', isPrimary: false, priorita: 2 },
      { slug: 'piastrellista', isPrimary: false, priorita: 3 },
      { slug: 'elettricista', isPrimary: false, priorita: 4 },
    ],
    servizi: [
      { catSlug: 'impresa-edile', nome: 'Ristrutturazione bagno' },
      { catSlug: 'impresa-edile', nome: 'Demolizioni e rimozioni' },
      { catSlug: 'idraulico', nome: 'Installazione sanitari' },
      { catSlug: 'piastrellista', nome: 'Posa piastrelle bagno' },
      { catSlug: 'elettricista', nome: 'Installazione punti luce' },
    ],
  },
  {
    nome: 'Sostituzione sanitari',
    slug: 'sostituzione-sanitari',
    descrizione: 'Sostituzione di wc, bidet o lavabo con nuovi elementi.',
    alias: ['cambio sanitari', 'cambiare wc', 'cambio lavabo'],
    searchTerms: ['sostituzione sanitari', 'cambio sanitari', 'cambio wc', 'cambio lavabo', 'sostituire bidet'],
    ordine: 5,
    categorie: [
      { slug: 'idraulico', isPrimary: true, priorita: 1 },
      { slug: 'termoidraulico', isPrimary: false, priorita: 2 },
    ],
    servizi: [{ catSlug: 'idraulico', nome: 'Installazione sanitari' }],
  },
  {
    nome: 'Sostituzione vasca o doccia',
    slug: 'sostituzione-vasca-doccia',
    descrizione: 'Sostituzione di una vasca o di una doccia con eventuali adattamenti locali.',
    alias: ['cambio vasca', 'cambio doccia', 'vasca a doccia'],
    searchTerms: ['sostituzione vasca o doccia', 'sostituzione doccia', 'sostituzione vasca', 'vasca a doccia'],
    ordine: 6,
    categorie: [
      { slug: 'idraulico', isPrimary: true, priorita: 1 },
      { slug: 'impresa-edile', isPrimary: false, priorita: 2 },
      { slug: 'termoidraulico', isPrimary: false, priorita: 3 },
    ],
    servizi: [
      { catSlug: 'idraulico', nome: 'Installazione sanitari' },
      { catSlug: 'impresa-edile', nome: 'Demolizioni e rimozioni' },
    ],
  },
  {
    nome: 'Installazione box doccia',
    slug: 'installazione-box-doccia',
    descrizione: 'Installazione o sostituzione del box doccia con adattamenti locali.',
    alias: ['montaggio box doccia', 'box doccia nuovo', 'sostituzione box doccia'],
    searchTerms: ['installazione box doccia', 'montaggio box doccia', 'box doccia nuovo'],
    ordine: 7,
    categorie: [
      { slug: 'idraulico', isPrimary: true, priorita: 1 },
      { slug: 'tuttofare', isPrimary: false, priorita: 2 },
    ],
    servizi: [
      { catSlug: 'idraulico', nome: 'Installazione sanitari' },
      { catSlug: 'tuttofare', nome: 'Sigillatura e stuccatura' },
    ],
  },
  {
    nome: 'Sigillatura bagno',
    slug: 'sigillatura-bagno',
    descrizione: 'Sigillatura o rifacimento silicone per sanitari, vasca e doccia.',
    alias: ['silicone bagno', 'rifare silicone bagno', 'sigillare doccia'],
    searchTerms: ['sigillatura bagno', 'silicone bagno', 'rifare silicone bagno', 'sigillare doccia'],
    ordine: 8,
    categorie: [
      { slug: 'tuttofare', isPrimary: true, priorita: 1 },
      { slug: 'idraulico', isPrimary: false, priorita: 2 },
    ],
    servizi: [{ catSlug: 'tuttofare', nome: 'Sigillatura e stuccatura' }],
  },
  {
    nome: 'Riparazione scarico wc',
    slug: 'riparazione-scarico-wc',
    descrizione: 'Riparazione di scarico wc otturato, lento o malfunzionante.',
    alias: ['scarico wc otturato', 'wc che non scarica', 'riparazione scarico bagno'],
    searchTerms: ['riparazione scarico wc', 'scarico wc otturato', 'wc che non scarica', 'scarico bagno lento'],
    ordine: 9,
    categorie: [
      { slug: 'idraulico', isPrimary: true, priorita: 1 },
      { slug: 'termoidraulico', isPrimary: false, priorita: 2 },
    ],
    servizi: [
      { catSlug: 'idraulico', nome: 'Scarichi intasati' },
      { catSlug: 'idraulico', nome: 'Riparazione perdita acqua' },
    ],
  },
  {
    nome: 'Rifacimento cucina',
    slug: 'rifacimento-cucina',
    descrizione: 'Rifacimento completo della cucina con impianti, rivestimenti e finiture.',
    alias: ['ristrutturazione cucina', 'cucina nuova', 'rifare cucina'],
    searchTerms: ['rifacimento cucina', 'ristrutturazione cucina', 'cucina nuova', 'rifare cucina'],
    ordine: 10,
    categorie: [
      { slug: 'impresa-edile', isPrimary: true, priorita: 1 },
      { slug: 'idraulico', isPrimary: false, priorita: 2 },
      { slug: 'elettricista', isPrimary: false, priorita: 3 },
      { slug: 'piastrellista', isPrimary: false, priorita: 4 },
    ],
    servizi: [
      { catSlug: 'impresa-edile', nome: 'Ristrutturazione cucina' },
      { catSlug: 'impresa-edile', nome: 'Demolizioni e rimozioni' },
      { catSlug: 'idraulico', nome: 'Installazione lavatrice o lavastoviglie' },
      { catSlug: 'elettricista', nome: 'Sostituzione prese e interruttori' },
      { catSlug: 'piastrellista', nome: 'Posa piastrelle cucina' },
    ],
  },
  {
    nome: 'Demolizione muro',
    slug: 'demolizione-muro',
    descrizione: 'Demolizione di muri o tramezzi per apertura spazi e ridistribuzione interna.',
    alias: ['abbattere muro', 'demolire parete', 'rimozione tramezzo'],
    searchTerms: ['demolizione muro', 'abbattere muro', 'demolire parete', 'rimozione tramezzo'],
    ordine: 11,
    categorie: [
      { slug: 'impresa-edile', isPrimary: true, priorita: 1 },
      { slug: 'muratore', isPrimary: false, priorita: 2 },
    ],
    servizi: [
      { catSlug: 'impresa-edile', nome: 'Demolizioni e rimozioni' },
      { catSlug: 'muratore', nome: 'Chiusura aperture' },
    ],
  },
  {
    nome: 'Costruzione tramezzo',
    slug: 'costruzione-tramezzo',
    descrizione: 'Costruzione di un nuovo tramezzo o parete divisoria interna.',
    alias: ['realizzazione tramezzo', 'fare tramezzo', 'nuova parete interna'],
    searchTerms: ['costruzione tramezzo', 'realizzazione tramezzo', 'fare tramezzo', 'parete divisoria casa'],
    ordine: 12,
    categorie: [
      { slug: 'impresa-edile', isPrimary: true, priorita: 1 },
      { slug: 'muratore', isPrimary: false, priorita: 2 },
    ],
    servizi: [
      { catSlug: 'impresa-edile', nome: 'Costruzione muri e tramezze' },
      { catSlug: 'muratore', nome: 'Posa mattoni e blocchi' },
    ],
  },
  {
    nome: 'Apertura porta o finestra',
    slug: 'apertura-porta-finestra',
    descrizione: 'Apertura o modifica di un vano per porta o finestra in muratura.',
    alias: ['aprire porta muro', 'aprire finestra muro', 'nuova apertura muro'],
    searchTerms: ['apertura porta o finestra', 'aprire porta muro', 'aprire finestra muro', 'nuova apertura parete'],
    ordine: 13,
    categorie: [
      { slug: 'impresa-edile', isPrimary: true, priorita: 1 },
      { slug: 'muratore', isPrimary: false, priorita: 2 },
    ],
    servizi: [
      { catSlug: 'impresa-edile', nome: 'Demolizioni e rimozioni' },
      { catSlug: 'muratore', nome: 'Chiusura aperture' },
    ],
  },
  {
    nome: 'Rinforzo strutturale',
    slug: 'rinforzo-strutturale',
    descrizione: 'Rinforzo di elementi strutturali con verifica tecnica e opere di consolidamento.',
    alias: ['consolidamento strutturale', 'messa in sicurezza struttura', 'rinforzare struttura'],
    searchTerms: ['rinforzo strutturale', 'consolidamento strutturale', 'messa in sicurezza struttura'],
    ordine: 14,
    categorie: [
      { slug: 'impresa-edile', isPrimary: true, priorita: 1 },
      { slug: 'ingegnere', isPrimary: false, priorita: 2 },
    ],
    servizi: [
      { catSlug: 'impresa-edile', nome: 'Rifacimento solaio' },
      { catSlug: 'ingegnere', nome: 'Perizia strutturale' },
    ],
  },
  {
    nome: 'Rifacimento impianto elettrico',
    slug: 'rifacimento-impianto-elettrico',
    descrizione: "Rifacimento completo o parziale dell'impianto elettrico domestico.",
    alias: ['rifare impianto elettrico', 'impianto elettrico nuovo', 'rifacimento elettrico casa'],
    searchTerms: ['rifacimento impianto elettrico', 'rifare impianto elettrico', 'impianto elettrico nuovo'],
    ordine: 15,
    categorie: [{ slug: 'elettricista', isPrimary: true, priorita: 1 }],
    servizi: [
      { catSlug: 'elettricista', nome: 'Installazione impianto elettrico' },
      { catSlug: 'elettricista', nome: 'Messa a norma impianto' },
    ],
  },
  {
    nome: 'Rifacimento impianto idraulico',
    slug: 'rifacimento-impianto-idraulico',
    descrizione: "Rifacimento completo o parziale dell'impianto idraulico con carichi e scarichi.",
    alias: ['rifare impianto idraulico', 'impianto idraulico nuovo', 'rifare tubi acqua'],
    searchTerms: ['rifacimento impianto idraulico', 'rifare impianto idraulico', 'impianto idraulico nuovo'],
    ordine: 16,
    categorie: [
      { slug: 'idraulico', isPrimary: true, priorita: 1 },
      { slug: 'termoidraulico', isPrimary: false, priorita: 2 },
      { slug: 'impresa-edile', isPrimary: false, priorita: 3 },
    ],
    servizi: [
      { catSlug: 'idraulico', nome: 'Installazione impianto idraulico' },
      { catSlug: 'impresa-edile', nome: 'Demolizioni e rimozioni' },
    ],
  },
  {
    nome: 'Installazione caldaia',
    slug: 'installazione-caldaia',
    descrizione: 'Installazione o sostituzione di una caldaia con collegamenti e messa in funzione.',
    alias: ['cambio caldaia', 'caldaia nuova', 'montaggio caldaia', 'sostituzione caldaia'],
    searchTerms: ['installazione caldaia', 'sostituzione caldaia', 'caldaia nuova', 'montaggio caldaia'],
    ordine: 17,
    categorie: [{ slug: 'termoidraulico', isPrimary: true, priorita: 1 }],
    servizi: [{ catSlug: 'termoidraulico', nome: 'Installazione caldaia' }],
  },
  {
    nome: 'Installazione climatizzatore',
    slug: 'installazione-climatizzatore',
    descrizione: 'Installazione di un climatizzatore con predisposizioni e collegamenti tecnici.',
    alias: ['montaggio condizionatore', 'installare condizionatore', 'aria condizionata nuova'],
    searchTerms: ['installazione climatizzatore', 'montaggio condizionatore', 'installare condizionatore'],
    ordine: 18,
    categorie: [
      { slug: 'termoidraulico', isPrimary: true, priorita: 1 },
      { slug: 'elettricista', isPrimary: false, priorita: 2 },
    ],
    servizi: [
      { catSlug: 'termoidraulico', nome: 'Installazione climatizzatore' },
      { catSlug: 'elettricista', nome: 'Installazione punti luce' },
    ],
  },
  {
    nome: 'Intonaci e rasature',
    slug: 'intonaci-e-rasature',
    descrizione: 'Ripristino e finitura di intonaci e rasature su pareti interne o esterne.',
    alias: ['rasare muri', 'rifare intonaco', 'intonaco pareti'],
    searchTerms: ['intonaci e rasature', 'rasare muri', 'rifare intonaco', 'intonaco pareti'],
    ordine: 19,
    categorie: [
      { slug: 'muratore', isPrimary: true, priorita: 1 },
      { slug: 'impresa-edile', isPrimary: false, priorita: 2 },
    ],
    servizi: [
      { catSlug: 'impresa-edile', nome: 'Intonaci e rasature' },
      { catSlug: 'muratore', nome: 'Riparazione crepe e lesioni' },
    ],
  },
  {
    nome: 'Tinteggiatura pareti',
    slug: 'tinteggiatura-pareti',
    descrizione: 'Tinteggiatura di pareti interne con rinnovo colore e finitura.',
    alias: ['imbiancare pareti', 'pittura muri', 'verniciare pareti'],
    searchTerms: ['tinteggiatura pareti', 'imbiancare pareti', 'pittura muri interni', 'verniciare pareti'],
    ordine: 20,
    categorie: [{ slug: 'imbianchino', isPrimary: true, priorita: 1 }],
    servizi: [{ catSlug: 'imbianchino', nome: 'Tinteggiatura pareti interne' }],
  },
  {
    nome: 'Posa pavimento',
    slug: 'posa-pavimento',
    descrizione: 'Posa o sostituzione di pavimenti interni in gres, parquet o resina.',
    alias: ['rifare pavimento', 'cambio pavimento', 'nuovo pavimento'],
    searchTerms: ['posa pavimento', 'rifare pavimento', 'cambio pavimento', 'pavimentista'],
    ordine: 21,
    categorie: [
      { slug: 'pavimentista', isPrimary: true, priorita: 1 },
      { slug: 'impresa-edile', isPrimary: false, priorita: 2 },
    ],
    servizi: [
      { catSlug: 'pavimentista', nome: 'Posa pavimento in gres' },
      { catSlug: 'pavimentista', nome: 'Posa parquet' },
      { catSlug: 'pavimentista', nome: 'Posa pavimento in resina' },
    ],
  },
  {
    nome: 'Posa piastrelle bagno',
    slug: 'posa-piastrelle-bagno',
    descrizione: 'Posa o sostituzione di piastrelle e rivestimenti nel bagno.',
    alias: ['piastrelle bagno', 'rivestimento bagno', 'rifare piastrelle bagno'],
    searchTerms: ['posa piastrelle bagno', 'piastrelle bagno', 'rivestimento bagno'],
    ordine: 22,
    categorie: [
      { slug: 'piastrellista', isPrimary: true, priorita: 1 },
      { slug: 'impresa-edile', isPrimary: false, priorita: 2 },
    ],
    servizi: [
      { catSlug: 'piastrellista', nome: 'Posa piastrelle bagno' },
      { catSlug: 'piastrellista', nome: 'Riparazione fughe e piastrelle' },
    ],
  },
  {
    nome: 'Cartongesso',
    slug: 'cartongesso',
    descrizione: 'Realizzazione di pareti, contropareti o divisori in cartongesso.',
    alias: ['parete in cartongesso', 'lavori cartongesso', 'cartongesso casa'],
    searchTerms: ['cartongesso', 'parete in cartongesso', 'lavori cartongesso', 'cartongesso casa'],
    ordine: 23,
    categorie: [
      { slug: 'impresa-edile', isPrimary: true, priorita: 1 },
      { slug: 'muratore', isPrimary: false, priorita: 2 },
      { slug: 'imbianchino', isPrimary: false, priorita: 3 },
    ],
    servizi: [
      { catSlug: 'impresa-edile', nome: 'Costruzione muri e tramezze' },
      { catSlug: 'imbianchino', nome: 'Tinteggiatura pareti interne' },
    ],
  },
  {
    nome: 'Controsoffitto',
    slug: 'controsoffitto',
    descrizione: 'Realizzazione o rifacimento di controsoffitti tecnici o decorativi.',
    alias: ['fare controsoffitto', 'controsoffitto cartongesso', 'abbassamento soffitto'],
    searchTerms: ['controsoffitto', 'fare controsoffitto', 'controsoffitto cartongesso', 'abbassamento soffitto'],
    ordine: 24,
    categorie: [
      { slug: 'impresa-edile', isPrimary: true, priorita: 1 },
      { slug: 'imbianchino', isPrimary: false, priorita: 2 },
    ],
    servizi: [
      { catSlug: 'impresa-edile', nome: 'Costruzione muri e tramezze' },
      { catSlug: 'imbianchino', nome: 'Tinteggiatura soffitti' },
    ],
  },
  {
    nome: 'Rifacimento facciata',
    slug: 'rifacimento-facciata',
    descrizione: 'Rifacimento o ripristino della facciata con intonaci, finiture e protezioni.',
    alias: ['ristrutturazione facciata', 'lavori facciata', 'rifare facciata'],
    searchTerms: ['rifacimento facciata', 'ristrutturazione facciata', 'lavori facciata', 'manutenzione facciata'],
    ordine: 25,
    categorie: [
      { slug: 'impresa-edile', isPrimary: true, priorita: 1 },
      { slug: 'muratore', isPrimary: false, priorita: 2 },
      { slug: 'imbianchino', isPrimary: false, priorita: 3 },
    ],
    servizi: [
      { catSlug: 'impresa-edile', nome: 'Rifacimento facciata' },
      { catSlug: 'impresa-edile', nome: 'Intonaci e rasature' },
      { catSlug: 'imbianchino', nome: 'Tinteggiatura facciata' },
    ],
  },
  {
    nome: 'Cappotto termico',
    slug: 'cappotto-termico',
    descrizione: 'Installazione di cappotto termico per isolamento e riqualificazione energetica.',
    alias: ['isolamento facciata', 'cappotto esterno', 'coibentazione pareti'],
    searchTerms: ['cappotto termico', 'isolamento facciata', 'cappotto esterno', 'coibentazione pareti'],
    ordine: 26,
    categorie: [{ slug: 'impresa-edile', isPrimary: true, priorita: 1 }],
    servizi: [
      { catSlug: 'impresa-edile', nome: 'Cappotto termico' },
      { catSlug: 'impresa-edile', nome: 'Intonaci e rasature' },
    ],
  },
  {
    nome: 'Tinteggiatura facciata',
    slug: 'tinteggiatura-facciata',
    descrizione: 'Tinteggiatura della facciata senza rifacimento completo delle superfici.',
    alias: ['pittura facciata', 'imbiancare facciata', 'verniciare facciata'],
    searchTerms: ['tinteggiatura facciata', 'pittura facciata', 'imbiancare facciata', 'verniciare facciata'],
    ordine: 27,
    categorie: [
      { slug: 'imbianchino', isPrimary: true, priorita: 1 },
      { slug: 'impresa-edile', isPrimary: false, priorita: 2 },
    ],
    servizi: [
      { catSlug: 'imbianchino', nome: 'Tinteggiatura facciata' },
      { catSlug: 'impresa-edile', nome: 'Intonaci e rasature' },
    ],
  },
  {
    nome: 'Rifacimento balconi',
    slug: 'rifacimento-balconi',
    descrizione: 'Rifacimento dei balconi con impermeabilizzazione, finiture e ripristini localizzati.',
    alias: ['ristrutturazione balconi', 'rifare balconi', 'balconi da sistemare'],
    searchTerms: ['rifacimento balconi', 'ristrutturazione balconi', 'rifare balconi', 'balconi da sistemare'],
    ordine: 28,
    categorie: [
      { slug: 'impresa-edile', isPrimary: true, priorita: 1 },
      { slug: 'impresa-coperture', isPrimary: false, priorita: 2 },
    ],
    servizi: [
      { catSlug: 'impresa-edile', nome: 'Rifacimento balconi' },
      { catSlug: 'impresa-coperture', nome: 'Rifacimento terrazza' },
      { catSlug: 'impresa-coperture', nome: 'Impermeabilizzazione terrazzo' },
    ],
  },
  {
    nome: 'Rifacimento frontalini balconi',
    slug: 'rifacimento-frontalini-balconi',
    descrizione: 'Ripristino di frontalini balconi ammalorati con finiture e protezioni.',
    alias: ['frontalini balconi', 'frontalino balcone', 'ripristino frontalini'],
    searchTerms: ['rifacimento frontalini balconi', 'frontalini balconi', 'ripristino frontalini'],
    ordine: 29,
    categorie: [
      { slug: 'impresa-edile', isPrimary: true, priorita: 1 },
      { slug: 'muratore', isPrimary: false, priorita: 2 },
    ],
    servizi: [
      { catSlug: 'impresa-edile', nome: 'Intonaci e rasature' },
      { catSlug: 'muratore', nome: 'Ripristino frontalini' },
    ],
  },
  {
    nome: 'Ripristino ringhiere balconi',
    slug: 'ripristino-ringhiere-balconi',
    descrizione: 'Ripristino o sistemazione di ringhiere e parapetti dei balconi.',
    alias: ['ringhiera balcone', 'parapetto balcone', 'riparare ringhiere balconi'],
    searchTerms: ['ripristino ringhiere balconi', 'ringhiera balcone', 'parapetto balcone'],
    ordine: 30,
    categorie: [
      { slug: 'fabbro', isPrimary: true, priorita: 1 },
      { slug: 'impresa-edile', isPrimary: false, priorita: 2 },
    ],
    servizi: [{ catSlug: 'fabbro', nome: 'Installazione inferriate' }],
  },
  {
    nome: 'Impermeabilizzazione terrazzo',
    slug: 'impermeabilizzazione-terrazzo',
    descrizione: 'Impermeabilizzazione di terrazzi e superfici esterne esposte.',
    alias: ['guaina terrazzo', 'terrazzo che perde', 'infiltrazione terrazzo'],
    searchTerms: ['impermeabilizzazione terrazzo', 'guaina terrazzo', 'terrazzo che perde', 'infiltrazione terrazzo'],
    ordine: 31,
    categorie: [
      { slug: 'impresa-coperture', isPrimary: true, priorita: 1 },
      { slug: 'impresa-edile', isPrimary: false, priorita: 2 },
    ],
    servizi: [{ catSlug: 'impresa-coperture', nome: 'Impermeabilizzazione terrazzo' }],
  },
  {
    nome: 'Rifacimento terrazzo',
    slug: 'rifacimento-terrazzo',
    descrizione: 'Rifacimento del terrazzo con ripristino superfici e nuova impermeabilizzazione.',
    alias: ['rifare terrazzo', 'terrazzo da rifare', 'ristrutturare terrazzo'],
    searchTerms: ['rifacimento terrazzo', 'rifare terrazzo', 'terrazzo da rifare', 'ristrutturare terrazzo'],
    ordine: 32,
    categorie: [
      { slug: 'impresa-coperture', isPrimary: true, priorita: 1 },
      { slug: 'impresa-edile', isPrimary: false, priorita: 2 },
    ],
    servizi: [
      { catSlug: 'impresa-coperture', nome: 'Rifacimento terrazza' },
      { catSlug: 'impresa-coperture', nome: 'Impermeabilizzazione terrazzo' },
    ],
  },
  {
    nome: 'Sistemazione giardino',
    slug: 'sistemazione-giardino',
    descrizione: 'Sistemazione e riordino di un giardino con manutenzione e ripristino.',
    alias: ['giardino da sistemare', 'riqualificare giardino', 'rifare giardino'],
    searchTerms: ['sistemazione giardino', 'giardino da sistemare', 'riqualificare giardino', 'rifare giardino'],
    ordine: 33,
    categorie: [{ slug: 'giardiniere', isPrimary: true, priorita: 1 }],
    servizi: [
      { catSlug: 'giardiniere', nome: 'Manutenzione giardino' },
      { catSlug: 'giardiniere', nome: 'Progettazione giardino' },
    ],
  },
  {
    nome: 'Riparazione muro',
    slug: 'riparazione-muro',
    descrizione: 'Riparazione di crepe, porzioni ammalorate o piccoli danni murari.',
    alias: ['riparare muro', 'crepa nel muro', 'muro da sistemare'],
    searchTerms: ['riparazione muro', 'riparare muro', 'crepa nel muro', 'muro da sistemare'],
    ordine: 34,
    categorie: [
      { slug: 'muratore', isPrimary: true, priorita: 1 },
      { slug: 'impresa-edile', isPrimary: false, priorita: 2 },
    ],
    servizi: [
      { catSlug: 'muratore', nome: 'Piccola muratura' },
      { catSlug: 'muratore', nome: 'Riparazione crepe e lesioni' },
    ],
  },
  {
    nome: 'Sostituzione rubinetto',
    slug: 'sostituzione-rubinetto',
    descrizione: 'Sostituzione di rubinetto o miscelatore in bagno o cucina.',
    alias: ['cambio rubinetto', 'miscelatore nuovo', 'rubinetto bagno'],
    searchTerms: ['sostituzione rubinetto', 'cambio rubinetto', 'miscelatore nuovo', 'rubinetto bagno'],
    ordine: 35,
    categorie: [
      { slug: 'idraulico', isPrimary: true, priorita: 1 },
      { slug: 'termoidraulico', isPrimary: false, priorita: 2 },
    ],
    servizi: [{ catSlug: 'idraulico', nome: 'Sostituzione rubinetto' }],
  },
  {
    nome: 'Riparazione pavimento',
    slug: 'riparazione-pavimento',
    descrizione: 'Riparazione di pavimento danneggiato, rotto o usurato.',
    alias: ['pavimento rotto', 'sistemare pavimento', 'riparare parquet'],
    searchTerms: ['riparazione pavimento', 'pavimento rotto', 'sistemare pavimento', 'riparare parquet'],
    ordine: 36,
    categorie: [{ slug: 'pavimentista', isPrimary: true, priorita: 1 }],
    servizi: [
      { catSlug: 'pavimentista', nome: 'Riparazione pavimento' },
      { catSlug: 'pavimentista', nome: 'Levigatura parquet' },
    ],
  },
  {
    nome: 'Montaggio mobili',
    slug: 'montaggio-mobili',
    descrizione: 'Montaggio di mobili, arredi e complementi per la casa.',
    alias: ['montare mobili', 'assemblaggio mobili', 'montaggio armadio'],
    searchTerms: ['montaggio mobili', 'montare mobili', 'assemblaggio mobili', 'montaggio armadio'],
    ordine: 37,
    categorie: [
      { slug: 'tuttofare', isPrimary: true, priorita: 1 },
      { slug: 'falegname', isPrimary: false, priorita: 2 },
    ],
    servizi: [{ catSlug: 'tuttofare', nome: 'Montaggio mobili IKEA' }],
  },
  {
    nome: 'Sostituzione serratura',
    slug: 'sostituzione-serratura',
    descrizione: 'Sostituzione o cambio serratura per porta, cancello o accesso di servizio.',
    alias: ['cambio serratura', 'serratura da sostituire', 'nuova serratura'],
    searchTerms: ['sostituzione serratura', 'cambio serratura', 'serratura da sostituire', 'nuova serratura'],
    ordine: 38,
    categorie: [
      { slug: 'fabbro', isPrimary: true, priorita: 1 },
      { slug: 'falegname', isPrimary: false, priorita: 2 },
      { slug: 'tuttofare', isPrimary: false, priorita: 3 },
    ],
    servizi: [{ catSlug: 'fabbro', nome: 'Sostituzione serratura' }],
  },
  {
    nome: 'Progetto ristrutturazione',
    slug: 'progetto-ristrutturazione',
    descrizione: 'Progettazione tecnica e distributiva prima di una ristrutturazione.',
    alias: ['progetto casa', 'progettazione ristrutturazione', 'architetto ristrutturazione'],
    searchTerms: ['progetto ristrutturazione', 'progettazione ristrutturazione', 'architetto ristrutturazione'],
    ordine: 39,
    categorie: [
      { slug: 'architetto', isPrimary: true, priorita: 1 },
      { slug: 'geometra', isPrimary: false, priorita: 2 },
      { slug: 'ingegnere', isPrimary: false, priorita: 3 },
    ],
    servizi: [
      { catSlug: 'architetto', nome: 'Progetto ristrutturazione' },
      { catSlug: 'geometra', nome: 'Rilievo metrico' },
      { catSlug: 'geometra', nome: 'Direzione lavori' },
    ],
  },
  {
    nome: 'Direzione lavori',
    slug: 'direzione-lavori',
    descrizione: "Coordinamento tecnico e controllo dell'esecuzione dei lavori in cantiere.",
    alias: ['direttore lavori', 'seguire cantiere', 'coordinamento lavori'],
    searchTerms: ['direzione lavori', 'direttore lavori', 'coordinamento lavori', 'seguire cantiere'],
    ordine: 40,
    categorie: [
      { slug: 'geometra', isPrimary: true, priorita: 1 },
      { slug: 'architetto', isPrimary: false, priorita: 2 },
      { slug: 'ingegnere', isPrimary: false, priorita: 3 },
    ],
    servizi: [{ catSlug: 'geometra', nome: 'Direzione lavori' }],
  },
  {
    nome: 'Pratica CILA',
    slug: 'pratica-cila',
    descrizione: 'Gestione della pratica CILA per lavori edilizi di manutenzione straordinaria.',
    alias: ['fare cila', 'presentazione cila', 'cila ristrutturazione'],
    searchTerms: ['pratica cila', 'fare cila', 'presentazione cila', 'cila ristrutturazione'],
    ordine: 41,
    categorie: [
      { slug: 'geometra', isPrimary: true, priorita: 1 },
      { slug: 'architetto', isPrimary: false, priorita: 2 },
    ],
    servizi: [{ catSlug: 'geometra', nome: 'Pratica CILA' }],
  },
  {
    nome: 'Pratica SCIA',
    slug: 'pratica-scia',
    descrizione: 'Gestione della pratica SCIA per interventi soggetti a segnalazione certificata.',
    alias: ['fare scia', 'presentazione scia', 'scia edilizia'],
    searchTerms: ['pratica scia', 'fare scia', 'presentazione scia', 'scia edilizia'],
    ordine: 42,
    categorie: [
      { slug: 'geometra', isPrimary: true, priorita: 1 },
      { slug: 'architetto', isPrimary: false, priorita: 2 },
    ],
    servizi: [{ catSlug: 'geometra', nome: 'Pratica SCIA' }],
  },
  {
    nome: 'Certificazione energetica (APE)',
    slug: 'certificazione-energetica-ape',
    descrizione: "Rilascio dell'attestato di prestazione energetica per immobile.",
    alias: ['ape casa', 'attestato energetico', 'certificato energetico'],
    searchTerms: ['certificazione energetica ape', 'ape casa', 'attestato energetico', 'certificazione energetica'],
    ordine: 43,
    categorie: [{ slug: 'ingegnere', isPrimary: true, priorita: 1 }],
    servizi: [{ catSlug: 'ingegnere', nome: 'Certificazione energetica (APE)' }],
  },
  {
    nome: 'Trasloco appartamento',
    slug: 'trasloco-appartamento',
    descrizione: 'Trasloco completo di appartamento con movimentazione e rimontaggio mobili.',
    alias: ['traslocare casa', 'trasloco casa', 'cambio casa'],
    searchTerms: ['trasloco appartamento', 'traslocare casa', 'trasloco casa', 'cambio casa'],
    ordine: 44,
    categorie: [{ slug: 'traslocatore', isPrimary: true, priorita: 1 }],
    servizi: [
      { catSlug: 'traslocatore', nome: 'Trasloco appartamento' },
      { catSlug: 'traslocatore', nome: 'Montaggio e smontaggio mobili' },
    ],
  },
  {
    nome: 'Trasloco ufficio',
    slug: 'trasloco-ufficio',
    descrizione: 'Trasloco di uffici e locali professionali con movimentazione arredi e attrezzature.',
    alias: ['trasferimento ufficio', 'spostare ufficio', 'trasloco azienda'],
    searchTerms: ['trasloco ufficio', 'trasferimento ufficio', 'spostare ufficio', 'trasloco azienda'],
    ordine: 45,
    categorie: [{ slug: 'traslocatore', isPrimary: true, priorita: 1 }],
    servizi: [
      { catSlug: 'traslocatore', nome: 'Trasloco ufficio' },
      { catSlug: 'traslocatore', nome: 'Montaggio e smontaggio mobili' },
    ],
  },
  {
    nome: 'Sgombero appartamento',
    slug: 'sgombero-appartamento',
    descrizione: 'Sgombero di appartamento, cantina o locale con ritiro degli ingombranti.',
    alias: ['svuotare appartamento', 'sgombero casa', 'sgombero cantina'],
    searchTerms: ['sgombero appartamento', 'svuotare appartamento', 'sgombero casa', 'sgombero cantina'],
    ordine: 46,
    categorie: [{ slug: 'traslocatore', isPrimary: true, priorita: 1 }],
    servizi: [{ catSlug: 'traslocatore', nome: 'Smaltimento mobili' }],
  },
  {
    nome: 'Pulizia fine cantiere',
    slug: 'pulizia-fine-cantiere',
    descrizione: 'Pulizia approfondita di ambienti dopo lavori edili o ristrutturazioni.',
    alias: ['pulizie fine cantiere', 'pulizia dopo lavori', 'pulizia post ristrutturazione'],
    searchTerms: ['pulizia fine cantiere', 'pulizie fine cantiere', 'pulizia dopo lavori', 'pulizia post ristrutturazione'],
    ordine: 47,
    categorie: [{ slug: 'pulitore-professionale', isPrimary: true, priorita: 1 }],
    servizi: [
      { catSlug: 'pulitore-professionale', nome: 'Pulizia fine cantiere' },
      { catSlug: 'pulitore-professionale', nome: 'Pulizia vetri e facciate' },
    ],
  },
  {
    nome: 'Riparazione perdita acqua',
    slug: 'riparazione-perdita-acqua',
    descrizione: 'Riparazione di perdite da tubazioni, rubinetti, sanitari o collegamenti idraulici.',
    alias: ['perdita acqua', 'perdita idrica', 'tubo che perde', 'perdita bagno'],
    searchTerms: ['riparazione perdita acqua', 'perdita acqua', 'perdita idrica', 'tubo che perde'],
    ordine: 48,
    categorie: [
      { slug: 'idraulico', isPrimary: true, priorita: 1 },
      { slug: 'termoidraulico', isPrimary: false, priorita: 2 },
    ],
    servizi: [{ catSlug: 'idraulico', nome: 'Riparazione perdita acqua' }],
  },
  {
    nome: 'Scarico intasato',
    slug: 'scarico-intasato',
    descrizione: 'Disostruzione di scarichi intasati in bagno, cucina o lavanderia.',
    alias: ['lavandino intasato', 'scarico otturato', 'tubo intasato'],
    searchTerms: ['scarico intasato', 'lavandino intasato', 'scarico otturato', 'tubo intasato'],
    ordine: 49,
    categorie: [{ slug: 'idraulico', isPrimary: true, priorita: 1 }],
    servizi: [{ catSlug: 'idraulico', nome: 'Scarichi intasati' }],
  },
  {
    nome: 'Manutenzione caldaia',
    slug: 'manutenzione-caldaia',
    descrizione: 'Manutenzione ordinaria, controllo e pulizia della caldaia.',
    alias: ['controllo caldaia', 'pulizia caldaia', 'revisione caldaia'],
    searchTerms: ['manutenzione caldaia', 'controllo caldaia', 'pulizia caldaia', 'revisione caldaia'],
    ordine: 50,
    categorie: [{ slug: 'termoidraulico', isPrimary: true, priorita: 1 }],
    servizi: [{ catSlug: 'termoidraulico', nome: 'Manutenzione caldaia' }],
  },
  {
    nome: 'Riparazione caldaia',
    slug: 'riparazione-caldaia',
    descrizione: 'Riparazione di guasti o malfunzionamenti della caldaia.',
    alias: ['caldaia rotta', 'guasto caldaia', 'caldaia non parte'],
    searchTerms: ['riparazione caldaia', 'caldaia rotta', 'guasto caldaia', 'caldaia non parte'],
    ordine: 51,
    categorie: [{ slug: 'termoidraulico', isPrimary: true, priorita: 1 }],
    servizi: [{ catSlug: 'termoidraulico', nome: 'Riparazione caldaia' }],
  },
  {
    nome: 'Sostituzione boiler o scaldacqua',
    slug: 'sostituzione-boiler-scaldacqua',
    descrizione: 'Sostituzione o installazione di boiler, scaldacqua elettrico o a gas.',
    alias: ['cambio boiler', 'cambio scaldacqua', 'scaldabagno nuovo'],
    searchTerms: ['sostituzione boiler', 'sostituzione scaldacqua', 'cambio boiler', 'scaldabagno nuovo'],
    ordine: 52,
    categorie: [
      { slug: 'idraulico', isPrimary: true, priorita: 1 },
      { slug: 'termoidraulico', isPrimary: false, priorita: 2 },
    ],
    servizi: [{ catSlug: 'idraulico', nome: 'Sostituzione boiler o scaldacqua' }],
  },
  {
    nome: 'Sostituzione prese e interruttori',
    slug: 'sostituzione-prese-interruttori',
    descrizione: 'Sostituzione di prese, placche, interruttori o piccoli componenti elettrici.',
    alias: ['cambiare presa', 'cambiare interruttore', 'presa rotta'],
    searchTerms: ['sostituzione prese', 'sostituzione interruttori', 'cambiare presa', 'presa rotta'],
    ordine: 53,
    categorie: [
      { slug: 'elettricista', isPrimary: true, priorita: 1 },
      { slug: 'tuttofare', isPrimary: false, priorita: 2 },
    ],
    servizi: [{ catSlug: 'elettricista', nome: 'Sostituzione prese e interruttori' }],
  },
  {
    nome: 'Messa a norma impianto elettrico',
    slug: 'messa-a-norma-impianto-elettrico',
    descrizione: "Adeguamento e messa a norma dell'impianto elettrico.",
    alias: ['impianto elettrico a norma', 'adeguamento impianto elettrico'],
    searchTerms: ['messa a norma impianto elettrico', 'impianto elettrico a norma', 'adeguamento impianto elettrico'],
    ordine: 54,
    categorie: [{ slug: 'elettricista', isPrimary: true, priorita: 1 }],
    servizi: [{ catSlug: 'elettricista', nome: 'Messa a norma impianto' }],
  },
  {
    nome: 'Installazione quadro elettrico',
    slug: 'installazione-quadro-elettrico',
    descrizione: 'Installazione o sostituzione del quadro elettrico domestico o condominiale.',
    alias: ['quadro elettrico nuovo', 'sostituzione quadro elettrico'],
    searchTerms: ['installazione quadro elettrico', 'sostituzione quadro elettrico', 'quadro elettrico nuovo'],
    ordine: 55,
    categorie: [{ slug: 'elettricista', isPrimary: true, priorita: 1 }],
    servizi: [{ catSlug: 'elettricista', nome: 'Installazione quadro elettrico' }],
  },
  {
    nome: 'Installazione wallbox',
    slug: 'installazione-wallbox',
    descrizione: 'Installazione di caricatore domestico per auto elettrica.',
    alias: ['caricatore auto elettrica', 'colonnina auto casa', 'wallbox casa'],
    searchTerms: ['installazione wallbox', 'caricatore auto elettrica', 'colonnina auto casa'],
    ordine: 56,
    categorie: [{ slug: 'elettricista', isPrimary: true, priorita: 1 }],
    servizi: [{ catSlug: 'elettricista', nome: 'Caricatore auto elettrica (wallbox)' }],
  },
  {
    nome: 'Rifacimento tetto',
    slug: 'rifacimento-tetto',
    descrizione: 'Rifacimento completo o parziale del tetto con copertura e impermeabilizzazione.',
    alias: ['rifare tetto', 'tetto da rifare', 'ristrutturazione tetto'],
    searchTerms: ['rifacimento tetto', 'rifare tetto', 'tetto da rifare', 'ristrutturazione tetto'],
    ordine: 57,
    categorie: [
      { slug: 'impresa-coperture', isPrimary: true, priorita: 1 },
      { slug: 'impresa-edile', isPrimary: false, priorita: 2 },
    ],
    servizi: [{ catSlug: 'impresa-coperture', nome: 'Rifacimento tetto' }],
  },
  {
    nome: 'Riparazione tetto',
    slug: 'riparazione-tetto',
    descrizione: 'Riparazione di infiltrazioni, tegole o parti danneggiate del tetto.',
    alias: ['tetto che perde', 'infiltrazione tetto', 'tegole rotte'],
    searchTerms: ['riparazione tetto', 'tetto che perde', 'infiltrazione tetto', 'tegole rotte'],
    ordine: 58,
    categorie: [{ slug: 'impresa-coperture', isPrimary: true, priorita: 1 }],
    servizi: [{ catSlug: 'impresa-coperture', nome: 'Riparazione tetto' }],
  },
  {
    nome: 'Installazione grondaie',
    slug: 'installazione-grondaie',
    descrizione: 'Installazione, sostituzione o riparazione di grondaie e pluviali.',
    alias: ['grondaie nuove', 'sostituzione grondaie', 'riparazione grondaia'],
    searchTerms: ['installazione grondaie', 'sostituzione grondaie', 'grondaie nuove', 'riparazione grondaia'],
    ordine: 59,
    categorie: [{ slug: 'impresa-coperture', isPrimary: true, priorita: 1 }],
    servizi: [{ catSlug: 'impresa-coperture', nome: 'Installazione grondaie' }],
  },
  {
    nome: 'Sostituzione vetro rotto',
    slug: 'sostituzione-vetro-rotto',
    descrizione: 'Sostituzione di vetri rotti, vetrocamera o elementi vetrati.',
    alias: ['vetro rotto', 'cambio vetro', 'sostituire vetro finestra'],
    searchTerms: ['sostituzione vetro rotto', 'vetro rotto', 'cambio vetro', 'sostituire vetro finestra'],
    ordine: 60,
    categorie: [{ slug: 'serramentista-vetraio', isPrimary: true, priorita: 1 }],
    servizi: [{ catSlug: 'serramentista-vetraio', nome: 'Sostituzione vetro rotto' }],
  },
  {
    nome: 'Installazione infissi',
    slug: 'installazione-infissi',
    descrizione: 'Installazione o sostituzione di infissi, finestre e serramenti.',
    alias: ['cambio infissi', 'finestre nuove', 'sostituzione finestre'],
    searchTerms: ['installazione infissi', 'cambio infissi', 'finestre nuove', 'sostituzione finestre'],
    ordine: 61,
    categorie: [{ slug: 'serramentista-vetraio', isPrimary: true, priorita: 1 }],
    servizi: [
      { catSlug: 'serramentista-vetraio', nome: 'Installazione infissi' },
      { catSlug: 'serramentista-vetraio', nome: 'Installazione finestre' },
    ],
  },
  {
    nome: 'Riparazione cancello automatico',
    slug: 'riparazione-cancello-automatico',
    descrizione: 'Riparazione di cancelli automatici, automazioni e componenti metallici.',
    alias: ['cancello automatico rotto', 'automazione cancello', 'cancello bloccato'],
    searchTerms: ['riparazione cancello automatico', 'cancello automatico rotto', 'automazione cancello'],
    ordine: 62,
    categorie: [{ slug: 'fabbro', isPrimary: true, priorita: 1 }],
    servizi: [{ catSlug: 'fabbro', nome: 'Riparazione cancello automatico' }],
  },
  {
    nome: 'Installazione recinzione',
    slug: 'installazione-recinzione',
    descrizione: 'Installazione di recinzioni, reti, cancelli pedonali o delimitazioni esterne.',
    alias: ['recinzione giardino', 'rete recinzione', 'chiudere terreno'],
    searchTerms: ['installazione recinzione', 'recinzione giardino', 'rete recinzione', 'chiudere terreno'],
    ordine: 63,
    categorie: [{ slug: 'fabbro', isPrimary: true, priorita: 1 }],
    servizi: [{ catSlug: 'fabbro', nome: 'Installazione recinzione' }],
  },
  {
    nome: 'Potatura piante e siepi',
    slug: 'potatura-piante-siepi',
    descrizione: 'Potatura di alberi, piante, siepi e verde privato.',
    alias: ['potare siepe', 'potatura alberi', 'taglio siepi'],
    searchTerms: ['potatura piante', 'potatura siepi', 'potatura alberi', 'taglio siepi'],
    ordine: 64,
    categorie: [{ slug: 'giardiniere', isPrimary: true, priorita: 1 }],
    servizi: [{ catSlug: 'giardiniere', nome: 'Potatura piante e siepi' }],
  },
  {
    nome: 'Derattizzazione',
    slug: 'derattizzazione',
    descrizione: 'Trattamento professionale contro topi e roditori.',
    alias: ['topi in casa', 'eliminare topi', 'trattamento roditori'],
    searchTerms: ['derattizzazione', 'topi in casa', 'eliminare topi', 'trattamento roditori'],
    ordine: 65,
    categorie: [{ slug: 'disinfestatore', isPrimary: true, priorita: 1 }],
    servizi: [{ catSlug: 'disinfestatore', nome: 'Derattizzazione' }],
  },
  {
    nome: 'Disinfestazione insetti',
    slug: 'disinfestazione-insetti',
    descrizione: 'Trattamento professionale contro blatte, formiche, zanzare e insetti infestanti.',
    alias: ['blatte in casa', 'formiche in casa', 'zanzare', 'insetti infestanti'],
    searchTerms: ['disinfestazione insetti', 'blatte', 'formiche', 'zanzare', 'insetti infestanti'],
    ordine: 66,
    categorie: [{ slug: 'disinfestatore', isPrimary: true, priorita: 1 }],
    servizi: [{ catSlug: 'disinfestatore', nome: 'Disinfestazione insetti' }],
  },
  {
    nome: 'Lavaggio tappeti e divani',
    slug: 'lavaggio-tappeti-divani',
    descrizione: 'Pulizia professionale e lavaggio di tappeti, divani e imbottiti.',
    alias: ['pulizia divano', 'lavaggio divano', 'pulizia tappeto'],
    searchTerms: ['lavaggio tappeti e divani', 'pulizia divano', 'lavaggio divano', 'pulizia tappeto'],
    ordine: 67,
    categorie: [{ slug: 'pulitore-professionale', isPrimary: true, priorita: 1 }],
    servizi: [{ catSlug: 'pulitore-professionale', nome: 'Lavaggio tappeti e divani' }],
  },
]

const showcasePlans = [
  {
    tier: 'BASE' as const,
    name: 'Base',
    description:
      'Profilo pubblico, recensioni verificate e comparsa nelle sezioni base della vetrina. Sconto 33% sui contatti provenienti dalla vetrina.',
    monthlyPriceCents: 2990,
    yearlyPriceCents: 29000,
    discountPercent: 33,
    freeContactsPerMonth: 0,
    overQuotaDiscountPercent: 0,
    active: true,
  },
  {
    tier: 'PLUS' as const,
    name: 'Plus',
    description:
      'Maggiore visibilità, più placement e profilo arricchito con cover e gallery. Sconto 66% sui contatti provenienti dalla vetrina.',
    monthlyPriceCents: 5990,
    yearlyPriceCents: 59000,
    discountPercent: 66,
    freeContactsPerMonth: 0,
    overQuotaDiscountPercent: 0,
    active: true,
  },
  {
    tier: 'PRO' as const,
    name: 'Pro',
    description:
      'Massima visibilità, placement premium e priorità editoriale. 5 contatti vetrina gratuiti al mese, poi sconto 70%.',
    monthlyPriceCents: 9990,
    yearlyPriceCents: 99000,
    discountPercent: 0,
    freeContactsPerMonth: 5,
    overQuotaDiscountPercent: 70,
    active: true,
  },
]

function validateSeed(): void {
  assertUnique(
    taxonomy.map((settore) => settore.slug),
    'Slug settore',
  )

  const categorie = taxonomy.flatMap((settore) => settore.categorie)
  assertUnique(
    categorie.map((categoria) => categoria.slug),
    'Slug categoria',
  )

  const servizi = taxonomy.flatMap((settore) =>
    settore.categorie.flatMap((categoria) =>
      categoria.servizi.map((servizio) => ({
        slug: servizioSlug(categoria.slug, servizio),
        categoriaSlug: categoria.slug,
        nome: servizio,
      })),
    ),
  )
  assertUnique(
    servizi.map((servizio) => servizio.slug),
    'Slug servizio',
  )

  assertUnique(
    interventiData.map((intervento) => intervento.slug),
    'Slug intervento',
  )
  assertUnique(
    interventiData.map((intervento) => String(intervento.ordine)),
    'Ordine intervento',
  )

  const categoriaSlugSet = new Set(categorie.map((categoria) => categoria.slug))
  const servizioSlugSet = new Set(servizi.map((servizio) => servizio.slug))

  for (const intervento of interventiData) {
    if (intervento.categorie.length === 0) {
      throw new Error(`Intervento '${intervento.slug}' senza categorie compatibili`)
    }

    assertOnePrimary(intervento.slug, intervento.categorie)
    assertUnique(
      intervento.categorie.map((categoria) => categoria.slug),
      `Categorie duplicate in intervento '${intervento.slug}'`,
    )
    assertUnique(
      intervento.servizi.map((servizio) => servizioSlug(servizio.catSlug, servizio.nome)),
      `Servizi duplicati in intervento '${intervento.slug}'`,
    )

    for (const categoria of intervento.categorie) {
      if (!categoriaSlugSet.has(categoria.slug)) {
        throw new Error(`Intervento '${intervento.slug}' referenzia categoria inesistente '${categoria.slug}'`)
      }
    }

    for (const servizio of intervento.servizi) {
      const slug = servizioSlug(servizio.catSlug, servizio.nome)
      if (!servizioSlugSet.has(slug)) {
        throw new Error(`Intervento '${intervento.slug}' referenzia servizio inesistente '${slug}'`)
      }
    }
  }
}

async function seedTaxonomy(): Promise<void> {
  console.log('Avvio seed tassonomia FixPro...')

  const activeSettoreSlugs = taxonomy.map((settore) => settore.slug)
  const activeCategoriaSlugs = taxonomy.flatMap((settore) => settore.categorie.map((categoria) => categoria.slug))
  const activeServizioSlugs = taxonomy.flatMap((settore) =>
    settore.categorie.flatMap((categoria) => categoria.servizi.map((servizio) => servizioSlug(categoria.slug, servizio))),
  )

  for (const settoreData of taxonomy) {
    const settore = await prisma.settore.upsert({
      where: { slug: settoreData.slug },
      update: {
        nome: settoreData.nome,
        descrizione: settoreData.descrizione,
        fase: settoreData.fase,
        ordine: settoreData.ordine,
        attivo: true,
      },
      create: {
        nome: settoreData.nome,
        slug: settoreData.slug,
        descrizione: settoreData.descrizione,
        fase: settoreData.fase,
        ordine: settoreData.ordine,
        attivo: true,
      },
    })

    for (const catData of settoreData.categorie) {
      const categoria = await prisma.categoria.upsert({
        where: { slug: catData.slug },
        update: {
          settoreId: settore.id,
          nome: catData.nome,
          descrizione: catData.descrizione,
          alias: catData.alias,
          searchTerms: catData.searchTerms,
          attivo: true,
        },
        create: {
          settoreId: settore.id,
          nome: catData.nome,
          slug: catData.slug,
          descrizione: catData.descrizione,
          alias: catData.alias,
          searchTerms: catData.searchTerms,
          attivo: true,
        },
      })

      for (const [ordine, servizioNome] of catData.servizi.entries()) {
        const slug = servizioSlug(catData.slug, servizioNome)
        await prisma.servizio.upsert({
          where: { slug },
          update: {
            categoriaId: categoria.id,
            nome: servizioNome,
            ordine,
            attivo: true,
          },
          create: {
            categoriaId: categoria.id,
            nome: servizioNome,
            slug,
            ordine,
            attivo: true,
          },
        })
      }
    }

    console.log(`  ✓ ${settoreData.nome}`)
  }

  await prisma.servizio.updateMany({
    where: { slug: { notIn: activeServizioSlugs } },
    data: { attivo: false },
  })
  await prisma.categoria.updateMany({
    where: { slug: { notIn: activeCategoriaSlugs } },
    data: { attivo: false },
  })
  await prisma.settore.updateMany({
    where: { slug: { notIn: activeSettoreSlugs } },
    data: { attivo: false },
  })

  console.log('Seed tassonomia completato.')
}

async function seedShowcasePlans(): Promise<void> {
  console.log('Avvio seed piani vetrina...')

  for (const plan of showcasePlans) {
    await prisma.showcasePlan.upsert({
      where: { tier: plan.tier },
      update: plan,
      create: plan,
    })
    console.log(`  ✓ Vetrina ${plan.tier}: €${(plan.monthlyPriceCents / 100).toFixed(2)}/mese`)
  }

  console.log('Seed piani vetrina completato.')
}

async function seedInterventiAndMatching(): Promise<void> {
  console.log('Avvio seed interventi e matching...')

  const activeInterventoSlugs = interventiData.map((intervento) => intervento.slug)
  await prisma.intervento.updateMany({
    where: { slug: { notIn: activeInterventoSlugs } },
    data: { attivo: false },
  })

  const allCategorie = await prisma.categoria.findMany({ select: { id: true, slug: true } })
  const catMap = new Map(allCategorie.map((categoria) => [categoria.slug, categoria.id]))

  const allServizi = await prisma.servizio.findMany({ select: { id: true, slug: true } })
  const servMap = new Map(allServizi.map((servizio) => [servizio.slug, servizio.id]))

  for (const interventoData of interventiData) {
    const intervento = await prisma.intervento.upsert({
      where: { slug: interventoData.slug },
      update: {
        nome: interventoData.nome,
        descrizione: interventoData.descrizione,
        alias: interventoData.alias,
        searchTerms: interventoData.searchTerms,
        ordine: interventoData.ordine,
        attivo: true,
      },
      create: {
        nome: interventoData.nome,
        slug: interventoData.slug,
        descrizione: interventoData.descrizione,
        alias: interventoData.alias,
        searchTerms: interventoData.searchTerms,
        ordine: interventoData.ordine,
        attivo: true,
      },
    })

    const activeCategoriaIds: string[] = []
    for (const matchingCategoria of interventoData.categorie) {
      const categoriaId = catMap.get(matchingCategoria.slug)
      if (!categoriaId) {
        throw new Error(`Categoria '${matchingCategoria.slug}' non trovata per intervento '${interventoData.slug}'`)
      }

      activeCategoriaIds.push(categoriaId)
      await prisma.matchingInterventoCat.upsert({
        where: { interventoId_categoriaId: { interventoId: intervento.id, categoriaId } },
        update: {
          priorita: matchingCategoria.priorita,
          isPrimary: matchingCategoria.isPrimary,
          attivo: true,
        },
        create: {
          interventoId: intervento.id,
          categoriaId,
          priorita: matchingCategoria.priorita,
          isPrimary: matchingCategoria.isPrimary,
          attivo: true,
        },
      })
    }

    await prisma.matchingInterventoCat.updateMany({
      where: {
        interventoId: intervento.id,
        categoriaId: { notIn: activeCategoriaIds },
      },
      data: { attivo: false },
    })

    const activeServizioIds: string[] = []
    for (const matchingServizio of interventoData.servizi) {
      const slug = servizioSlug(matchingServizio.catSlug, matchingServizio.nome)
      const servizioId = servMap.get(slug)
      if (!servizioId) {
        throw new Error(`Servizio '${slug}' non trovato per intervento '${interventoData.slug}'`)
      }

      activeServizioIds.push(servizioId)
      await prisma.matchingInterventoServizio.upsert({
        where: { interventoId_servizioId: { interventoId: intervento.id, servizioId } },
        update: { attivo: true },
        create: {
          interventoId: intervento.id,
          servizioId,
          attivo: true,
        },
      })
    }

    await prisma.matchingInterventoServizio.updateMany({
      where: {
        interventoId: intervento.id,
        servizioId: { notIn: activeServizioIds },
      },
      data: { attivo: false },
    })

    console.log(`  ✓ Intervento: ${interventoData.nome}`)
  }

  console.log('Seed interventi e matching completato.')
}

async function seedInitialAdmin(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()

  if (!adminEmail) {
    console.warn('ADMIN_EMAIL non presente — admin non creato')
    return
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      adminRole: 'SUPER_ADMIN',
      emailVerified: true,
    },
    create: {
      name: adminEmail.split('@')[0] || 'Admin',
      email: adminEmail,
      emailVerified: true,
      role: 'CLIENT',
      adminRole: 'SUPER_ADMIN',
    },
  })

  console.log(`Admin iniziale pronto: ${adminEmail}`)
}

async function main(): Promise<void> {
  validateSeed()
  await seedTaxonomy()
  await seedShowcasePlans()
  await seedInterventiAndMatching()
  await seedInitialAdmin()
  console.log('Seed FixPro completato con successo.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
