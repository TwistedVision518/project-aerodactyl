import { roms } from './romCatalog'
import siteContentData from '../content/site/site-content.json'
import type { GcamEntry, SiteContentData } from './types'

export { roms }

export const quickStats = [
  { label: 'Active ROMs', value: `${roms.length} tracked` },
  { label: 'Devices covered', value: '2 shared targets' },
  { label: 'Release model', value: 'Per-ROM tracking' },
]

const siteContent = siteContentData as SiteContentData

export const communityHub = siteContent.communityHub

export const supportMatrix = siteContent.supportMatrix

export const expansionCards = siteContent.expansionCards

export const gcamEntries = siteContent.gcamEntries

export const comments = siteContent.comments

export type LatestUpdate = {
  title: string
  date: string
  category: string
  href: string
}

function toTimestamp(value: string) {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function toSectionId(name: string) {
  return `rom-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
}

function toGcamHref(entry: GcamEntry) {
  return entry.downloadUrl || entry.configUrl || '#gcams'
}

export const latestUpdates: LatestUpdate[] = [
  ...roms.map((rom) => ({
    title: `${rom.name} ${rom.version}`,
    date: rom.buildDate,
    category: 'ROM',
    href: `#${toSectionId(rom.name)}`,
  })),
  ...gcamEntries.map((entry) => ({
    title: `${entry.name} ${entry.build}`,
    date: entry.updatedAt,
    category: 'GCam',
    href: toGcamHref(entry),
  })),
]
  .sort((left, right) => toTimestamp(right.date) - toTimestamp(left.date))
  .slice(0, 6)

export const latestBuilds = [...roms]
  .sort((left, right) => toTimestamp(right.buildDate) - toTimestamp(left.buildDate))
  .slice(0, 3)

export const siteLastUpdated =
  latestUpdates[0]?.date ??
  roms
    .map((rom) => rom.buildDate)
    .sort((left, right) => toTimestamp(right) - toTimestamp(left))[0] ??
  ''
