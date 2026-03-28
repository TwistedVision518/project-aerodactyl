import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react'
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
    { label: 'Download APK', url: entry.downloadUrl },
    { label: 'Download config', url: entry.configUrl },
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

  const deferredQuery = useDeferredValue(romQuery)
  const featuredRom = roms.find((rom) => rom.name === 'Evolution X') ?? latestBuilds[0] ?? roms[0]
  const communityHubHasLink = hasReleaseLink(communityHub.telegramUrl)
  const releaseReadyRoms = useMemo(
    () =>
      [...roms]
        .filter((rom) => getReleaseLinks(rom).length > 0)
        .sort((left, right) => toTimestamp(right.buildDate) - toTimestamp(left.buildDate)),
    [],
  )
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

  const heroStats = [
    { label: 'Tracked ROMs', value: `${roms.length}`, detail: 'active releases across the hub' },
    { label: 'Release links live', value: `${releaseReadyRoms.length}`, detail: 'ready to open now' },
    { label: 'Dual-device coverage', value: `${dualTargetCount}`, detail: 'support both 2a targets' },
    { label: 'Last major update', value: siteLastUpdated, detail: formatFreshness(siteLastUpdated) },
  ]

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode
    document.documentElement.style.colorScheme = themeMode
    window.localStorage.setItem('project-aerodactyl-theme', themeMode)
  }, [themeMode])

  useEffect(() => {
    const syncActiveSectionFromHash = () => {
      const nextSection = resolveSectionTarget(window.location.hash)

      if (nextSection) {
        setActiveSection(nextSection)
      }
    }

    syncActiveSectionFromHash()
    window.addEventListener('hashchange', syncActiveSectionFromHash)

    return () => window.removeEventListener('hashchange', syncActiveSectionFromHash)
  }, [])

  useEffect(() => {
    const sections = sectionLinks
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element))

    if (sections.length === 0) {
      return
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

  const handleSectionAnchorClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const href = event.currentTarget.getAttribute('href')

    if (!href?.startsWith('#')) {
      return
    }

    const nextSection = resolveSectionTarget(href)

    if (nextSection) {
      setActiveSection(nextSection)
    }
  }

  const toggleTheme = (event: MouseEvent<HTMLButtonElement>) => {
    const isToDark = themeMode === 'light'
    const nextTheme = isToDark ? 'dark' : 'light'
    const startViewTransition = document.startViewTransition?.bind(document)

    if (!startViewTransition) {
      setThemeMode(nextTheme)
      return
    }

    const x = event.clientX
    const y = event.clientY
    const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

    const transition = startViewTransition(() => {
      flushSync(() => {
        setThemeMode(nextTheme)
      })
    })

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ]

      document.documentElement.animate(
        { clipPath: isToDark ? clipPath : [...clipPath].reverse() },
        {
          duration: 650,
          easing: 'cubic-bezier(0.45, 0, 0.55, 1)',
          pseudoElement: isToDark ? '::view-transition-new(root)' : '::view-transition-old(root)',
        },
      )
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

  return (
    <>
      {loading ? <LoadingScreen onComplete={() => setLoading(false)} /> : null}

      <div className="app-shell scene-root" data-loaded={!loading}>
        <div className="interactive-scene" aria-hidden="true">
          <div className="scene-gradient scene-gradient-left" />
          <div className="scene-gradient scene-gradient-right" />
          <div className="scene-grid" />
          <div className="scene-noise" />
        </div>

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
                <a
                  aria-current={activeSection === item.id ? 'page' : undefined}
                  href={`#${item.id}`}
                  key={item.id}
                  onClick={handleSectionAnchorClick}
                >
                  {item.label}
                </a>
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
              <div className="hero-copy">
                <div className="hero-kicker-row">
                  <span className="tonal-chip">Nothing Phone 2a / 2a Plus</span>
                  <span className="ghost-pill">Updated {siteLastUpdated}</span>
                </div>

                <p className="eyebrow">Editorial Release Dashboard</p>
                <h1>Release tracking that feels curated, not scraped from chat.</h1>
                <p className="lede">
                  A focused home for the current ROM lineup, release links, and device support
                  across the Nothing Phone 2a series.
                </p>

                <div className="hero-actions">
                  <a className="action-primary" href="#rom-directory" onClick={handleSectionAnchorClick}>
                    Browse ROMs
                  </a>
                  {communityHubHasLink ? (
                    <a
                      className="action-secondary"
                      href={communityHub.telegramUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open Community
                    </a>
                  ) : null}
                </div>

                <div className="hero-stats-grid" aria-label="Project highlights">
                  {heroStats.map((stat) => (
                    <article className="metric-card" key={stat.label}>
                      <span>{stat.label}</span>
                      <strong>{stat.value}</strong>
                      <small>{stat.detail}</small>
                    </article>
                  ))}
                </div>
              </div>

              <div className="hero-stage">
                <ReactivePanel as="article" className="hero-spotlight" intensity={0.75} style={featuredStyle}>
                  <div className="feature-topline">
                    <span className="feature-badge">Spotlight build</span>
                    <span className="feature-version">{featuredRom.version}</span>
                  </div>

                  <div className="spotlight-header">
                    <div>
                      <h2>{featuredRom.name}</h2>
                      <p>{featuredRom.tagline}</p>
                    </div>
                    <span className="version-pill">{featuredRom.status}</span>
                  </div>

                  <ul className="feature-list" aria-label={`${featuredRom.name} summary`}>
                    {featuredRom.highlights.slice(0, 3).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>

                  <div className="spotlight-footer">
                    <div className="meta-pill-group">
                      <span className="meta-pill">{featuredRom.buildDate}</span>
                      <span className="meta-pill">{featuredRom.devices.join(' / ')}</span>
                    </div>

                    <div className="spotlight-actions">
                      <a className="ghost-action" href={`#${toSectionId(featuredRom.name)}`} onClick={handleSectionAnchorClick}>
                        Read release details
                      </a>
                    </div>
                  </div>
                </ReactivePanel>

                <div className="hero-stack">
                  <ReactivePanel as="article" className="utility-card utility-card-community" intensity={0.55}>
                    <div className="feature-topline">
                      <span className="feature-badge">Community hub</span>
                      <span className="ghost-pill">Telegram</span>
                    </div>

                    <h3>Keep support, screenshots, and release chatter in one public place.</h3>
                    <p className="utility-copy">{communityHub.summary}</p>

                    <div className="hero-inline-actions">
                      {communityHubHasLink ? (
                        <a href={communityHub.telegramUrl} rel="noreferrer" target="_blank">
                          Open community
                        </a>
                      ) : null}

                      <button onClick={handleCommunityCopy} type="button">
                        {communityLinkCopied ? 'Copied link' : 'Copy invite link'}
                      </button>
                    </div>
                  </ReactivePanel>
                </div>
              </div>
            </section>
          </Reveal>

          <Reveal delay={50}>
            <section className="command-center panel" id="pinned-builds">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Command Center</p>
                  <h2>The part of the homepage that actually helps you decide what to open next.</h2>
                </div>
                <p>
                  Fresh builds, release availability, and direct jump points in one tighter
                  command view.
                </p>
              </div>

              <div className="command-layout">
                <div className="command-primary">
                  <div className="command-card-head">
                    <div>
                      <span className="section-label">Fresh drops</span>
                      <h3>Current top releases</h3>
                    </div>
                    <span className="section-caption">Sorted by newest public build date</span>
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
                          className="build-card"
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
                            <a href={`#${toSectionId(rom.name)}`}>Inspect release</a>
                          </div>
                        </ReactivePanel>
                      )
                    })}
                  </div>
                </div>

                <div className="command-sidebar">
                  <article className="side-card">
                    <div className="command-card-head">
                      <div>
                        <span className="section-label">Live feed</span>
                        <h3>Latest movement</h3>
                      </div>
                    </div>

                    <div className="feed-list">
                      {latestUpdates.slice(0, 5).map((entry) => (
                        <a className="feed-item" href={entry.href} key={`${entry.category}-${entry.title}`}>
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

          <Reveal delay={90}>
            <section className="explorer panel" data-hub-accent="true" id="rom-directory" style={featuredStyle}>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">ROM Explorer</p>
                  <h2>Search the lineup by device, availability, or build intent without losing context.</h2>
                </div>
                <p>
                  The explorer stays quick for first-time visitors but still works as a maintainer-facing
                  release board.
                </p>
              </div>

              <div className="explorer-toolbar" aria-label="ROM filters">
                <label className="search-field">
                  <span>Search releases</span>
                  <input
                    onChange={(event) => {
                      const nextValue = event.target.value
                      startTransition(() => setRomQuery(nextValue))
                    }}
                    placeholder="Search by name, version, device, branch, or note"
                    type="search"
                    value={romQuery}
                  />
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
                      Ready now
                    </button>
                    <button
                      className={availabilityFilter === 'tracking' ? 'is-active' : undefined}
                      onClick={() => setAvailabilityFilter('tracking')}
                      type="button"
                    >
                      Tracking
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

              <div className="explorer-summary">
                <p>
                  <strong>{filteredRoms.length}</strong> releases shown for{' '}
                  <span>{getDeviceLabel(deviceFilter)}</span> with{' '}
                  <span>{getAvailabilityLabel(availabilityFilter)}</span>.
                </p>
                <small>
                  Use the cards below for quick scanning, then jump into the detailed release view for
                  release notes and build context.
                </small>
              </div>

              <div className="rom-directory-grid">
                {filteredRoms.map((rom) => {
                  const links = getReleaseLinks(rom)
                  const accentStyle: AccentStyle = {
                    '--accent': rom.accent,
                    '--accent-soft': rom.accentSoft,
                    '--accent-strong': rom.accentStrong,
                  }

                  return (
                    <ReactivePanel
                      as="a"
                      className="rom-directory-item"
                      href={`#${toSectionId(rom.name)}`}
                      intensity={0.6}
                      key={rom.name}
                      onClick={handleSectionAnchorClick}
                      style={accentStyle}
                    >
                      <div className="directory-topline">
                        <span className="chip chip-tonal">{rom.status}</span>
                        <span className="ghost-pill">{links.length > 0 ? 'Openable' : 'Tracking only'}</span>
                      </div>

                      <div className="directory-heading">
                        <h3>{rom.name}</h3>
                        <strong>{rom.version}</strong>
                      </div>

                      <p>{rom.tagline}</p>

                      <div className="meta-pill-group">
                        <span className="meta-pill">{rom.branch}</span>
                        <span className="meta-pill">{rom.buildDate}</span>
                      </div>

                      <small>{rom.devices.join(' / ')}</small>
                    </ReactivePanel>
                  )
                })}
              </div>

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

          <section className="rom-sections">
            {filteredRoms.map((rom, index) => {
              const links = getReleaseLinks(rom)
              const accentStyle: AccentStyle = {
                '--accent': rom.accent,
                '--accent-soft': rom.accentSoft,
                '--accent-strong': rom.accentStrong,
              }

              return (
                <Reveal delay={index * 40} key={rom.name}>
                  <ReactivePanel
                    as="section"
                    className="rom-section panel"
                    data-hub-accent="true"
                    id={toSectionId(rom.name)}
                    intensity={0.75}
                    style={accentStyle}
                  >
                    <div className="rom-section-header">
                      <div className="rom-heading">
                        <div className="chip-row">
                          <span className="chip chip-tonal">{rom.status}</span>
                          <span className="chip">{rom.branch}</span>
                          <span className="chip">{links.length > 0 ? 'Release linked' : 'Release tracking'}</span>
                        </div>

                        <h2>{rom.name}</h2>
                        <p>{rom.tagline}</p>
                      </div>

                      <div className="rom-header-meta">
                        <span className="version-pill">{rom.version}</span>
                        <small>{formatFreshness(rom.buildDate)}</small>
                      </div>
                    </div>

                    <div className="rom-section-body">
                      <div className="rom-section-main">
                        <div className="content-cluster">
                          <h3>Why this release stands out</h3>
                          <ul className="bullet-list">
                            {rom.highlights.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="content-cluster">
                          <div className="cluster-head">
                            <h3>Build changelog</h3>
                            <span>{rom.changelog.length} notes</span>
                          </div>

                          <ul className="timeline-list">
                            {rom.changelog.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>

                      </div>

                      <aside className="rom-section-side">
                        <div className="rom-detail-card">
                          <span>Build date</span>
                          <strong>{rom.buildDate}</strong>
                        </div>
                        <div className="rom-detail-card">
                          <span>Supported devices</span>
                          <strong>{rom.devices.join(' / ')}</strong>
                        </div>
                        <div className="rom-detail-card">
                          <span>Current focus</span>
                          <strong>{formatMaintenanceNote(rom.maintenanceNote)}</strong>
                        </div>
                        <div className="rom-detail-card">
                          <span>Channel label</span>
                          <strong>{rom.channelLabel}</strong>
                        </div>

                        <div className="card-actions card-actions-stack">
                          {links.length > 0 ? (
                            links.map((link) => (
                              <a href={link.url} key={link.url} rel="noreferrer" target="_blank">
                                {links.length > 1 ? link.label : 'Open Telegram release'}
                              </a>
                            ))
                          ) : (
                            <span className="button-disabled">Release link pending</span>
                          )}
                        </div>
                      </aside>
                    </div>
                  </ReactivePanel>
                </Reveal>
              )
            })}
          </section>

          <Reveal delay={110}>
            <section className="panel support-panel support-panel-gcam" data-hub-accent="true" id="gcams" style={gcamStyle}>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Camera Picks</p>
                  <h2>Keep camera recommendations as intentional as the release board.</h2>
                </div>
                <p>
                  When GCam entries are ready, this section turns into a cleaner reference than asking
                  users to scroll through chat logs.
                </p>
              </div>

              {gcamEntries.length > 0 ? (
                <div className="gcam-grid">
                  {gcamEntries.map((entry) => {
                    const links = getGcamLinks(entry)

                    return (
                      <article className="gcam-card" key={`${entry.name}-${entry.build}`}>
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
                  <p>
                    The layout is prepared, but it stays honest: until there are real GCam picks, it
                    communicates that clearly instead of pretending there is content.
                  </p>
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
                <p>
                  The device section is now positioned as a support overview, not filler at the bottom
                  of the page.
                </p>
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
    </>
  )
}

export default App
