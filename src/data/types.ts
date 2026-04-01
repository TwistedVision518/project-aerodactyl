export type ReleaseLink = {
  label: string
  url: string
}

export type GcamEntry = {
  name: string
  build: string
  updatedAt: string
  devices: string[]
  summary: string
  downloadUrl: string
  configUrl: string
}

export type CommentsConfig = {
  enabled: boolean
  provider: 'giscus'
  repo: string
  repoId: string
  category: string
  categoryId: string
  mapping: 'specific'
  theme: string
  lang: string
}

export type RomEntry = {
  order: number
  name: string
  version: string
  status: string
  branch: string
  tagline: string
  buildDate: string
  devices: string[]
  channelLabel: string
  telegramUrl: string
  telegramLinks?: ReleaseLink[]
  maintenanceNote: string
  accent: string
  accentSoft: string
  accentStrong: string
  highlights: string[]
  changelog: string[]
}

export type SourceChange = {
  title: string
  date: string
  summary: string
  items: string[]
}

export type BuilderUpdate = {
  type: string
  date: string
  title: string
  summary: string
}

export type SupportDevice = {
  badge: string
  name: string
  summary: string
  focus: string
}

export type ExpansionCard = {
  title: string
  summary: string
}

export type CommunityHub = {
  title: string
  summary: string
  highlights: string[]
  ctaLabel: string
  telegramUrl: string
}

export type SiteContentData = {
  communityHub: CommunityHub
  sourceChanges: SourceChange[]
  builderUpdates: BuilderUpdate[]
  supportMatrix: SupportDevice[]
  expansionCards: ExpansionCard[]
  gcamEntries: GcamEntry[]
  comments: CommentsConfig
}
