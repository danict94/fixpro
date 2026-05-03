export const STEPS: string[] = ['Dati', 'Verifica telefono', 'Email inviata']

export const OTP_COOLDOWN = 60

export const MAX_ONBOARDING_CATEGORIES = 2

export const POPULAR_CATEGORY_SLUGS: string[] = [
  'impresa-edile',
  'muratore',
  'idraulico',
  'elettricista',
  'termoidraulico',
  'imbianchino',
  'fabbro',
  'geometra',
  'architetto',
  'traslocatore',
]

export const QUERY_SYNONYMS: Record<string, string[]> = {
  bagno: ['bagno', 'sanitari', 'doccia', 'piastrelle bagno', 'ristrutturazione bagno'],
  bagni: ['bagno', 'sanitari', 'doccia', 'piastrelle bagno', 'ristrutturazione bagno'],
  caldaia: ['caldaia', 'termoidraulico', 'riscaldamento'],
  caldaie: ['caldaia', 'termoidraulico', 'riscaldamento'],
  condizionatore: ['climatizzatore', 'condizionatore', 'aria condizionata'],
  clima: ['climatizzatore', 'condizionatore', 'aria condizionata'],
  facciata: ['facciata', 'intonaci', 'cappotto', 'rasatura facciata'],
  facciate: ['facciata', 'intonaci', 'cappotto', 'rasatura facciata'],
  cappotto: ['cappotto termico', 'isolamento facciata', 'coibentazione'],
  serratura: ['serratura', 'fabbro', 'porta'],
  serrature: ['serratura', 'fabbro', 'porta'],
  infissi: ['infissi', 'finestre', 'serramenti', 'vetro'],
  serramenti: ['infissi', 'finestre', 'serramenti', 'vetro'],
  trasloco: ['trasloco', 'traslocatore', 'sgombero'],
  traslochi: ['trasloco', 'traslocatore', 'sgombero'],
}