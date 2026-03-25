import { roms } from './romCatalog'
import type {
  BuilderUpdate,
  ExpansionCard,
  SourceChange,
  SupportDevice,
} from './types'

export { roms }

export const quickStats = [
  { label: 'ROMs tracked', value: `${roms.length} ROMs` },
  { label: 'Supported devices', value: '2 devices' },
  { label: 'Release flow', value: 'Per-ROM tracking' },
]

export const sourceChanges: SourceChange[] = [
  {
    title: 'Framework and SystemUI',
    date: 'March 24, 2026',
    summary:
      'Recent interface work focused on tightening motion, spacing, and readability across the current Android 16 base.',
    items: [
      'Quick settings and notification spacing were refined for better visual balance.',
      'App launch and return motion was tightened to feel quicker without becoming abrupt.',
      'Lockscreen contrast tuning improved legibility across brighter wallpapers.',
    ],
  },
  {
    title: 'Device Tree and Vendor',
    date: 'March 23, 2026',
    summary:
      'Shared device-side cleanup reduced duplicated maintenance between the Nothing Phone 2a and 2a Plus trees.',
    items: [
      'Common overlay and property alignment was cleaned up across both variants.',
      'Vendor-side adjustments were grouped to make future bring-up changes easier to track.',
      'Per-device divergence remains easy to call out when one lane needs separate handling.',
    ],
  },
  {
    title: 'Kernel and Thermal',
    date: 'March 21, 2026',
    summary:
      'Kernel-side and thermal-facing work continues to be summarized in plain language rather than raw commit lists.',
    items: [
      'Thermal messaging stays readable for users while still useful to testers.',
      'Kernel sync notes are short, specific, and easy to scan before flashing.',
      'The layout leaves room for follow-up fixes or hot builds when needed.',
    ],
  },
]

export const builderUpdates: BuilderUpdate[] = [
  {
    type: 'Workflow',
    date: 'March 25, 2026',
    title: 'Per-ROM release tracking is now the default layout',
    summary:
      'Each ROM now has a dedicated lane for version context, device targeting, and release-side notes instead of sharing one mixed release grid.',
  },
  {
    type: 'Device Focus',
    date: 'March 24, 2026',
    title: '2a Plus-specific work is easier to surface cleanly',
    summary:
      'Device-specific updates can now sit in their own ROM lanes without being buried inside shared release notes or generic changelog cards.',
  },
  {
    type: 'Scalability',
    date: 'March 23, 2026',
    title: 'The site is ready for more ROMs and more release lanes',
    summary:
      'The current structure scales cleanly if more ROMs, devices, or release metadata need to be added later.',
  },
]

export const supportMatrix: SupportDevice[] = [
  {
    badge: 'Primary target',
    name: 'Nothing Phone 2a',
    summary:
      'Structured for broad release visibility, concise changelog summaries, and stable-lane ROM coverage.',
    focus: 'Best for public drops, stable updates, and wider community-facing releases.',
  },
  {
    badge: 'Device-specific lane',
    name: 'Nothing Phone 2a Plus',
    summary:
      'The layout already supports separate notes when 2a Plus builds need their own timing, testing, or rollout context.',
    focus: 'Best for faster bring-up cycles, device-specific notes, and follow-up testing posts.',
  },
]

export const expansionCards: ExpansionCard[] = [
  {
    title: 'Add More ROMs',
    summary:
      'New ROMs can be added by extending the same content model without redesigning the homepage structure.',
  },
  {
    title: 'Map Release Links',
    summary:
      'Telegram release posts can be attached per ROM, per build, and swapped in without touching the layout itself.',
  },
  {
    title: 'Extend the Workflow',
    summary:
      'The current setup is ready for future JSON feeds, Git-based release data, or a lightweight content workflow when needed.',
  },
]
