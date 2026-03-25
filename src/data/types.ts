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
  maintenanceNote: string
  accent: string
  accentSoft: string
  accentStrong: string
  highlights: string[]
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
