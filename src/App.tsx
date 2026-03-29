import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import {
  AnimatePresence,
  LayoutGroup,
  LazyMotion,
  domAnimation,
  m,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { flushSync } from 'react-dom'
import './App.css'
import { LoadingScreen } from './components/LoadingScreen'
import { ReactivePanel } from './components/ReactivePanel'
import { Reveal } from './components/Reveal'
import type { GcamEntry, ReleaseLink, RomEntry } from './data/types'
import {
  communityHub,
  expansionCards,
  gcamEntries,
  latestBuilds,
  latestUpdates,
  roms,
  siteLastUpdated,
  supportMatrix,
} from './data/siteContent'

type SectionId = 'top' | 'pinned-builds' | 'rom-directory' | 'gcams' | 'devices'
type ThemeMode = 'dark' | 'light'
type AvailabilityFilter = 'all' | 'available' | 'tracking'
type DeviceFilter = 'all' | 'pacman' | 'pacmanpro'
type SortMode = 'latest' | 'alphabetical'

type AccentStyle = CSSProperties & {
  '--accent'?: string
  '--accent-soft'?: string
  '--accent-strong'?: string
}

type SectionLink = {
  id: SectionId
  label: string
  shortLabel: string
}

const sectionLinks: SectionLink[] = [
  { id: 'top', label: 'Home', shortLabel: 'Home' },
  { id: 'pinned-builds', label: 'Command', shortLabel: 'Command' },
  { id: 'rom-directory', label: 'ROMs', shortLabel: 'ROMs' },
  { id: 'gcams', label: 'Camera', shortLabel: 'Camera' },
  { id: 'devices', label: 'Devices', shortLabel: 'Devices' },
]

const sectionIdSet = new Set<SectionId>(sectionLinks.map((item) => item.id))

function resolveSectionTarget(hash: string) {
  const normalizedHash = hash.replace(/^#/, '').trim().toLowerCase()

  if (!normalizedHash) {
    return 'top'
  }

  if (sectionIdSet.has(normalizedHash as SectionId)) {
    return normalizedHash as SectionId
  }

  if (normalizedHash.startsWith('rom-')) {
    return 'rom-directory'
  }

  return null
}

function resolveRomTarget(hash: string) {
  const normalizedHash = hash.replace(/^#/, '').trim().toLowerCase()

  return normalizedHash.startsWith('rom-') ? normalizedHash : null
}

function SunIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.75v2.5M12 18.75v2.5M21.25 12h-2.5M5.25 12h-2.5M18.54 5.46l-1.77 1.77M7.23 16.77l-1.77 1.77M18.54 18.54l-1.77-1.77M7.23 7.23 5.46 5.46" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M20.2 14.2A8.75 8.75 0 1 1 9.8 3.8a7 7 0 0 0 10.4 10.4Z" />
    </svg>
  )
}

function DockGlyph({ section }: { section: SectionId }) {
  const commonProps = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
  }

  switch (section) {
    case 'top':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path {...commonProps} d="M4 11.5 12 4l8 7.5" />
          <path {...commonProps} d="M7 10.5V20h10v-9.5" />
        </svg>
      )
    case 'pinned-builds':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path {...commonProps} d="m12 3 2.1 4.6 5 .6-3.7 3.4 1 4.9L12 14.1 7.6 16.5l1-4.9L4.9 8.2l5-.6L12 3Z" />
        </svg>
      )
    case 'rom-directory':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <rect {...commonProps} x="4" y="5" width="16" height="14" rx="3" />
          <path {...commonProps} d="M8 9.5h8M8 13h8M8 16.5h4.5" />
        </svg>
      )
    case 'gcams':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path {...commonProps} d="M8.2 7.5 9.7 5h4.6l1.5 2.5H18a2 2 0 0 1 2 2v6.8A2.7 2.7 0 0 1 17.3 19H6.7A2.7 2.7 0 0 1 4 16.3V9.5a2 2 0 0 1 2-2Z" />
          <circle {...commonProps} cx="12" cy="13" r="3.3" />
        </svg>
      )
    case 'devices':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <rect {...commonProps} x="7.3" y="3.5" width="9.4" height="17" rx="2.5" />
          <path {...commonProps} d="M10.4 6.6h3.2M11.2 17.3h1.6" />
        </svg>
      )
  }
}

function toSectionId(name: string) {
  return `rom-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
}

function hasReleaseLink(url: string) {
  return Boolean(url) && (url.startsWith('https://t.me/') || url.startsWith('https://'))
}

function getReleaseLinks(rom: RomEntry): ReleaseLink[] {
  if (rom.telegramLinks?.length) {
    return rom.telegramLinks.filter((entry) => hasReleaseLink(entry.url))
  }

  return hasReleaseLink(rom.telegramUrl)
    ? [{ label: 'Release post', url: rom.telegramUrl }]
    : []
}

function getGcamLinks(entry: GcamEntry): ReleaseLink[] {
  return [
    { label: `${entry.name} APK`, url: entry.downloadUrl },
    { label: 'XML Config', url: entry.configUrl },
  ].filter((link) => hasReleaseLink(link.url))
}

function formatMaintenanceNote(value: string) {
  return value.replace(/^Current focus:\s*/i, '')
}

function toTimestamp(value: string) {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function formatFreshness(value: string) {
  const timestamp = toTimestamp(value)

  if (!timestamp) {
    return 'Freshness unknown'
  }

  const differenceInDays = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000))

  if (differenceInDays === 0) {
    return 'Updated today'
  }

  if (differenceInDays === 1) {
    return 'Updated 1 day ago'
  }

  return `Updated ${differenceInDays} days ago`
}

function getDeviceLabel(filter: DeviceFilter) {
  switch (filter) {
    case 'pacman':
      return 'Nothing Phone 2a'
    case 'pacmanpro':
      return 'Nothing Phone 2a Plus'
    default:
      return 'All devices'
  }
}

function getAvailabilityLabel(filter: AvailabilityFilter) {
  switch (filter) {
    case 'available':
      return 'Release links ready'
    case 'tracking':
      return 'Tracked releases only'
    default:
      return 'All release states'
  }
}

function getDeviceSummary(devices: string[]) {
  return devices.length > 1 ? '2a + 2a Plus' : devices[0]?.replace(/^Nothing Phone\s+/i, '') ?? 'Single device'
}

function getLinkSummary(links: ReleaseLink[]) {
  return links.length === 1 ? '1 live link' : `${links.length} live links`
}

function matchesDeviceFilter(rom: RomEntry, filter: DeviceFilter) {
  if (filter === 'all') {
    return true
  }

  return rom.devices.some((device) =>
    filter === 'pacman'
      ? device.toLowerCase().includes('2a') && !device.toLowerCase().includes('plus')
      : device.toLowerCase().includes('plus'),
  )
}

function availabilityStateFor(rom: RomEntry) {
  return getReleaseLinks(rom).length > 0 ? 'available' : 'tracking'
}

function App() {
  const [loading, setLoading] = useState(true)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'dark'
    }

    const stored = window.localStorage.getItem('project-aerodactyl-theme')
    if (stored === 'dark' || stored === 'light') {
      return stored
    }

    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })
  const [activeSection, setActiveSection] = useState<SectionId>('top')
  const [romQuery, setRomQuery] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all')
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>('all')
  const [sortMode, setSortMode] = useState<SortMode>('latest')
  const [communityLinkCopied, setCommunityLinkCopied] = useState(false)
  const [expandedReleaseNotes, setExpandedReleaseNotes] = useState<Record<string, boolean>>({})
  const [activeRomId, setActiveRomId] = useState<string | null>(null)
  const [selectedResourceByRom, setSelectedResourceByRom] = useState<Record<string, string>>({})
  const [resourceMenuOpen, setResourceMenuOpen] = useState(false)
  const [pointerSceneEnabled, setPointerSceneEnabled] = useState(false)
  const resourceMenuRef = useRef<HTMLDivElement | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const sceneCursorX = useMotionValue(0)
  const sceneCursorY = useMotionValue(0)
  const scenePointerOffsetX = useMotionValue(0)
  const scenePointerOffsetY = useMotionValue(0)
  const scenePointerActive = useMotionValue(0)
  const sceneCursorXSpring = useSpring(sceneCursorX, { stiffness: 170, damping: 28, mass: 0.35 })
  const sceneCursorYSpring = useSpring(sceneCursorY, { stiffness: 170, damping: 28, mass: 0.35 })
  const scenePointerOffsetXSpring = useSpring(scenePointerOffsetX, { stiffness: 90, damping: 24, mass: 0.45 })
  const scenePointerOffsetYSpring = useSpring(scenePointerOffsetY, { stiffness: 90, damping: 24, mass: 0.45 })
  const scenePointerActiveSpring = useSpring(scenePointerActive, { stiffness: 90, damping: 22, mass: 0.4 })

  const deferredQuery = useDeferredValue(romQuery)
  const communityHubHasLink = hasReleaseLink(communityHub.telegramUrl)
  const releaseReadyRoms = useMemo(
    () =>
      [...roms]
        .filter((rom) => getReleaseLinks(rom).length > 0)
        .sort((left, right) => toTimestamp(right.buildDate) - toTimestamp(left.buildDate)),
    [],
  )
  const featuredRom = roms.find((rom) => rom.name === 'Evolution X') ?? latestBuilds[0] ?? roms[0]
  const homeLaunchRoms = (releaseReadyRoms.length > 0 ? releaseReadyRoms : latestBuilds).slice(0, 3)
  const trackedOnlyCount = roms.length - releaseReadyRoms.length
  const dualTargetCount = roms.filter((rom) => rom.devices.length > 1).length
  const filteredRoms = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase()

    const nextRoms = roms.filter((rom) => {
      const matchesQuery =
        query.length === 0 ||
        rom.name.toLowerCase().includes(query) ||
        rom.version.toLowerCase().includes(query) ||
        rom.branch.toLowerCase().includes(query) ||
        rom.status.toLowerCase().includes(query) ||
        rom.tagline.toLowerCase().includes(query) ||
        rom.devices.some((device) => device.toLowerCase().includes(query)) ||
        rom.highlights.some((item) => item.toLowerCase().includes(query))

      const matchesAvailability =
        availabilityFilter === 'all' || availabilityStateFor(rom) === availabilityFilter

      return matchesQuery && matchesAvailability && matchesDeviceFilter(rom, deviceFilter)
    })

    return nextRoms.sort((left, right) => {
      if (sortMode === 'alphabetical') {
        return left.name.localeCompare(right.name)
      }

      return toTimestamp(right.buildDate) - toTimestamp(left.buildDate)
    })
  }, [availabilityFilter, deferredQuery, deviceFilter, sortMode])
  const resolvedActiveRomId = useMemo(() => {
    if (filteredRoms.length === 0) {
      return null
    }

    return activeRomId && filteredRoms.some((rom) => toSectionId(rom.name) === activeRomId)
      ? activeRomId
      : toSectionId(filteredRoms[0].name)
  }, [activeRomId, filteredRoms])
  const selectedRom = useMemo(() => {
    if (filteredRoms.length === 0) {
      return null
    }

    return filteredRoms.find((rom) => toSectionId(rom.name) === resolvedActiveRomId) ?? filteredRoms[0]
  }, [filteredRoms, resolvedActiveRomId])
  const selectedRomIndex = useMemo(
    () => (selectedRom ? filteredRoms.findIndex((rom) => rom.name === selectedRom.name) : -1),
    [filteredRoms, selectedRom],
  )
  const selectedRomLinks = useMemo(
    () => (selectedRom ? getReleaseLinks(selectedRom) : []),
    [selectedRom],
  )
  const selectedResourceUrl =
    selectedRom && selectedRomLinks.length > 0
      ? selectedResourceByRom[selectedRom.name] ?? selectedRomLinks[0].url
      : ''
  const selectedResourceLink =
    selectedRomLinks.find((link) => link.url === selectedResourceUrl) ?? selectedRomLinks[0] ?? null
  const latestSignal = latestUpdates[0] ?? null
  const releaseRadarRoms = (releaseReadyRoms.length > 0 ? releaseReadyRoms : latestBuilds).slice(0, 4)
  const hasActiveExplorerFilters =
    romQuery.length > 0 ||
    availabilityFilter !== 'all' ||
    deviceFilter !== 'all' ||
    sortMode !== 'latest'
  const sceneCursorGlowOpacity = useTransform(scenePointerActiveSpring, [0, 1], [0, 0.9])
  const sceneLeftX = useTransform(scenePointerOffsetXSpring, [-0.5, 0.5], [-150, 150])
  const sceneLeftY = useTransform(scenePointerOffsetYSpring, [-0.5, 0.5], [-42, 42])
  const sceneLeftRotate = useTransform(scenePointerOffsetXSpring, [-0.5, 0.5], [6, 18])
  const sceneLeftScale = useTransform(scenePointerOffsetYSpring, [-0.5, 0.5], [0.98, 1.08])
  const sceneRightX = useTransform(scenePointerOffsetXSpring, [-0.5, 0.5], [150, -150])
  const sceneRightY = useTransform(scenePointerOffsetYSpring, [-0.5, 0.5], [-38, 38])
  const sceneRightRotate = useTransform(scenePointerOffsetXSpring, [-0.5, 0.5], [-18, -6])
  const sceneRightScale = useTransform(scenePointerOffsetYSpring, [-0.5, 0.5], [1.08, 0.98])
  const sceneTopX = useTransform(scenePointerOffsetXSpring, [-0.5, 0.5], [-72, 72])
  const sceneTopY = useTransform(scenePointerOffsetYSpring, [-0.5, 0.5], [-30, 30])
  const sceneTopRotate = useTransform(scenePointerOffsetXSpring, [-0.5, 0.5], [-6, 6])
  const sceneTopScale = useTransform(scenePointerOffsetYSpring, [-0.5, 0.5], [1.05, 0.97])
  const sceneMiddleX = useTransform(scenePointerOffsetXSpring, [-0.5, 0.5], [42, -42])
  const sceneMiddleY = useTransform(scenePointerOffsetYSpring, [-0.5, 0.5], [-18, 18])
  const sceneMiddleRotate = useTransform(scenePointerOffsetXSpring, [-0.5, 0.5], [4, -4])
  const sceneMiddleScale = useTransform(scenePointerOffsetYSpring, [-0.5, 0.5], [0.98, 1.04])
  const motionEase = [0.22, 1, 0.36, 1] as const
  const isNativeApp = Capacitor.isNativePlatform()
  const usesCoarsePointer = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: none), (pointer: coarse)').matches

  const heroContainerVariants = prefersReducedMotion
    ? undefined
    : {
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.08,
            delayChildren: 0.08,
          },
        },
      }
  const heroItemVariants = prefersReducedMotion
    ? undefined
    : {
        hidden: { opacity: 0, y: 20 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.52, ease: motionEase },
        },
      }
  const heroPanelVariants = prefersReducedMotion
    ? undefined
    : {
        hidden: { opacity: 0, x: 20 },
        show: {
          opacity: 1,
          x: 0,
          transition: { duration: 0.58, ease: motionEase, delay: 0.12 },
        },
      }

  const featuredStyle: AccentStyle = {
    '--accent': featuredRom.accent,
    '--accent-soft': featuredRom.accentSoft,
    '--accent-strong': featuredRom.accentStrong,
  }
  const gcamStyle: AccentStyle = {
    '--accent': '#8db7ff',
    '--accent-soft': 'rgba(141, 183, 255, 0.18)',
    '--accent-strong': '#bed5ff',
  }
  const deviceStyle: AccentStyle = {
    '--accent': '#7fd7bc',
    '--accent-soft': 'rgba(127, 215, 188, 0.18)',
    '--accent-strong': '#d6fff2',
  }

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode
    document.documentElement.style.colorScheme = themeMode
    window.localStorage.setItem('project-aerodactyl-theme', themeMode)
  }, [themeMode])

  useEffect(() => {
    if (!isNativeApp) {
      return
    }

    void StatusBar.setOverlaysWebView({ overlay: false }).catch(() => undefined)
  }, [isNativeApp])

  useEffect(() => {
    if (!isNativeApp) {
      return
    }

    const backgroundColor = themeMode === 'light' ? '#eef2ff' : '#06070d'
    const style = themeMode === 'light' ? Style.Dark : Style.Light

    void Promise.allSettled([
      StatusBar.setBackgroundColor({ color: backgroundColor }),
      StatusBar.setStyle({ style }),
    ])
  }, [isNativeApp, themeMode])

  useEffect(() => {
    if (!isNativeApp || loading) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void SplashScreen.hide({ fadeOutDuration: 220 }).catch(() => undefined)
    }, 90)

    return () => window.clearTimeout(timeoutId)
  }, [isNativeApp, loading])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    const syncPointerScene = () => setPointerSceneEnabled(mediaQuery.matches)

    syncPointerScene()

    mediaQuery.addEventListener('change', syncPointerScene)

    return () => mediaQuery.removeEventListener('change', syncPointerScene)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion) {
      sceneCursorX.set(0)
      sceneCursorY.set(0)
      scenePointerOffsetX.set(0)
      scenePointerOffsetY.set(0)
      scenePointerActive.set(0)
      return
    }

    if (!pointerSceneEnabled) {
      scenePointerOffsetX.set(0)
      scenePointerOffsetY.set(0)
      scenePointerActive.set(0)
      return
    }

    sceneCursorX.set(window.innerWidth * 0.5)
    sceneCursorY.set(window.innerHeight * 0.72)

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        return
      }

      sceneCursorX.set(event.clientX)
      sceneCursorY.set(event.clientY)
      scenePointerOffsetX.set(event.clientX / window.innerWidth - 0.5)
      scenePointerOffsetY.set(event.clientY / window.innerHeight - 0.5)
      scenePointerActive.set(1)
    }

    const resetPointer = () => {
      scenePointerOffsetX.set(0)
      scenePointerOffsetY.set(0)
      scenePointerActive.set(0)
    }

    const handleWindowMouseOut = (event: MouseEvent) => {
      if (event.relatedTarget === null) {
        resetPointer()
      }
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('mouseout', handleWindowMouseOut)
    window.addEventListener('blur', resetPointer)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('mouseout', handleWindowMouseOut)
      window.removeEventListener('blur', resetPointer)
    }
  }, [
    pointerSceneEnabled,
    prefersReducedMotion,
    sceneCursorX,
    sceneCursorY,
    scenePointerActive,
    scenePointerOffsetX,
    scenePointerOffsetY,
  ])

  useEffect(() => {
    const syncActiveSectionFromHash = () => {
      const nextRomId = resolveRomTarget(window.location.hash)
      const nextSection = resolveSectionTarget(window.location.hash)

      setActiveRomId(nextRomId)

      if (nextSection) {
        setActiveSection(nextSection)
      }
    }

    syncActiveSectionFromHash()
    window.addEventListener('hashchange', syncActiveSectionFromHash)

    return () => window.removeEventListener('hashchange', syncActiveSectionFromHash)
  }, [])

  useEffect(() => {
    if (!resourceMenuOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        resourceMenuRef.current &&
        event.target instanceof Node &&
        !resourceMenuRef.current.contains(event.target)
      ) {
        setResourceMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setResourceMenuOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [resourceMenuOpen])

  useEffect(() => {
    const sections = sectionLinks
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element))

    if (sections.length === 0) {
      return
    }

    const coarsePointerQuery = window.matchMedia('(hover: none), (pointer: coarse)')

    if (coarsePointerQuery.matches) {
      const syncActiveSectionFromScroll = () => {
        const activationLine = window.scrollY + window.innerHeight * 0.38
        let nextSection: SectionId = 'top'

        for (const section of sections) {
          if (section.offsetTop <= activationLine) {
            const resolvedSection = resolveSectionTarget(`#${section.id}`)

            if (resolvedSection) {
              nextSection = resolvedSection
            }
          }
        }

        setActiveSection((current) => (current === nextSection ? current : nextSection))
      }

      let syncFrame = 0
      const scheduleSectionSync = () => {
        if (syncFrame) {
          return
        }

        syncFrame = window.requestAnimationFrame(() => {
          syncFrame = 0
          syncActiveSectionFromScroll()
        })
      }

      syncActiveSectionFromScroll()
      window.addEventListener('scroll', scheduleSectionSync, { passive: true })
      window.addEventListener('resize', scheduleSectionSync)

      return () => {
        if (syncFrame) {
          window.cancelAnimationFrame(syncFrame)
        }

        window.removeEventListener('scroll', scheduleSectionSync)
        window.removeEventListener('resize', scheduleSectionSync)
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const activeEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0]

        if (activeEntry?.target.id) {
          const nextSection = resolveSectionTarget(`#${activeEntry.target.id}`)

          if (nextSection) {
            setActiveSection(nextSection)
          }
        }
      },
      {
        rootMargin: '-30% 0px -50% 0px',
        threshold: [0.18, 0.35, 0.55, 0.75],
      },
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  const handleSectionAnchorClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    const href = event.currentTarget.getAttribute('href')

    if (!href?.startsWith('#')) {
      return
    }

    setActiveRomId(resolveRomTarget(href))

    const nextSection = resolveSectionTarget(href)

    if (nextSection) {
      setActiveSection(nextSection)
    }
  }

  const scrollSelectedRomIntoView = () => {
    const scrollBehavior: ScrollBehavior =
      prefersReducedMotion || usesCoarsePointer() ? 'auto' : 'smooth'

    window.requestAnimationFrame(() => {
      document
        .getElementById('rom-detail-panel')
        ?.scrollIntoView({ behavior: scrollBehavior, block: 'start' })
    })
  }

  const handleRomAnchorClick = (event: ReactMouseEvent<HTMLAnchorElement>, romId: string) => {
    event.preventDefault()
    setResourceMenuOpen(false)
    setActiveRomId(romId)
    setActiveSection('rom-directory')
    window.history.pushState(null, '', `#${romId}`)
    scrollSelectedRomIntoView()
  }

  const selectRomByIndex = (nextIndex: number) => {
    const nextRom = filteredRoms[nextIndex]

    if (!nextRom) {
      return
    }

    const nextRomId = toSectionId(nextRom.name)
    setResourceMenuOpen(false)
    setActiveRomId(nextRomId)
    setActiveSection('rom-directory')
    window.history.pushState(null, '', `#${nextRomId}`)
    scrollSelectedRomIntoView()
  }

  const handleLatestUpdateClick = (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith('#rom-')) {
      return
    }

    handleRomAnchorClick(event, href.slice(1))
  }

  const toggleTheme = () => {
    if (prefersReducedMotion) {
      setThemeMode(themeMode === 'light' ? 'dark' : 'light')
      return
    }

    const nextTheme = themeMode === 'light' ? 'dark' : 'light'
    const startViewTransition = document.startViewTransition?.bind(document)

    if (!startViewTransition) {
      setThemeMode(nextTheme)
      return
    }

    document.documentElement.dataset.themeSwitching = 'true'

    const transition = startViewTransition(() => {
      flushSync(() => {
        setThemeMode(nextTheme)
      })
    })

    transition.ready
      .then(async () => {
        const oldLayer = document.documentElement.animate(
          {
            opacity: [1, 0],
          },
          {
            duration: 180,
            easing: 'cubic-bezier(0.4, 0, 1, 1)',
            fill: 'both',
            pseudoElement: '::view-transition-old(root)',
          },
        )

        const newLayer = document.documentElement.animate(
          {
            opacity: [0, 1],
          },
          {
            duration: 260,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'both',
            pseudoElement: '::view-transition-new(root)',
          },
        )

        await Promise.allSettled([oldLayer.finished, newLayer.finished])
      })
      .finally(() => {
        delete document.documentElement.dataset.themeSwitching
      })
  }

  const handleCommunityCopy = async () => {
    if (!communityHub.telegramUrl || !navigator.clipboard?.writeText) {
      return
    }

    await navigator.clipboard.writeText(communityHub.telegramUrl)
    setCommunityLinkCopied(true)
    window.setTimeout(() => setCommunityLinkCopied(false), 1800)
  }

  const resetFilters = () => {
    startTransition(() => {
      setRomQuery('')
      setAvailabilityFilter('all')
      setDeviceFilter('all')
      setSortMode('latest')
    })
  }

  const toggleReleaseNotes = (romName: string) => {
    setExpandedReleaseNotes((current) => ({
      ...current,
      [romName]: !current[romName],
    }))
  }

  return (
    <>
      {loading ? <LoadingScreen onComplete={() => setLoading(false)} /> : null}

      <LazyMotion features={domAnimation}>
        <div className="app-shell scene-root">
          <div className="interactive-scene" aria-hidden="true">
            <div className="scene-vignette" />
            <m.div
              className="scene-cursor-glow"
              style={
                prefersReducedMotion || !pointerSceneEnabled
                  ? undefined
                  : { x: sceneCursorXSpring, y: sceneCursorYSpring, opacity: sceneCursorGlowOpacity }
              }
            />
            <m.div
              className="scene-gradient scene-gradient-left"
              style={
                prefersReducedMotion || !pointerSceneEnabled
                  ? undefined
                  : { x: sceneLeftX, y: sceneLeftY, rotate: sceneLeftRotate, scale: sceneLeftScale }
              }
            />
            <m.div
              className="scene-gradient scene-gradient-right"
              style={
                prefersReducedMotion || !pointerSceneEnabled
                  ? undefined
                  : { x: sceneRightX, y: sceneRightY, rotate: sceneRightRotate, scale: sceneRightScale }
              }
            />
            <m.div
              className="scene-gradient scene-gradient-top"
              style={
                prefersReducedMotion || !pointerSceneEnabled
                  ? undefined
                  : { x: sceneTopX, y: sceneTopY, rotate: sceneTopRotate, scale: sceneTopScale }
              }
            />
            <m.div
              className="scene-gradient scene-gradient-middle"
              style={
                prefersReducedMotion || !pointerSceneEnabled
                  ? undefined
                  : { x: sceneMiddleX, y: sceneMiddleY, rotate: sceneMiddleRotate, scale: sceneMiddleScale }
              }
            />
            <div className="scene-grid" />
            <div className="scene-noise" />
          </div>

          <div className="experience-shell" data-loaded={!loading}>
            <header className="topbar">
          <div className="topbar-content">
            <a className="brand" href="#top" onClick={handleSectionAnchorClick}>
              <span className="brand-mark" aria-hidden="true">
                <img alt="" className="brand-mark-image" src="/favicon.svg" />
              </span>
              <span className="brand-copy">
                <strong>Project Aerodactyl</strong>
                <small>Nothing Phone 2a release hub</small>
              </span>
            </a>

            <nav className="nav-links" aria-label="Primary">
              {sectionLinks.map((item) => (
                <m.a
                  aria-current={activeSection === item.id ? 'page' : undefined}
                  href={`#${item.id}`}
                  key={item.id}
                  onClick={handleSectionAnchorClick}
                  whileHover={prefersReducedMotion ? undefined : { y: -1.5 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                >
                  {activeSection === item.id ? <m.span className="nav-active-pill" layoutId="nav-active-pill" /> : null}
                  <span className="nav-link-label">{item.label}</span>
                </m.a>
              ))}
            </nav>

            <div className="topbar-actions">
              <button
                aria-label={themeMode === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
                className={`control-toggle ${themeMode === 'light' ? 'is-active' : ''}`.trim()}
                onClick={toggleTheme}
                type="button"
              >
                {themeMode === 'light' ? <SunIcon /> : <MoonIcon />}
              </button>
              {communityHubHasLink ? (
                <a className="topbar-button topbar-button-secondary" href={communityHub.telegramUrl} rel="noreferrer" target="_blank">
                  Community
                </a>
              ) : null}
              <a className="topbar-button topbar-button-primary" href="#rom-directory" onClick={handleSectionAnchorClick}>
                Explore ROMs
              </a>
            </div>
          </div>
            </header>

            <main className="page" id="top">
          <Reveal>
            <section className="hero panel" data-hub-accent="true" style={featuredStyle}>
              <m.div
                animate={prefersReducedMotion ? undefined : 'show'}
                className="hero-copy"
                initial={prefersReducedMotion ? false : 'hidden'}
                variants={heroContainerVariants}
              >
                <div className="hero-copy-atmosphere" aria-hidden="true">
                  <div className="hero-copy-orb hero-copy-orb-primary" />
                  <div className="hero-copy-orb hero-copy-orb-secondary" />
                </div>

                <m.div className="hero-kicker-row" variants={heroItemVariants}>
                  <span className="tonal-chip">Nothing Phone 2a / 2a Plus</span>
                  <span className="ghost-pill">Updated {siteLastUpdated}</span>
                </m.div>

                <m.p className="eyebrow" variants={heroItemVariants}>Release hub</m.p>
                <m.h1 variants={heroItemVariants}>Nothing Phone 2a Release Hub.</m.h1>
                <m.p className="lede" variants={heroItemVariants}>
                  ROM downloads, release links, camera tools, and device support for the Nothing Phone 2a and 2a Plus.
                </m.p>

                <m.div className="hero-actions" variants={heroItemVariants}>
                  <a className="action-primary" href="#rom-directory" onClick={handleSectionAnchorClick}>
                    Open ROM library
                  </a>
                  {communityHubHasLink ? (
                    <a
                      className="action-secondary"
                      href={communityHub.telegramUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open Telegram
                    </a>
                  ) : null}
                </m.div>

                <m.p className="hero-proofline" variants={heroItemVariants}>
                  Open a release, check the links, and get what you need quickly.
                </m.p>

                <m.div className="hero-ledger surface-utility" variants={heroItemVariants}>
                  <div className="hero-ledger-head">
                    <div>
                      <span className="section-label">Desk notes</span>
                      <strong>Live releases first, tracked builds second.</strong>
                    </div>
                    <span className="ghost-pill">{releaseRadarRoms.length} live now</span>
                  </div>

                  <div className="hero-ledger-rows" aria-label="Current live release ledger">
                    {releaseRadarRoms.map((rom, index) => {
                      const links = getReleaseLinks(rom)
                      const romId = toSectionId(rom.name)
                      const isActiveLedgerRom = resolvedActiveRomId === romId

                      return (
                        <m.a
                          className={`hero-ledger-row ${isActiveLedgerRom ? 'is-active' : ''}`.trim()}
                          href={`#${romId}`}
                          key={rom.name}
                          onClick={(event) => handleRomAnchorClick(event, romId)}
                          transition={{ duration: 0.3, ease: motionEase }}
                          whileHover={prefersReducedMotion ? undefined : { x: 4 }}
                          whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                        >
                          {isActiveLedgerRom ? <m.span className="hero-ledger-row-highlight" layoutId="hero-ledger-row-highlight" /> : null}

                          <div className="hero-ledger-row-index">
                            <span>{String(index + 1).padStart(2, '0')}</span>
                            <small>{formatFreshness(rom.buildDate)}</small>
                          </div>

                          <div className="hero-ledger-row-copy">
                            <div className="hero-ledger-row-topline">
                              <strong>{rom.name}</strong>
                              <span>{rom.version}</span>
                            </div>
                            <p>{rom.tagline}</p>
                          </div>

                          <div className="hero-ledger-row-meta">
                            <span>{getDeviceSummary(rom.devices)}</span>
                            <span>{getLinkSummary(links)}</span>
                          </div>
                        </m.a>
                      )
                    })}
                  </div>

                  <div className="hero-ledger-footer" aria-label="Desk summary">
                    <span><strong>{roms.length}</strong> tracked ROMs</span>
                    <span><strong>{releaseReadyRoms.length}</strong> direct links live</span>
                    <span><strong>{dualTargetCount}</strong> dual-device releases</span>
                  </div>
                </m.div>
              </m.div>

              <m.div
                animate={prefersReducedMotion ? undefined : 'show'}
                className="hero-stage"
                initial={prefersReducedMotion ? false : 'hidden'}
                variants={heroPanelVariants}
              >
                <ReactivePanel as="article" className="hero-launchpad surface-editorial" intensity={0.78} style={featuredStyle}>
                  <div className="hero-launchpad-atmosphere" aria-hidden="true">
                    <div className="hero-launchpad-orb hero-launchpad-orb-primary" />
                    <div className="hero-launchpad-orb hero-launchpad-orb-secondary" />
                    <div className="hero-launchpad-grid" />
                  </div>

                  <div className="feature-topline launchpad-topline">
                    <span className="feature-badge">Launchpad</span>
                    <span className="launchpad-live-pill">{releaseReadyRoms.length} live releases</span>
                  </div>

                  <div className="launchpad-header">
                    <div>
                      <h2>Open a build fast.</h2>
                      <p>Pick a live release from the list below and jump straight to the files people actually need.</p>
                    </div>

                    <div className="launchpad-summary">
                      <span className="meta-pill">{homeLaunchRoms.length} ready now</span>
                      <span className="meta-pill">{trackedOnlyCount} tracked only</span>
                    </div>
                  </div>

                  <div className="launchpad-list" aria-label="Latest live releases">
                    {homeLaunchRoms.map((rom, index) => {
                      const romId = toSectionId(rom.name)
                      const links = getReleaseLinks(rom)
                      const isActiveLaunchRom = resolvedActiveRomId === romId

                      return (
                        <m.a
                          animate={{ opacity: 1, y: 0 }}
                          className={`launchpad-row ${isActiveLaunchRom ? 'is-active' : ''}`.trim()}
                          href={`#${romId}`}
                          initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                          key={rom.name}
                          onClick={(event) => handleRomAnchorClick(event, romId)}
                          transition={{ delay: 0.14 + index * 0.06, duration: 0.36, ease: motionEase }}
                          whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                          whileTap={prefersReducedMotion ? undefined : { scale: 0.995 }}
                        >
                          {isActiveLaunchRom ? <m.span className="launchpad-row-highlight" layoutId="launchpad-row-highlight" /> : null}

                          <div className="launchpad-rank">{String(index + 1).padStart(2, '0')}</div>

                          <div className="launchpad-row-copy">
                            <div className="launchpad-row-topline">
                              <strong>{rom.name}</strong>
                              <span>{rom.version}</span>
                            </div>
                            <p>{rom.tagline}</p>
                          </div>

                          <div className="launchpad-row-meta">
                            <span>{getDeviceSummary(rom.devices)}</span>
                            <span>{getLinkSummary(links)}</span>
                            <small>{rom.buildDate}</small>
                          </div>
                        </m.a>
                      )
                    })}
                  </div>

                  <div className="launchpad-footer">
                    <span className="launchpad-note">Tip: choose any row to sync the ROM library below.</span>
                    <a className="ghost-action" href="#rom-directory" onClick={handleSectionAnchorClick}>
                      Browse full library
                    </a>
                  </div>
                </ReactivePanel>

                <div className="hero-stack">
                  <ReactivePanel as="article" className="utility-card utility-card-community utility-card-compact surface-utility" intensity={0.55}>
                    <div className="feature-topline utility-compact-topline">
                      <span className="feature-badge">Telegram desk</span>
                      <span className="ghost-pill">{latestSignal ? latestSignal.date : 'Telegram'}</span>
                    </div>

                    <div className="utility-compact-body">
                      <div className="utility-compact-copy">
                        <h3>The fastest place for support, release posts, and install questions.</h3>
                        <p className="utility-copy">
                          {latestSignal
                            ? `Latest signal: ${latestSignal.title}`
                            : 'Open the main community space for support and fresh release chatter.'}
                        </p>
                      </div>

                      <div className="utility-inline-meta" aria-label="Community context">
                        <span className="meta-pill">Telegram hub</span>
                        {latestSignal ? <span className="meta-pill">{latestSignal.category}</span> : null}
                      </div>
                    </div>

                    <div className="hero-inline-actions">
                      {communityHubHasLink ? (
                        <a href={communityHub.telegramUrl} rel="noreferrer" target="_blank">
                          Open Telegram
                        </a>
                      ) : null}

                      <button onClick={handleCommunityCopy} type="button">
                        {communityLinkCopied ? 'Copied invite' : 'Copy invite'}
                      </button>
                    </div>
                  </ReactivePanel>
                </div>
              </m.div>
            </section>
          </Reveal>

          <Reveal delay={50}>
            <section className="command-center panel" id="pinned-builds">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Release pulse</p>
                  <h2>What actually moved most recently.</h2>
                </div>
                <p>Newest public drops and Telegram activity, kept separate from the full ROM library.</p>
              </div>

              <div className="command-layout">
                <div className="command-primary">
                  <div className="command-card-head">
                    <div>
                      <span className="section-label">Newest public drops</span>
                      <h3>Open these first</h3>
                    </div>
                    <span className="section-caption">Ranked by public build date</span>
                  </div>

                  <div className="build-grid">
                    {latestBuilds.map((rom) => {
                      const accentStyle: AccentStyle = {
                        '--accent': rom.accent,
                        '--accent-soft': rom.accentSoft,
                        '--accent-strong': rom.accentStrong,
                      }

                      return (
                        <ReactivePanel
                          as="article"
                          className="build-card surface-signal"
                          intensity={0.6}
                          key={rom.name}
                          style={accentStyle}
                        >
                          <div className="feature-topline">
                            <span className="feature-badge">{rom.status}</span>
                            <span className="feature-version">{rom.version}</span>
                          </div>

                          <h3>{rom.name}</h3>
                          <p>{rom.tagline}</p>

                          <div className="meta-pill-group">
                            <span className="meta-pill">{rom.buildDate}</span>
                            <span className="meta-pill">{formatFreshness(rom.buildDate)}</span>
                          </div>

                          <div className="card-actions">
                            <a href={`#${toSectionId(rom.name)}`} onClick={(event) => handleRomAnchorClick(event, toSectionId(rom.name))}>
                              Open release
                            </a>
                          </div>
                        </ReactivePanel>
                      )
                    })}
                  </div>
                </div>

                <div className="command-sidebar">
                  <article className="side-card surface-utility">
                    <div className="command-card-head">
                      <div>
                        <span className="section-label">Telegram pulse</span>
                        <h3>Recent posts that matter</h3>
                      </div>
                    </div>

                    <div className="feed-list">
                      {latestUpdates.slice(0, 5).map((entry) => (
                        <a
                          className="feed-item"
                          href={entry.href}
                          key={`${entry.category}-${entry.title}`}
                          onClick={(event) => handleLatestUpdateClick(event, entry.href)}
                        >
                          <div>
                            <span>{entry.category}</span>
                            <strong>{entry.title}</strong>
                          </div>
                          <small>{entry.date}</small>
                        </a>
                      ))}
                    </div>
                  </article>
                </div>
              </div>
            </section>
          </Reveal>

          <LayoutGroup id="rom-browser">
          <Reveal delay={90}>
            <section className="explorer panel" data-hub-accent="true" id="rom-directory" style={featuredStyle}>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">ROM library</p>
                  <h2>Choose one ROM and get the essentials.</h2>
                </div>
                <p>Search the lineup, compare availability, then open one focused release sheet instead of scrolling through duplicates.</p>
              </div>

              <div className="explorer-toolbar" aria-label="ROM filters">
                <label className="search-field">
                  <span>Search releases</span>
                  <div className="search-field-shell">
                    <input
                      onChange={(event) => {
                        const nextValue = event.target.value
                        startTransition(() => setRomQuery(nextValue))
                      }}
                      placeholder="Search by ROM name, version, or device"
                      type="search"
                      value={romQuery}
                    />
                    {romQuery.length > 0 ? (
                      <button
                        aria-label="Clear search"
                        className="search-clear-button"
                        onClick={() => setRomQuery('')}
                        type="button"
                      >
                        x
                      </button>
                    ) : null}
                  </div>
                </label>

                <div className="toolbar-block">
                  <span>Device</span>
                  <div className="segmented-control" role="tablist" aria-label="Device filter">
                    <button
                      className={deviceFilter === 'all' ? 'is-active' : undefined}
                      onClick={() => setDeviceFilter('all')}
                      type="button"
                    >
                      All
                    </button>
                    <button
                      className={deviceFilter === 'pacman' ? 'is-active' : undefined}
                      onClick={() => setDeviceFilter('pacman')}
                      type="button"
                    >
                      2a
                    </button>
                    <button
                      className={deviceFilter === 'pacmanpro' ? 'is-active' : undefined}
                      onClick={() => setDeviceFilter('pacmanpro')}
                      type="button"
                    >
                      2a Plus
                    </button>
                  </div>
                </div>

                <div className="toolbar-block">
                  <span>Availability</span>
                  <div className="segmented-control" role="tablist" aria-label="Release availability filter">
                    <button
                      className={availabilityFilter === 'all' ? 'is-active' : undefined}
                      onClick={() => setAvailabilityFilter('all')}
                      type="button"
                    >
                      All
                    </button>
                    <button
                      className={availabilityFilter === 'available' ? 'is-active' : undefined}
                      onClick={() => setAvailabilityFilter('available')}
                      type="button"
                    >
                      Links ready
                    </button>
                    <button
                      className={availabilityFilter === 'tracking' ? 'is-active' : undefined}
                      onClick={() => setAvailabilityFilter('tracking')}
                      type="button"
                    >
                      No links yet
                    </button>
                  </div>
                </div>

                <label className="sort-field">
                  <span>Sort by</span>
                  <select
                    onChange={(event) => setSortMode(event.target.value as SortMode)}
                    value={sortMode}
                  >
                    <option value="latest">Latest build</option>
                    <option value="alphabetical">Alphabetical</option>
                  </select>
                </label>

                <button
                  className="reset-button"
                  disabled={
                    availabilityFilter === 'all' &&
                    deviceFilter === 'all' &&
                    sortMode === 'latest' &&
                    romQuery.length === 0
                  }
                  onClick={resetFilters}
                  type="button"
                >
                  Reset filters
                </button>
              </div>

              {hasActiveExplorerFilters ? (
                <div className="active-filter-row" aria-label="Active explorer filters">
                  {romQuery.length > 0 ? (
                    <button className="active-filter-chip" onClick={() => setRomQuery('')} type="button">
                      Search: {romQuery}
                      <span aria-hidden="true">x</span>
                    </button>
                  ) : null}
                  {deviceFilter !== 'all' ? (
                    <button className="active-filter-chip" onClick={() => setDeviceFilter('all')} type="button">
                      {getDeviceLabel(deviceFilter)}
                      <span aria-hidden="true">x</span>
                    </button>
                  ) : null}
                  {availabilityFilter !== 'all' ? (
                    <button className="active-filter-chip" onClick={() => setAvailabilityFilter('all')} type="button">
                      {getAvailabilityLabel(availabilityFilter)}
                      <span aria-hidden="true">x</span>
                    </button>
                  ) : null}
                  {sortMode !== 'latest' ? (
                    <button className="active-filter-chip" onClick={() => setSortMode('latest')} type="button">
                      Alphabetical
                      <span aria-hidden="true">x</span>
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="explorer-summary">
                <div>
                  <p>
                    <strong>{filteredRoms.length}</strong> releases shown
                  </p>
                  <small>
                    {selectedRom
                      ? `Selected: ${selectedRom.name}`
                      : 'Pick a ROM card to open its release details below.'}
                  </small>
                </div>
                {selectedRom ? (
                  <div className="explorer-summary-pills" aria-label="Selected ROM summary">
                    <span className="meta-pill">{selectedRom.version}</span>
                    <span className="meta-pill">{selectedRomLinks.length > 0 ? `${selectedRomLinks.length} links ready` : 'No links yet'}</span>
                    <span className="meta-pill">{formatFreshness(selectedRom.buildDate)}</span>
                  </div>
                ) : null}
              </div>

              <m.div className="rom-directory-grid" layout>
                <AnimatePresence initial={false} mode="popLayout">
                {filteredRoms.map((rom, index) => {
                  const links = getReleaseLinks(rom)
                  const romId = toSectionId(rom.name)
                  const isActiveRom = resolvedActiveRomId === romId
                  const accentStyle: AccentStyle = {
                    '--accent': rom.accent,
                    '--accent-soft': rom.accentSoft,
                    '--accent-strong': rom.accentStrong,
                  }

                  return (
                    <m.div
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="rom-directory-motion"
                      exit={{ opacity: 0, y: 18, scale: 0.98 }}
                      initial={{ opacity: 0, y: 18, scale: 0.98 }}
                      key={rom.name}
                      layout
                      transition={{
                        delay: index * 0.025,
                        duration: 0.34,
                        ease: [0.22, 1, 0.36, 1],
                        layout: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
                      }}
                    >
                      <ReactivePanel
                        as="a"
                        aria-current={isActiveRom ? 'true' : undefined}
                        className={`rom-directory-item surface-signal ${isActiveRom ? 'is-active' : ''}`.trim()}
                        data-active={isActiveRom ? 'true' : 'false'}
                        href={`#${romId}`}
                        intensity={0.6}
                        onClick={(event) => handleRomAnchorClick(event, romId)}
                        style={accentStyle}
                      >
                        {isActiveRom ? <m.span className="directory-active-frame" layoutId="active-rom-card" /> : null}

                        <div className="directory-topline">
                          <span className="chip chip-tonal">{rom.status}</span>
                          <span className="ghost-pill">{links.length > 0 ? 'Links ready' : 'No links yet'}</span>
                        </div>

                        <div className="directory-heading">
                          <h3>{rom.name}</h3>
                          <strong>{rom.version}</strong>
                        </div>

                        <p title={rom.tagline}>{rom.tagline}</p>

                        <div className="meta-pill-group">
                          <span className="meta-pill">{rom.branch}</span>
                          <span className="meta-pill">{rom.buildDate}</span>
                        </div>

                        <div className="directory-footer">
                          <small title={rom.devices.join(' / ')}>{rom.devices.join(' / ')}</small>
                          <span className="directory-jump">
                            {isActiveRom ? 'Selected' : links.length > 0 ? `${links.length} links` : 'Select ROM'}
                          </span>
                        </div>
                      </ReactivePanel>
                    </m.div>
                  )
                })}
                </AnimatePresence>
              </m.div>

              {selectedRom ? (
                <AnimatePresence initial={false} mode="wait">
                  <m.div
                    animate={{ opacity: 1, y: 0 }}
                    className="rom-detail-stage"
                    exit={{ opacity: 0, y: 16 }}
                    id="rom-detail-panel"
                    initial={{ opacity: 0, y: 16 }}
                    key={selectedRom.name}
                    layout
                    transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ReactivePanel
                      as="section"
                      className="rom-section panel is-active surface-editorial"
                      data-active="true"
                      data-hub-accent="true"
                      id={toSectionId(selectedRom.name)}
                      intensity={0.75}
                      style={
                        {
                          '--accent': selectedRom.accent,
                          '--accent-soft': selectedRom.accentSoft,
                          '--accent-strong': selectedRom.accentStrong,
                        } as AccentStyle
                      }
                    >
                      <div className="rom-section-atmosphere" aria-hidden="true">
                        <div className="rom-section-orb rom-section-orb-primary" />
                        <div className="rom-section-orb rom-section-orb-secondary" />
                      </div>

                      <div className="rom-section-header">
                        <div className="rom-heading">
                          <div className="chip-row">
                            <span className="chip chip-tonal">{selectedRom.status}</span>
                            <span className="chip">{selectedRom.branch}</span>
                            <span className="chip">
                              {getReleaseLinks(selectedRom).length > 0 ? 'Links ready' : 'No links yet'}
                            </span>
                          </div>

                          <h2>{selectedRom.name}</h2>
                          <p>{selectedRom.tagline}</p>
                        </div>

                        <div className="rom-header-meta">
                          <span className="version-pill">{selectedRom.version}</span>
                          <small>{formatFreshness(selectedRom.buildDate)}</small>
                        </div>
                      </div>

                      <div className="rom-section-hero-pills" aria-label="Selected release summary">
                        <span className="meta-pill">{selectedRom.buildDate}</span>
                        <span className="meta-pill">{selectedRom.devices.join(' / ')}</span>
                        <span className="meta-pill">
                          {selectedRomLinks.length > 0 ? `${selectedRomLinks.length} resources ready` : 'Resources pending'}
                        </span>
                      </div>

                      {filteredRoms.length > 1 ? (
                        <div className="selected-rom-nav" aria-label="Selected ROM navigation">
                          <div className="selected-rom-index">
                            <span className="section-label">Release browser</span>
                            <strong>
                              {selectedRomIndex + 1} / {filteredRoms.length}
                            </strong>
                          </div>

                          <div className="selected-rom-nav-actions">
                            <button
                              disabled={selectedRomIndex <= 0}
                              onClick={() => selectRomByIndex(selectedRomIndex - 1)}
                              type="button"
                            >
                              Previous
                            </button>
                            <button
                              disabled={selectedRomIndex >= filteredRoms.length - 1}
                              onClick={() => selectRomByIndex(selectedRomIndex + 1)}
                              type="button"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div className="rom-section-body">
                        <div className="rom-section-main">
                          <m.div
                            animate={expandedReleaseNotes[selectedRom.name] ? 'open' : 'closed'}
                            className="release-disclosure"
                            data-open={expandedReleaseNotes[selectedRom.name] ? 'true' : 'false'}
                            layout
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          >
                            <button
                              aria-controls={`${toSectionId(selectedRom.name)}-release-notes`}
                              aria-expanded={expandedReleaseNotes[selectedRom.name] ?? false}
                              className="release-disclosure-trigger"
                              onClick={() => toggleReleaseNotes(selectedRom.name)}
                              type="button"
                            >
                              <div className="release-disclosure-copy">
                                <span className="section-label">Release notes</span>
                                <strong>
                                  {expandedReleaseNotes[selectedRom.name] ? 'Hide detailed notes' : 'Open detailed notes'}
                                </strong>
                                <small>
                                  {selectedRom.highlights.length} highlights and {selectedRom.changelog.length} changelog entries.
                                </small>
                              </div>
                              <span className="release-disclosure-pill">
                                {expandedReleaseNotes[selectedRom.name] ? 'Close' : 'Open'}
                                <m.span
                                  animate={{ rotate: expandedReleaseNotes[selectedRom.name] ? 45 : 0 }}
                                  className="release-disclosure-icon"
                                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                                >
                                  +
                                </m.span>
                              </span>
                            </button>

                            <AnimatePresence initial={false}>
                              {expandedReleaseNotes[selectedRom.name] ? (
                                <m.div
                                  animate={{ height: 'auto', opacity: 1 }}
                                  className="release-disclosure-motion"
                                  exit={{ height: 0, opacity: 0 }}
                                  id={`${toSectionId(selectedRom.name)}-release-notes`}
                                  initial={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                                >
                                  <m.div
                                    animate={{ y: 0, opacity: 1 }}
                                    className="release-disclosure-content"
                                    initial={{ y: -10, opacity: 0 }}
                                    transition={{ duration: 0.22, delay: 0.03, ease: [0.22, 1, 0.36, 1] }}
                                  >
                                    <div className="content-cluster">
                                      <h3>Why this release stands out</h3>
                                      <ul className="bullet-list">
                                        {selectedRom.highlights.map((item) => (
                                          <li key={item}>{item}</li>
                                        ))}
                                      </ul>
                                    </div>

                                    <div className="content-cluster">
                                      <div className="cluster-head">
                                        <h3>Build changelog</h3>
                                        <span>{selectedRom.changelog.length} notes</span>
                                      </div>

                                      <ul className="timeline-list">
                                        {selectedRom.changelog.map((item) => (
                                          <li key={item}>{item}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </m.div>
                                </m.div>
                              ) : null}
                            </AnimatePresence>
                          </m.div>
                        </div>

                        <aside className="rom-section-side">
                          <m.div
                            animate={{ opacity: 1, y: 0 }}
                            className="rom-facts-card"
                            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: 0.04 }}
                          >
                            <div className="rom-fact-row">
                              <span>Build date</span>
                              <strong>{selectedRom.buildDate}</strong>
                            </div>
                            <div className="rom-fact-row">
                              <span>Supported devices</span>
                              <strong>{selectedRom.devices.join(' / ')}</strong>
                            </div>
                            <div className="rom-fact-row">
                              <span>Current focus</span>
                              <strong>{formatMaintenanceNote(selectedRom.maintenanceNote)}</strong>
                            </div>
                            <div className="rom-fact-row">
                              <span>Channel label</span>
                              <strong>{selectedRom.channelLabel}</strong>
                            </div>
                          </m.div>

                          <m.div
                            animate={{ opacity: 1, y: 0 }}
                            className="card-actions card-actions-stack"
                            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
                          >
                            {selectedRomLinks.length > 0 ? (
                              <div className="resource-panel surface-utility">
                                <div className="resource-panel-head">
                                  <span className="section-label">Resources</span>
                                  <small>{selectedRomLinks.length} links available</small>
                                </div>

                                <div className="resource-picker" ref={resourceMenuRef}>
                                  <span className="resource-picker-label">Choose a link</span>
                                  <button
                                    aria-controls="resource-picker-menu"
                                    aria-expanded={resourceMenuOpen}
                                    aria-haspopup="listbox"
                                    className="resource-trigger"
                                    onClick={() => setResourceMenuOpen((current) => !current)}
                                    type="button"
                                  >
                                    <div className="resource-trigger-copy">
                                      <strong>{selectedResourceLink?.label ?? 'Select a resource'}</strong>
                                      <small>
                                        {selectedResourceLink ? 'Direct release resource' : 'No resource selected'}
                                      </small>
                                    </div>
                                    <m.span
                                      animate={{ rotate: resourceMenuOpen ? 180 : 0 }}
                                      className="resource-trigger-chevron"
                                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                      <svg aria-hidden="true" viewBox="0 0 16 16">
                                        <path d="M3.5 6 8 10.5 12.5 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
                                      </svg>
                                    </m.span>
                                  </button>

                                  <AnimatePresence initial={false}>
                                    {resourceMenuOpen ? (
                                      <m.div
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className="resource-menu"
                                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                        id="resource-picker-menu"
                                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                        role="listbox"
                                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                      >
                                        {selectedRomLinks.map((link, index) => {
                                          const isActiveLink = selectedResourceUrl === link.url

                                          return (
                                            <m.button
                                              animate={{ opacity: 1, x: 0 }}
                                              className={`resource-option ${isActiveLink ? 'is-active' : ''}`.trim()}
                                              initial={{ opacity: 0, x: -8 }}
                                              key={link.url}
                                              onClick={() => {
                                                setSelectedResourceByRom((current) => ({
                                                  ...current,
                                                  [selectedRom.name]: link.url,
                                                }))
                                                setResourceMenuOpen(false)
                                              }}
                                              role="option"
                                              transition={{
                                                delay: index * 0.02,
                                                duration: 0.18,
                                                ease: [0.22, 1, 0.36, 1],
                                              }}
                                              type="button"
                                            >
                                              <span>{link.label}</span>
                                              {isActiveLink ? <small>Selected</small> : null}
                                            </m.button>
                                          )
                                        })}
                                      </m.div>
                                    ) : null}
                                  </AnimatePresence>
                                </div>

                                <a
                                  className="resource-open-action"
                                  href={selectedResourceUrl}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  Open selected link
                                </a>
                              </div>
                            ) : (
                              <span className="button-disabled">Release link pending</span>
                            )}
                          </m.div>
                        </aside>
                      </div>
                    </ReactivePanel>
                  </m.div>
                </AnimatePresence>
              ) : null}

              {filteredRoms.length === 0 ? (
                <div className="empty-state">
                  <strong>No releases matched the current filters.</strong>
                  <span>Broaden the search or reset the filters to bring the full lineup back.</span>
                  <button onClick={resetFilters} type="button">
                    Clear filters
                  </button>
                </div>
              ) : null}
            </section>
          </Reveal>
          </LayoutGroup>

          <Reveal delay={110}>
            <section className="panel support-panel support-panel-gcam" data-hub-accent="true" id="gcams" style={gcamStyle}>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Camera tools</p>
                  <h2>Camera files, separated from ROM browsing.</h2>
                </div>
                <p>Grab the APK or the XML you need without digging back through Telegram history.</p>
              </div>

              {gcamEntries.length > 0 ? (
                <div className="gcam-grid">
                  {gcamEntries.map((entry) => {
                    const links = getGcamLinks(entry)

                    return (
                      <article className="gcam-card surface-utility" key={`${entry.name}-${entry.build}`}>
                        <div className="feature-topline">
                          <span className="feature-badge">GCam build</span>
                          <span className="feature-version">{entry.build}</span>
                        </div>

                        <h3>{entry.name}</h3>
                        <p>{entry.summary}</p>

                        <div className="meta-pill-group">
                          <span className="meta-pill">{entry.updatedAt}</span>
                          <span className="meta-pill">{entry.devices.join(' / ')}</span>
                        </div>

                        <div className="card-actions">
                          {links.map((link) => (
                            <a href={link.url} key={link.url} rel="noreferrer" target="_blank">
                              {link.label}
                            </a>
                          ))}
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <article className="gcam-empty-state">
                  <div>
                    <span className="section-label">Camera catalog</span>
                    <h3>Ready for curated APK and config recommendations.</h3>
                  </div>
                  <p>The layout is ready, but it stays honest until there are real GCam picks.</p>
                  {communityHubHasLink ? (
                    <a href={communityHub.telegramUrl} rel="noreferrer" target="_blank">
                      Ask in community
                    </a>
                  ) : null}
                </article>
              )}

            </section>
          </Reveal>

          <Reveal delay={120}>
            <section className="panel devices-panel" data-hub-accent="true" id="devices" style={deviceStyle}>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Device Coverage</p>
                  <h2>Two devices, one clearer support map.</h2>
                </div>
                <p>The device section works as a quick support overview, not filler.</p>
              </div>

              <div className="support-grid">
                {supportMatrix.map((device) => (
                  <article className="device-card" key={device.name}>
                    <span className="chip chip-tonal">{device.badge}</span>
                    <h3>{device.name}</h3>
                    <p>{device.summary}</p>
                    <strong>{device.focus}</strong>
                  </article>
                ))}
              </div>

              <div className="expansion-grid">
                {expansionCards.map((card) => (
                  <article className="expansion-card" key={card.title}>
                    <span className="section-label">Next step</span>
                    <h3>{card.title}</h3>
                    <p>{card.summary}</p>
                  </article>
                ))}
              </div>
            </section>
          </Reveal>
            </main>
          </div>

          <nav className="mobile-dock" aria-label="Mobile section navigation">
          {sectionLinks.map((item) => (
            <a
              aria-current={activeSection === item.id ? 'page' : undefined}
              aria-label={item.label}
              className="mobile-dock-link"
              href={`#${item.id}`}
              key={item.id}
              onClick={handleSectionAnchorClick}
            >
              <span className="mobile-dock-icon">
                <DockGlyph section={item.id} />
              </span>
              <span className="mobile-dock-text">{item.shortLabel}</span>
            </a>
          ))}
          </nav>
        </div>
      </LazyMotion>
    </>
  )
}

export default App
