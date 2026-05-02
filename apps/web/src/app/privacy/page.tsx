import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | FixPro',
  description: 'Informativa sulla privacy e il trattamento dei dati personali su FixPro',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted border-b border-border">
        <div className="page-container py-12 sm:py-16">
          <h1 className="text-4xl font-semibold leading-tight tracking-[-0.065em] text-secondary sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="body-md mt-4 max-w-2xl">
            Informativa sulla privacy e il trattamento dei dati personali secondo il GDPR e la normativa italiana.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="page-container py-8">
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-warning mt-0.5" />
          <p className="text-sm text-foreground">
            <strong>Disclaimer:</strong> Questa informativa non costituisce consulenza legale. Per questioni legali specifiche,
            contattare un professionista. L&apos;ultima revisione: aprile 2026.
          </p>
        </div>
      </div>

      {/* Content */}
      <article className="page-container py-12">
        <div className="max-w-3xl space-y-12">

          {/* 1. Titolare del trattamento */}
          <section className="space-y-4">
            <h2 className="section-title">1. Titolare del Trattamento</h2>
            <p className="body-md">
              <strong>FixPro</strong> è il titolare del trattamento dei vostri dati personali. Per contattare il titolare:
            </p>
            <div className="rounded-lg border border-border bg-muted p-4 text-sm space-y-2">
              <p><strong>Email:</strong> privacy@fixpro.it</p>
              <p><strong>Indirizzo:</strong> [Indirizzo legale FixPro]</p>
              <p><strong>Telefono:</strong> [Numero di contatto]</p>
            </div>
          </section>

          {/* 2. Dati personali raccolti */}
          <section className="space-y-4">
            <h2 className="section-title">2. Dati Personali Raccolti</h2>
            <p className="body-md">
              FixPro raccoglie i seguenti dati personali dagli utenti della piattaforma:
            </p>
            <div className="space-y-3">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-secondary">Dati di registrazione</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Nome, cognome, email</li>
                  <li>Numero di telefono</li>
                  <li>Ragione sociale e partita IVA (per imprese)</li>
                  <li>Password (criptata, non accessibile)</li>
                </ul>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-secondary">Dati di localizzazione</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Indirizzo (via, civico, CAP, città, provincia)</li>
                  <li>Coordinate geografiche (latitudine, longitudine)</li>
                  <li>Zona di copertura/servizio (per imprese)</li>
                </ul>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-secondary">Dati di richesta/transazione</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Descrizione lavori richiesti</li>
                  <li>Categorie, interventi, servizi selezionati</li>
                  <li>Immagini caricate (optional)</li>
                  <li>Cronologia delle richieste e risposte</li>
                  <li>Dati di pagamento/crediti (via Stripe, tokenizzati)</li>
                </ul>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-secondary">Dati di comunicazione</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Messaggi e contatti tra cliente e professionista</li>
                  <li>Notifiche email/SMS</li>
                  <li>Log di accesso e sessioni</li>
                </ul>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-secondary">Dati tecnici</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Indirizzo IP</li>
                  <li>Tipo di browser e dispositivo</li>
                  <li>Pagine visitate e comportamento di utilizzo</li>
                  <li>Cookie e tecnologie di tracciamento simili</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Base giuridica */}
          <section className="space-y-4">
            <h2 className="section-title">3. Base Giuridica del Trattamento</h2>
            <p className="body-md">
              I vostri dati sono trattati sulla base delle seguenti basi giuridiche:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-semibold text-secondary shrink-0">Consenso:</span>
                <span>Per finalità di marketing, profilazione e cookies non essenziali.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-secondary shrink-0">Contratto:</span>
                <span>Per esecuzione del contratto di fornitura dei servizi FixPro.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-secondary shrink-0">Interesse legittimo:</span>
                <span>Per sicurezza, prevenzione frodi, miglioramento servizi, analitiche.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-secondary shrink-0">Obbligo legale:</span>
                <span>Per adempimento di obblighi fiscali, contabili, anti-riciclaggio.</span>
              </li>
            </ul>
          </section>

          {/* 4. Finalità del trattamento */}
          <section className="space-y-4">
            <h2 className="section-title">4. Finalità del Trattamento</h2>
            <p className="body-md">
              I vostri dati sono trattati per le seguenti finalità:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Fornitura e gestione dei servizi FixPro</li>
              <li>Matching tra clienti e professionisti</li>
              <li>Elaborazione pagamenti e gestione crediti</li>
              <li>Comunicazioni relative alla piattaforma</li>
              <li>Conformità a obblighi legali e normativi</li>
              <li>Prevenzione di frodi e abusi</li>
              <li>Miglioramento dei servizi e personalizzazione dell&apos;esperienza</li>
              <li>Analitiche e reportistica (anonimizzata)</li>
              <li>Invio di newsletter e comunicazioni di marketing (previa consenso)</li>
            </ul>
          </section>

          {/* 5. Destinatari dei dati */}
          <section className="space-y-4">
            <h2 className="section-title">5. Destinatari dei Dati</h2>
            <p className="body-md">
              I vostri dati possono essere comunicati ai seguenti destinatari:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li><strong>Utenti della piattaforma:</strong> Clienti possono vedere dati professionisti (profilo pubblico), professionisti vedono dati clienti (richieste)</li>
              <li><strong>Fornitori di servizi:</strong> Stripe (pagamenti), Google Maps (localizzazione), Resend (email), Better Auth (autenticazione), Neon (database hosting)</li>
              <li><strong>Autorità pubbliche:</strong> Se richiesto per legge</li>
              <li><strong>Partner commerciali:</strong> Solo previa consenso esplicito</li>
            </ul>
          </section>

          {/* 6. Trasferimento dati internazionali */}
          <section className="space-y-4">
            <h2 className="section-title">6. Trasferimento Dati Internazionali</h2>
            <p className="body-md">
              Alcuni fornitori di servizi (Stripe, Google, AWS) sono ubicati negli USA. I dati sono trasferiti sulla base di
              <strong> clausole contrattuali standard</strong> approvate dalla Commissione Europea e misure di sicurezza adeguate.
            </p>
          </section>

          {/* 7. Periodo di conservazione */}
          <section className="space-y-4">
            <h2 className="section-title">7. Periodo di Conservazione</h2>
            <p className="body-md">
              I dati personali sono conservati per i seguenti periodi:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-semibold text-secondary shrink-0">Registrazione:</span>
                <span>Fino a cancellazione account o inattività di 24 mesi</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-secondary shrink-0">Richieste/transazioni:</span>
                <span>6 anni (obblighi contabili e fiscali)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-secondary shrink-0">Log tecnici:</span>
                <span>Massimo 30 giorni (salvo esigenze di sicurezza)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-secondary shrink-0">Cookies:</span>
                <span>In base alle impostazioni browser</span>
              </li>
            </ul>
          </section>

          {/* 8. Diritti dell'interessato */}
          <section className="space-y-4">
            <h2 className="section-title">8. Diritti dell&apos;Interessato (GDPR)</h2>
            <p className="body-md">
              Avete diritto di esercitare i seguenti diritti nei confronti di FixPro:
            </p>
            <div className="space-y-3">
              <div className="border-l-4 border-success pl-4">
                <h3 className="font-semibold text-secondary">Diritto di accesso (Art. 15)</h3>
                <p className="text-sm text-muted-foreground mt-1">Conoscere quali dati sono trattati e come</p>
              </div>
              <div className="border-l-4 border-success pl-4">
                <h3 className="font-semibold text-secondary">Diritto di rettifica (Art. 16)</h3>
                <p className="text-sm text-muted-foreground mt-1">Correggere dati inesatti o incompleti</p>
              </div>
              <div className="border-l-4 border-success pl-4">
                <h3 className="font-semibold text-secondary">Diritto all&apos;oblio (Art. 17)</h3>
                <p className="text-sm text-muted-foreground mt-1">Richiedere cancellazione dati (salvo obblighi legali)</p>
              </div>
              <div className="border-l-4 border-success pl-4">
                <h3 className="font-semibold text-secondary">Diritto di limitazione (Art. 18)</h3>
                <p className="text-sm text-muted-foreground mt-1">Limitare il trattamento in determinati casi</p>
              </div>
              <div className="border-l-4 border-success pl-4">
                <h3 className="font-semibold text-secondary">Diritto di portabilità (Art. 20)</h3>
                <p className="text-sm text-muted-foreground mt-1">Ricevere i dati in formato strutturato e portarli altrove</p>
              </div>
              <div className="border-l-4 border-success pl-4">
                <h3 className="font-semibold text-secondary">Diritto di opposizione (Art. 21)</h3>
                <p className="text-sm text-muted-foreground mt-1">Opporsi al trattamento per marketing, profilazione, ecc.</p>
              </div>
              <div className="border-l-4 border-success pl-4">
                <h3 className="font-semibold text-secondary">Diritto di reclamo</h3>
                <p className="text-sm text-muted-foreground mt-1">Presentare reclamo all&apos;Autorità Garante della Privacy</p>
              </div>
            </div>
            <p className="body-sm mt-4">
              Per esercitare questi diritti, contattare: <strong>privacy@fixpro.it</strong>
            </p>
          </section>

          {/* 9. Cookies e tracciamento */}
          <section className="space-y-4">
            <h2 className="section-title">9. Cookies e Tecnologie di Tracciamento</h2>
            <p className="body-md">
              FixPro utilizza cookies e tecnologie simili per:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-semibold text-secondary shrink-0">Essenziali:</span>
                <span>Funzionamento della sessione, sicurezza, preferenze utente</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-secondary shrink-0">Analitiche:</span>
                <span>Comprensione dell&apos;uso della piattaforma (es. Google Analytics)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-secondary shrink-0">Marketing:</span>
                <span>Retargeting pubblicitario (previa consenso)</span>
              </li>
            </ul>
            <p className="body-sm mt-4">
              Potete disabilitare i cookies dal vostro browser o tramite strumenti di opt-out. I cookies essenziali rimangono attivi
              per il funzionamento della piattaforma.
            </p>
          </section>

          {/* 10. Sicurezza */}
          <section className="space-y-4">
            <h2 className="section-title">10. Misure di Sicurezza</h2>
            <p className="body-md">
              FixPro adotta le seguenti misure per proteggere i vostri dati:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Crittografia HTTPS per trasmissioni web</li>
              <li>Password protette con hashing sicuro e non memorizzate in chiaro</li>
              <li>Controlli di accesso e autenticazione multi-fattore</li>
              <li>Monitoraggio e log di accesso</li>
              <li>Isolamento di dati sensibili (pagamenti via Stripe tokenizzati)</li>
              <li>Backup regolari e disaster recovery</li>
              <li>Conformità a standard di sicurezza (OWASP, ISO 27001 principles)</li>
            </ul>
          </section>

          {/* 11. Modifiche all'informativa */}
          <section className="space-y-4">
            <h2 className="section-title">11. Modifiche all&apos;Informativa</h2>
            <p className="body-md">
              FixPro si riserva il diritto di aggiornare questa informativa in qualsiasi momento.
              Le modifiche significative saranno comunicate via email o banner in piattaforma.
              L&apos;uso continuato della piattaforma dopo le modifiche costituisce accettazione.
            </p>
          </section>

          {/* 12. Contatti */}
          <section className="space-y-4">
            <h2 className="section-title">12. Contatti</h2>
            <p className="body-md">
              Per domande, esercitare diritti o segnalare problematiche di privacy:
            </p>
            <div className="rounded-lg border border-border bg-muted p-4 text-sm space-y-3">
              <div>
                <p className="font-semibold text-secondary">Titolare del trattamento (FixPro)</p>
                <p className="text-muted-foreground">Email: privacy@fixpro.it</p>
              </div>
              <div>
                <p className="font-semibold text-secondary">Autorità Garante della Privacy (Italia)</p>
                <p className="text-muted-foreground">
                  <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    garanteprivacy.it
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Footer note */}
          <div className="border-t border-border pt-8 mt-12">
            <p className="text-xs text-muted-foreground">
              <strong>Ultima revisione:</strong> aprile 2026 |
              <strong> Versione:</strong> 1.0
            </p>
          </div>
        </div>
      </article>

      {/* Back link */}
      <div className="page-container py-8 border-t border-border">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          ← Torna alla home
        </Link>
      </div>
    </main>
  )
}
