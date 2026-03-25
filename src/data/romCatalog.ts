import type { RomEntry } from './types'

const romModules = import.meta.glob<RomEntry>('../content/roms/*.json', {
  eager: true,
  import: 'default',
})

export const roms = Object.values(romModules).sort((left, right) => left.order - right.order)
