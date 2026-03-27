import { useEffect, useMemo, useState, type CSSProperties, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import './App.css'
import { CommentsThread } from './components/CommentsThread'
import { ReactivePanel } from './components/ReactivePanel'
import { Reveal } from './components/Reveal'
import { useSceneMotion } from './hooks/useSceneMotion'
import type { GcamEntry, ReleaseLink, RomEntry } from './data/types'
import {
  builderUpdates,
  comments,
  communityHub,
  expansionCards,
  gcamEntries,
  quickStats,
  latestBuilds,
  latestUpdates,
  roms,
  sourceChanges,
  supportMatrix,
} from './data/siteContent'

type DockSection = 'top' | 'rom-directory' | 'gcams' | 'source-pulse' | 'builder-notes' | 'devices'
type ThemeMode = 'dark' | 'light'

type AccentStyle = CSSProperties & {
  '--accent'?: string
  '--accent-soft'?: string
  '--accent-strong'?: string
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
  )
}

function toSectionId(name: string) {
  return `rom-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
}

function hasReleaseLink(url: string) {
  return Boolean(url) && url.startsWith('https://t.me/')
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
    { label: 'Download GCam', url: entry.downloadUrl },
    { label: 'Download config', url: entry.configUrl },
  ].filter((link) => hasReleaseLink(link.url) || link.url.startsWith('https://'))
}

function formatMaintenanceNote(value: string) {
  return value.replace(/^Current focus:\s*/i, '')
}

function DockGlyph({ section }: { section: DockSection }) {
  const commonProps = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.9,
  }

  switch (section) {
    case 'top':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path {...commonProps} d="M4.5 10.5 12 4l7.5 6.5" />
          <path {...commonProps} d="M7.5 9.5V20h9V9.5" />
        </svg>
      )
    case 'rom-directory':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <rect {...commonProps} x="4" y="5" width="16" height="14" rx="3" />
          <path {...commonProps} d="M8 9.5h8M8 13h5" />
        </svg>
      )
    case 'gcams':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path {...commonProps} d="M8.5 7.5 10 5h4l1.5 2.5H18a2 2 0 0 1 2 2v6.5a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9.5a2 2 0 0 1 2-2Z" />
          <circle {...commonProps} cx="12" cy="13" r="3.2" />
        </svg>
      )
    case 'source-pulse':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path {...commonProps} d="M4 13h3l2-4 3 8 2-5h6" />
        </svg>
      )
    case 'builder-notes':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path {...commonProps} d="M7 5h8l4 4v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
          <path {...commonProps} d="M15 5v4h4M9 13h6M9 16h4" />
        </svg>
      )
    case 'devices':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <rect {...commonProps} x="7" y="3.5" width="10" height="17" rx="2.6" />
          <path {...commonProps} d="M10 6.5h4M11 17.5h2" />
        </svg>
      )
  }
}

const mobileDockItems: Array<{ href: string; label: string; section: DockSection }> = [
  { href: '#top', label: 'Home', section: 'top' },
  { href: '#rom-directory', label: 'ROMs', section: 'rom-directory' },
  { href: '#gcams', label: 'GCams', section: 'gcams' },
  { href: '#source-pulse', label: 'Pulse', section: 'source-pulse' },
  { href: '#builder-notes', label: 'Notes', section: 'builder-notes' },
  { href: '#devices', label: 'Devices', section: 'devices' },
]

function StatusDot({ active = false }: { active?: boolean }) {
  return <span className={`status-dot ${active ? 'is-active' : ''}`.trim()} aria-hidden="true" />
}

function App() {
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
  const sceneRef = useSceneMotion()
  const [romQuery, setRomQuery] = useState('')
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'pacman' | 'pacmanpro'>('all')
  const featuredRom = roms.find((rom) => rom.name === 'Evolution X') ?? roms[0]
  const featuredRomLinks = getReleaseLinks(featuredRom)
  const featuredRomHasLink = featuredRomLinks.length > 0
  const communityHubHasLink = hasReleaseLink(communityHub.telegramUrl)
  const filteredRoms = useMemo(() => {
    const query = romQuery.trim().toLowerCase()

    return roms.filter((rom) => {
      const matchesQuery =
        query.length === 0 ||
        rom.name.toLowerCase().includes(query) ||
        rom.version.toLowerCase().includes(query) ||
        rom.branch.toLowerCase().includes(query) ||
        rom.status.toLowerCase().includes(query)

      const matchesDevice =
        deviceFilter === 'all' ||
        rom.devices.some((device) =>
          deviceFilter === 'pacman'
            ? device.toLowerCase().includes('2a') && !device.toLowerCase().includes('plus')
            : device.toLowerCase().includes('plus'),
        )

      return matchesQuery && matchesDevice
    })
  }, [deviceFilter, romQuery])

  const featuredStyle: AccentStyle = {
    '--accent': featuredRom.accent,
    '--accent-soft': featuredRom.accentSoft,
    '--accent-strong': featuredRom.accentStrong,
  }
  const gcamStyle: AccentStyle = {
    '--accent': '#6b86ff',
    '--accent-soft': 'rgba(107, 134, 255, 0.18)',
    '--accent-strong': '#b7c5ff',
  }
  const sourceStyle: AccentStyle = {
    '--accent': '#56c7ff',
    '--accent-soft': 'rgba(86, 199, 255, 0.16)',
    '--accent-strong': '#aee7ff',
  }
  const builderStyle: AccentStyle = {
    '--accent': '#ff8a5b',
    '--accent-soft': 'rgba(255, 138, 91, 0.16)',
    '--accent-strong': '#ffd0be',
  }
  const devicesStyle: AccentStyle = {
    '--accent': '#52d2ad',
    '--accent-soft': 'rgba(82, 210, 173, 0.16)',
    '--accent-strong': '#c0ffeb',
  }

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode
    document.documentElement.style.colorScheme = themeMode
    window.localStorage.setItem('project-aerodactyl-theme', themeMode)
  }, [themeMode])

  const toggleTheme = (event: MouseEvent<HTMLButtonElement>) => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light'

    if (!document.startViewTransition) {
      setThemeMode(newTheme)
      return
    }

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setThemeMode(newTheme)
      })
    })

    const x = event.clientX
    const y = event.clientY
    const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 450,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      )
    })
  }

  return (
    <div className="app-shell scene-root" ref={sceneRef}>
      <div className="interactive-scene" aria-hidden="true">
        <div className="scene-spotlight" />
        <div className="scene-overlay-dots" />
        <div className="scene-cursor-trail" />
        <div className="scene-cursor-glow" />
      </div>

      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brand-mark" aria-hidden="true">
            <img alt="" className="brand-mark-image" src="/favicon.svg" />
          </span>
          <span className="brand-copy">
            <strong>Project Aerodactyl</strong>
            <small>Nothing Phone 2a Series Hub</small>
          </span>
        </a>

        <nav className="nav-links" aria-label="Primary">
          <a data-section="rom-directory" href="#rom-directory">01 / ROMs</a>
          <a data-section="gcams" href="#gcams">02 / GCams</a>
          <a data-section="source-pulse" href="#source-pulse">03 / Pulse</a>
          <a data-section="builder-notes" href="#builder-notes">04 / Notes</a>
          <a data-section="devices" href="#devices">05 / Devices</a>
        </nav>

        <div className="topbar-actions">
          <div className="topbar-controls" aria-label="Display controls">
            <button
              aria-label={themeMode === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
              aria-pressed={themeMode === 'light'}
              className={`control-toggle ${themeMode === 'light' ? 'is-active' : ''}`.trim()}
              onClick={toggleTheme}
              type="button"
            >
              {themeMode === 'light' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
          <a className="status-badge topbar-button topbar-button-secondary" href="#top">
            Latest Drops
          </a>
          <a className="pill-link topbar-button topbar-button-primary" href="#rom-directory">
            Browse ROMs
          </a>
        </div>
      </header>

      <main className="page" id="top">
        <Reveal>
          <section className="hero panel" data-hub-accent="true" style={featuredStyle}>
            <div className="hero-copy">
              <div className="hero-kicker">
                <span className="tonal-chip">Nothing Phone 2a + 2a Plus</span>
              </div>

              <p className="eyebrow">AERODACTYL / HUB</p>
              <h1>A cleaner release home for the Nothing Phone 2a lineup.</h1>
              <p className="lede">
                Track builds, jump to releases, and catch source updates without the chat history noise.
              </p>

              <div className="hero-actions">
                <a className="action-primary" href="#rom-directory">
                  View Current Builds
                </a>
                <a className="action-secondary" href="#source-pulse">
                  Read Source Pulse
                </a>
                {communityHubHasLink ? (
                  <a
                    className="action-secondary"
                    href={communityHub.telegramUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {communityHub.ctaLabel}
                  </a>
                ) : null}
              </div>

              <div className="stat-grid" aria-label="Project highlights">
                {quickStats.map((stat) => (
                  <article className="stat-card" key={stat.label}>
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </article>
                ))}
              </div>
            </div>

            <div className="hero-stage">
              <ReactivePanel
                as="article"
                className="hero-feature-card"
                intensity={0.7}
                style={featuredStyle}
              >
                <div className="feature-column-badge">
                  <div className="feature-topline">
                    <span className="feature-badge">
                      <StatusDot active />
                      Spotlight
                    </span>
                    <span className="feature-version">{featuredRom.version}</span>
                  </div>
                </div>

                <div className="feature-column-main">
                  <h2>{featuredRom.name}</h2>
                  <p>{featuredRom.tagline}</p>

                  <ul className="feature-list" aria-label={`${featuredRom.name} summary`}>
                    {featuredRom.highlights.slice(0, 2).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="feature-column-action">
                  <div className="feature-meta">
                    <span>{featuredRom.buildDate}</span>
                    <span>{featuredRom.devices.join(' / ')}</span>
                  </div>

                  {featuredRomHasLink ? (
                    <a
                      className="feature-link"
                      href={featuredRomLinks[0].url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {featuredRomLinks.length > 1 ? `Open ${featuredRomLinks[0].label}` : 'Open release'}
                    </a>
                  ) : (
                    <span className="feature-link is-disabled">Release Pending</span>
                  )}
                </div>
              </ReactivePanel>

              <ReactivePanel as="article" className="community-card panel" intensity={0.45}>
                <div className="feature-topline">
                  <span className="feature-badge">Community</span>
                  <span className="ghost-pill">Telegram</span>
                </div>

                <h2>Need the wider device chat?</h2>
                <p>Use the shared Telegram group for support, screenshots, help, and quick feedback.</p>

                {communityHubHasLink ? (
                  <a
                    className="feature-link"
                    href={communityHub.telegramUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {communityHub.ctaLabel}
                  </a>
                ) : null}
              </ReactivePanel>
            </div>
          </section>
        </Reveal>

        <Reveal delay={40}>
          <section className="latest-build-strip panel" aria-label="Latest ROM builds">
            <div className="latest-build-strip-head">
              <div>
                <p className="eyebrow">PINNED BUILDS</p>
                <h2>Fresh drops.</h2>
              </div>
              <span>Newest public builds first</span>
            </div>

            <div className="latest-build-grid">
              {latestBuilds.map((rom) => {
                const accentStyle: AccentStyle = {
                  '--accent': rom.accent,
                  '--accent-soft': rom.accentSoft,
                  '--accent-strong': rom.accentStrong,
                }

                return (
                  <ReactivePanel
                    as="a"
                    className="latest-build-card"
                    href={`#${toSectionId(rom.name)}`}
                    intensity={0.5}
                    key={rom.name}
                    style={accentStyle}
                  >
                    <div className="feature-topline">
                      <span className="feature-badge">
                        <StatusDot active />
                        Latest build
                      </span>
                      <span className="feature-version">{rom.version}</span>
                    </div>
                    <h3>{rom.name}</h3>
                    <p>{rom.tagline}</p>
                    <div className="feature-meta">
                      <span>{rom.buildDate}</span>
                      <span>{rom.devices.join(' / ')}</span>
                    </div>
                  </ReactivePanel>
                )
              })}
            </div>
          </section>
        </Reveal>

        <Reveal delay={55}>
          <section className="home-rail">
            <div className="latest-updates panel">
              <div className="latest-updates-head">
                <strong>03 / FRESH SIGNALS</strong>
                <span>ROMs, sources, and builder notes</span>
              </div>
              <div className="latest-updates-list">
                {latestUpdates.map((entry) => (
                  <a className="latest-update-item" href={entry.href} key={`${entry.category}-${entry.title}`}>
                    <span>{entry.category}</span>
                    <strong>{entry.title}</strong>
                    <small>{entry.date}</small>
                  </a>
                ))}
              </div>
            </div>

            <div className="directory-preview panel" id="quick-directory">
              <div className="latest-updates-head">
                <strong>01 / TRACKED ROMS</strong>
                <span>Quick jump into each release section</span>
              </div>
              <div className="directory-preview-grid">
                {roms.map((rom) => {
                  const accentStyle: AccentStyle = {
                    '--accent': rom.accent,
                    '--accent-soft': rom.accentSoft,
                    '--accent-strong': rom.accentStrong,
                  }

                  return (
                    <ReactivePanel
                      as="a"
                      className="directory-preview-item"
                      href={`#${toSectionId(rom.name)}`}
                      intensity={0.42}
                      key={rom.name}
                      style={accentStyle}
                    >
                      <StatusDot active={rom.status === 'Stable'} />
                      <span>{rom.name}</span>
                      <strong>{rom.version}</strong>
                    </ReactivePanel>
                  )
                })}
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal delay={80}>
          <section
            className="section-banner panel"
            data-hub-accent="true"
            id="rom-directory"
            style={featuredStyle}
          >
            <div className="section-banner-copy">
              <p className="eyebrow">01 / ROM DIRECTORY</p>
              <h2>Browse every tracked ROM with clear version and device context.</h2>
              <p>
                Tracked builds with release links, supported devices, and changelogs in one view.
              </p>
            </div>

            <div className="rom-filter-bar" aria-label="ROM filters">
              <label className="rom-search">
                <span>Search the directory</span>
                <input
                  onChange={(event) => setRomQuery(event.target.value)}
                  placeholder="Search by ROM name, Android base, version, or release status"
                  type="search"
                  value={romQuery}
                />
              </label>

              <div className="rom-filter-pills" role="tablist" aria-label="Device filters">
                <button
                  className={deviceFilter === 'all' ? 'is-active' : undefined}
                  onClick={() => setDeviceFilter('all')}
                  type="button"
                >
                  All supported devices
                </button>
                <button
                  className={deviceFilter === 'pacman' ? 'is-active' : undefined}
                  onClick={() => setDeviceFilter('pacman')}
                  type="button"
                >
                  2a / pacman
                </button>
                <button
                  className={deviceFilter === 'pacmanpro' ? 'is-active' : undefined}
                  onClick={() => setDeviceFilter('pacmanpro')}
                  type="button"
                >
                  2a Plus / pacmanpro
                </button>
              </div>
            </div>

            <div className="rom-directory-grid">
              {filteredRoms.map((rom) => {
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
                    style={accentStyle}
                  >
                    <StatusDot active={rom.status === 'Stable'} />
                    <span>{rom.name}</span>
                    <strong>{rom.version}</strong>
                    <small>{rom.devices.join(' / ')}</small>
                  </ReactivePanel>
                )
              })}
            </div>

            {filteredRoms.length === 0 ? (
              <div className="rom-filter-empty">
                <strong>No ROMs matched the current search.</strong>
                <span>Try a broader search term or switch the selected device filter.</span>
              </div>
            ) : null}
          </section>
        </Reveal>

        <section className="rom-sections">
          {filteredRoms.map((rom, index) => {
            const romLinks = getReleaseLinks(rom)
            const romHasLink = romLinks.length > 0
            const accentStyle: AccentStyle = {
              '--accent': rom.accent,
              '--accent-soft': rom.accentSoft,
              '--accent-strong': rom.accentStrong,
            }

            return (
              <Reveal delay={index * 55} key={rom.name}>
                <ReactivePanel
                  as="section"
                  className="rom-section panel"
                  data-hub-accent="true"
                  id={toSectionId(rom.name)}
                  intensity={0.9}
                  style={accentStyle}
                >
                  <div className="rom-section-header">
                    <div>
                      <div className="chip-row">
                        <span className="chip chip-tonal">{rom.status}</span>
                        <span className="chip">{rom.branch}</span>
                      </div>
                      <h2>
                        <StatusDot active={rom.status === 'Stable'} />
                        {rom.name}
                      </h2>
                      <p>{rom.tagline}</p>
                    </div>
                    <span className="version-pill">{rom.version}</span>
                  </div>

                  <div className="rom-section-body">
                    <div className="rom-section-main">
                      <ul className="bullet-list" aria-label={`${rom.name} highlights`}>
                        {rom.highlights.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>

                      <div className="card-actions">
                        {romHasLink ? (
                          romLinks.map((link) => (
                            <a href={link.url} key={link.url} target="_blank" rel="noreferrer">
                              {romLinks.length > 1 ? link.label : 'Telegram Release'}
                            </a>
                          ))
                        ) : (
                          <span className="feature-link is-disabled card-action-disabled">
                            Telegram Release
                          </span>
                        )}
                      </div>

                      <CommentsThread
                        config={comments}
                        term={`rom:${rom.name.toLowerCase()}`}
                        title={`Open GitHub feedback for ${rom.name}`}
                      />

                      <details className="rom-changelog">
                        <summary>
                          <span>Build Changelog</span>
                        </summary>
                        <ul className="bullet-list">
                          {rom.changelog.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </details>
                    </div>

                    <aside className="rom-section-side">
                      <div className="rom-detail-card">
                        <span>Build Date</span>
                        <strong>{rom.buildDate}</strong>
                      </div>
                      <div className="rom-detail-card">
                        <span>Supported Devices</span>
                        <strong>{rom.devices.join(' / ')}</strong>
                      </div>
                      <div className="rom-detail-card">
                        <span>Current Focus</span>
                        <strong>{formatMaintenanceNote(rom.maintenanceNote)}</strong>
                      </div>
                      <div className="rom-detail-card">
                        <span>Release Channel</span>
                        <strong>{rom.channelLabel}</strong>
                      </div>
                    </aside>
                  </div>
                </ReactivePanel>
              </Reveal>
            )
          })}
        </section>

        <Reveal delay={90}>
          <section
            className="panel support-panel support-panel-gcam"
            data-hub-accent="true"
            id="gcams"
            style={gcamStyle}
          >
            <div className="support-copy">
              <div>
                <p className="eyebrow">02 / GCAMS</p>
                <h2>Camera picks without the usual Telegram digging.</h2>
              </div>
              <p>
                Recommended APKs and XML configs in one clean place.
              </p>
            </div>

            {gcamEntries.length > 0 ? (
              <div className="gcam-grid">
                {gcamEntries.map((entry) => {
                  const links = getGcamLinks(entry)

                  return (
                    <article className="gcam-card" key={`${entry.name}-${entry.build}`}>
                      <div className="update-meta">
                        <span className="chip chip-tonal">GCam</span>
                        <small>{entry.updatedAt}</small>
                      </div>
                      <h3>{entry.name}</h3>
                      <p>{entry.summary}</p>
                      <div className="feature-meta">
                        <span>{entry.build}</span>
                        <span>{entry.devices.join(' / ')}</span>
                      </div>
                      <div className="card-actions">
                        {links.map((link) => (
                          <a href={link.url} key={link.url} target="_blank" rel="noreferrer">
                            {link.label}
                          </a>
                        ))}
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <article className="gcam-card gcam-empty">
                <h3>Ready for your current GCam picks</h3>
                <p>
                  Add your recommended APKs and XML configs to the shared content file and this
                  section becomes the public camera reference for the hub.
                </p>
              </article>
            )}

            <CommentsThread
              config={comments}
              term="section:gcams"
              title="Open GitHub feedback for the GCam section"
            />
          </section>
        </Reveal>

        <section className="insight-grid">
          <Reveal>
            <div
              className="panel insight-panel insight-panel-source"
              data-hub-accent="true"
              id="source-pulse"
              style={sourceStyle}
            >
              <div className="insight-head">
                <div>
                  <p className="eyebrow">03 / SOURCE PULSE</p>
                  <h2>Readable source movement, not raw commit dump</h2>
                </div>
                <p>
                  Important framework, device tree, kernel, and
                  vendor-side changes without the raw commit noise.
                </p>
              </div>

              <div className="timeline">
                {sourceChanges.map((entry) => (
                  <article className="timeline-entry" key={entry.title}>
                    <div className="timeline-marker" aria-hidden="true" />
                    <div className="timeline-body">
                      <div className="timeline-topline">
                        <span>{entry.title}</span>
                        <small>{entry.date}</small>
                      </div>
                      <p>{entry.summary}</p>
                      <ul className="bullet-list">
                        {entry.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div
              className="panel insight-panel insight-panel-builder"
              data-hub-accent="true"
              id="builder-notes"
              style={builderStyle}
            >
              <div className="insight-head">
                <div>
                  <p className="eyebrow">04 / BUILDER NOTES</p>
                  <h2>Builder notes that still feel public-facing</h2>
                </div>
                <p>
                  Bring-up status, blockers, and release readiness.
                </p>
              </div>

              <div className="update-stack">
                {builderUpdates.map((update) => (
                  <article className="update-card" key={update.title}>
                    <div className="update-meta">
                      <span className="chip chip-tonal">{update.type}</span>
                      <small>{update.date}</small>
                    </div>
                    <h3>{update.title}</h3>
                    <p>{update.summary}</p>
                  </article>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        <Reveal delay={110}>
          <section
            className="panel support-panel support-panel-devices"
            data-hub-accent="true"
            id="devices"
            style={devicesStyle}
          >
            <div className="support-copy">
              <div>
                <p className="eyebrow">05 / DEVICES</p>
                <h2>Two devices, one shared release map.</h2>
              </div>
              <p>
                The coverage map for the Nothing Phone 2a lineup.
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
                  <h3>{card.title}</h3>
                  <p>{card.summary}</p>
                </article>
              ))}
            </div>
          </section>
        </Reveal>
      </main>

      <nav className="mobile-dock" aria-label="Mobile section navigation">
        {mobileDockItems.map((item) => (
          <a
            aria-label={item.label}
            className="mobile-dock-link"
            data-section={item.section}
            href={item.href}
            key={item.section}
          >
            <span className="mobile-dock-icon">
              <DockGlyph section={item.section} />
            </span>
            <span className="mobile-dock-text">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}

export default App
