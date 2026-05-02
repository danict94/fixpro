'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@fixpro/ui'
import { TabPanoramica } from './tabs/tab-panoramica'
import { TabAttivita } from './tabs/tab-attivita'
import { TabCategorie } from './tabs/tab-categorie'
import { TabZona } from './tabs/tab-zona'
import { TabMedia } from './tabs/tab-media'
import { TabNotifiche } from './tabs/tab-notifiche'
import { TabImpostazioni } from './tabs/tab-impostazioni'
import type { api } from '@/lib/trpc/server'

type Settori = Awaited<ReturnType<typeof api.taxonomy.getSettori>>

type TabId = 'panoramica' | 'attivita' | 'categorie' | 'zona' | 'media' | 'notifiche' | 'impostazioni'

const TABS: { id: TabId; label: string }[] = [
  { id: 'panoramica', label: 'Panoramica' },
  { id: 'attivita', label: 'Dati attività' },
  { id: 'categorie', label: 'Categorie' },
  { id: 'zona', label: 'Zone servite' },
  { id: 'notifiche', label: 'Notifiche' },
  { id: 'media', label: 'Media' },
  { id: 'impostazioni', label: 'Impostazioni' },
]

interface ProfiloTabsProps {
  initialTab: string
  ragioneSociale: string
  partitaIva: string | null
  slug: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  verified: boolean
  isShowcaseActive: boolean
  showcaseTier: string | null
  categoryCount: number
  city: string | null
  description: string | null
  phone: string | null
  logoUrl: string | null
  galleryCount: number
  website: string
  workType: 'SMALL' | 'FULL' | 'BOTH'
  settori: Settori
  selectedCategoriaIds: string[]
  selectedServizioIds: string[]
  radiusKm: number
  province: string
  companyId: string
  descriptionExtended: string
  coverImageUrl: string
  portfolioImages: Array<{
    id: string
    url: string
    caption: string | null
    createdAt: string
  }>
  notificationEmail: boolean
  notificationWhatsapp: boolean
}

export function ProfiloTabs(props: ProfiloTabsProps) {
  const router = useRouter()
  const validTab = TABS.find((t) => t.id === props.initialTab)?.id ?? 'panoramica'
  const [activeTab, setActiveTab] = useState<TabId>(validTab as TabId)

  function handleTabChange(id: TabId) {
    setActiveTab(id)
    router.replace(`/area-impresa/profilo?tab=${id}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div className="surface-section overflow-x-auto px-4 py-4 sm:px-5">
        <nav className="flex min-w-max gap-2" aria-label="Sezioni profilo">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'rounded-full px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-white text-muted-foreground ring-1 ring-border/60 hover:bg-muted/70 hover:text-secondary',
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-6">
        {activeTab === 'panoramica' && (
          <TabPanoramica
            ragioneSociale={props.ragioneSociale}
            partitaIva={props.partitaIva}
            slug={props.slug}
            status={props.status}
            verified={props.verified}
            isShowcaseActive={props.isShowcaseActive}
            showcaseTier={props.showcaseTier}
            categoryCount={props.categoryCount}
            city={props.city}
            description={props.description}
            phone={props.phone}
            logoUrl={props.logoUrl}
            galleryCount={props.galleryCount}
          />
        )}
        {activeTab === 'attivita' && (
          <TabAttivita
            ragioneSociale={props.ragioneSociale}
            partitaIva={props.partitaIva}
            description={props.description ?? ''}
            phone={props.phone ?? ''}
            website={props.website}
            workType={props.workType}
          />
        )}
        {activeTab === 'categorie' && (
          <TabCategorie
            settori={props.settori}
            selectedCategoriaIds={props.selectedCategoriaIds}
            selectedServizioIds={props.selectedServizioIds}
          />
        )}
        {activeTab === 'zona' && (
          <TabZona
            city={props.city ?? ''}
            province={props.province}
            radiusKm={props.radiusKm}
          />
        )}
        {activeTab === 'notifiche' && (
          <TabNotifiche
            notificationEmail={props.notificationEmail}
            notificationWhatsapp={props.notificationWhatsapp}
          />
        )}
        {activeTab === 'media' && (
          <TabMedia
            companyId={props.companyId}
            logoUrl={props.logoUrl ?? ''}
            descriptionExtended={props.descriptionExtended}
            coverImageUrl={props.coverImageUrl}
            portfolioImages={props.portfolioImages}
            isShowcaseActive={props.isShowcaseActive}
          />
        )}
        {activeTab === 'impostazioni' && (
          <TabImpostazioni />
        )}
      </div>
    </div>
  )
}
