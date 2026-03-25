import { roms } from './romCatalog'
import siteContentData from '../content/site/site-content.json'
import type { SiteContentData } from './types'

export { roms }

export const quickStats = [
  { label: 'ROMs tracked', value: `${roms.length} ROMs` },
  { label: 'Supported devices', value: '2 devices' },
  { label: 'Release flow', value: 'Per-ROM tracking' },
]

const siteContent = siteContentData as SiteContentData

export const communityHub = siteContent.communityHub

export const sourceChanges = siteContent.sourceChanges

export const builderUpdates = siteContent.builderUpdates

export const supportMatrix = siteContent.supportMatrix

export const expansionCards = siteContent.expansionCards
