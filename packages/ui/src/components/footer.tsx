import * as React from 'react'

const footerLinks = {
  piattaforma: [
    { href: '#come-funziona', label: 'Come funziona' },
    { href: '#settori', label: 'Settori' },
    { href: '#imprese', label: 'Per le imprese' },
    { href: '/blog', label: 'Blog' },
  ],
  legale: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/termini', label: 'Termini di servizio' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-secondary py-16 text-white">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="flex flex-col gap-3">
            <a href="/" className="text-xl font-bold text-white">
              Fix<span className="text-primary">Pro</span>
            </a>
            <p className="max-w-xs text-sm leading-relaxed text-white/72">
              Connetti con imprese artigianali verificate. Edilizia, impianti,
              finiture e molto altro.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white">
              Piattaforma
            </h3>
            <ul className="flex flex-col gap-2">
              {footerLinks.piattaforma.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-white/72 transition-colors duration-150 hover:text-white hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white">
              Legale
            </h3>
            <ul className="flex flex-col gap-2">
              {footerLinks.legale.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-white/72 transition-colors duration-150 hover:text-white hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/12 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/60">
            &copy; {new Date().getFullYear()} FixPro. Tutti i diritti riservati.
          </p>
          <p className="text-xs text-white/60">
            Piattaforma B2B2C per il mondo casa
          </p>
        </div>
      </div>
    </footer>
  )
}
