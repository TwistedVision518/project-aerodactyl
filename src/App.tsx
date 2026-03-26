import type { CSSProperties } from 'react'
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
  latestUpdates,
  roms,
  sourceChanges,
  supportMatrix,
} from './data/siteContent'

type AccentStyle = CSSProperties & {
  '--accent'?: string
  '--accent-soft'?: string
  '--accent-strong'?: string
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

function App() {
  const sceneRef = useSceneMotion()
  const featuredRom = roms.find((rom) => rom.name === 'Evolution X') ?? roms[0]
  const featuredRomLinks = getReleaseLinks(featuredRom)
  const featuredRomHasLink = featuredRomLinks.length > 0
  const communityHubHasLink = hasReleaseLink(communityHub.telegramUrl)

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

  return (
    <div className="app-shell scene-root" ref={sceneRef}>
      <div className="interactive-scene" aria-hidden="true">
        <div className="scene-spotlight" />
        <div className="scene-cursor-trail" />
        <div className="scene-cursor-glow" />
      </div>

      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brand-mark">PA</span>
          <span className="brand-copy">
            <strong>Project Aerodactyl</strong>
            <small>Nothing Phone 2a / 2a Plus ROM hub</small>
          </span>
        </a>

        <div className="topbar-center">
          <nav className="nav-shell" aria-label="Primary">
            <div className="nav-links">
              <a href="#rom-directory">ROMs</a>
              <a href="#gcams">GCams</a>
              <a href="#source-pulse">Source Pulse</a>
              <a href="#builder-notes">Builder Notes</a>
              <a href="#devices">Devices</a>
            </div>
          </nav>
        </div>

        <div className="topbar-actions">
          <a className="status-badge topbar-button topbar-button-secondary" href="#top">
            Release Hub
          </a>
          <a className="pill-link topbar-button topbar-button-primary" href="#rom-directory">
            Open ROM Directory
          </a>
        </div>
      </header>

      <main className="page" id="top">
        <Reveal>
          <section className="hero panel" data-hub-accent="true" style={featuredStyle}>
            <div className="hero-intro">
              <div className="hero-kicker-row">
                <p className="eyebrow">Nothing Phone 2a / 2a Plus release hub</p>
                <span className="hero-kicker-chip">Staging concept</span>
              </div>
              <h1>A clearer release workspace for the Nothing Phone 2a ROM scene.</h1>
              <p className="lede">
                Track fresh drops, Telegram links, device coverage, and source-side movement in a
                single surface built for pacman and pacmanpro users.
              </p>
              <div className="hero-signal-row" aria-label="Project signals">
                <span className="hero-signal">Current public builds</span>
                <span className="hero-signal">Telegram-linked release posts</span>
                <span className="hero-signal">Shared device community</span>
              </div>

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

              <div className="hero-marquee" aria-label="Tracked ROMs">
                {roms.map((rom) => (
                  <span className="hero-marquee-item" key={rom.name}>
                    <strong>{rom.name}</strong>
                    <small>{rom.version}</small>
                  </span>
                ))}
              </div>

            </div>

            <div className="hero-showcase">
              <ReactivePanel
                as="article"
                className="hero-feature-card"
                intensity={0.7}
                style={featuredStyle}
              >
                <div className="feature-topline">
                  <span className="feature-badge">Spotlight Build</span>
                  <span className="feature-version">{featuredRom.version}</span>
                </div>

                <h2>{featuredRom.name}</h2>
                <p>{featuredRom.tagline}</p>

                <ul className="feature-list" aria-label={`${featuredRom.name} summary`}>
                  {featuredRom.highlights.slice(0, 2).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

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
                    {featuredRomLinks.length > 1
                      ? `Open ${featuredRomLinks[0].label}`
                      : 'Open Release Post'}
                  </a>
                ) : (
                  <span className="feature-link is-disabled">Telegram Release Link</span>
                    )}
              </ReactivePanel>

              <ReactivePanel as="article" className="community-card panel" intensity={0.45}>
                <div className="feature-topline">
                  <span className="feature-badge">Community Space</span>
                  <span className="ghost-pill">Telegram</span>
                </div>

                <h2>Join the device community.</h2>
                <p>One shared Telegram space for updates, support, screenshots, and feedback.</p>

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

              <div className="hero-facts" aria-label="Project highlights">
                {quickStats.map((stat) => (
                  <article className="hero-fact" key={stat.label}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal delay={40}>
          <section className="landing-strip">
            <div className="directory-preview panel" id="quick-directory">
              <div className="latest-updates-head">
                <strong>Browse ROM lineup</strong>
                <span>Jump straight to any tracked build</span>
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
                      <span>{rom.name}</span>
                      <strong>{rom.version}</strong>
                    </ReactivePanel>
                  )
                })}
              </div>
            </div>

            <div className="latest-updates panel">
              <div className="latest-updates-head">
                <strong>Latest updates</strong>
                <span>Recent movement across releases, sources, and notes</span>
              </div>
              <div className="latest-updates-list">
                {latestUpdates.slice(0, 4).map((entry) => (
                  <a className="latest-update-item" href={entry.href} key={`${entry.category}-${entry.title}`}>
                    <span>{entry.category}</span>
                    <strong>{entry.title}</strong>
                    <small>{entry.date}</small>
                  </a>
                ))}
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
              <p className="eyebrow">01 / ROM Directory</p>
              <h2>Every active ROM, easy to scan and easy to trust.</h2>
              <p>
                Jump straight to the build you want without mixing versions,
                devices, release links, or builder context.
              </p>
            </div>

            <div className="rom-directory-grid">
              {roms.map((rom) => {
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
                    <span>{rom.name}</span>
                    <strong>{rom.version}</strong>
                    <small>{rom.devices.join(' / ')}</small>
                  </ReactivePanel>
                )
              })}
            </div>
          </section>
        </Reveal>

        <section className="rom-sections">
          {roms.map((rom, index) => {
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
                      <h2>{rom.name}</h2>
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
                        <span className="ghost-pill">{rom.maintenanceNote}</span>
                      </div>

                      <CommentsThread
                        config={comments}
                        term={`rom:${rom.name.toLowerCase()}`}
                        title={`Open GitHub feedback for ${rom.name}`}
                      />
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
                        <span>Telegram channel</span>
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
            className="panel support-panel"
            data-hub-accent="true"
            id="gcams"
            style={gcamStyle}
          >
            <div className="support-copy">
              <div>
                <p className="eyebrow">02 / GCams</p>
                <h2>Current supported GCams and config files.</h2>
              </div>
              <p>
                Publish the currently recommended GCam builds and XML configs in one place so
                users do not have to search through chat history to find the right setup.
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
                <h3>GCam recommendations will appear here</h3>
                <p>
                  This section is ready for current GCam builds and XML configs as soon as you
                  add them to the shared content JSON.
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
              className="panel insight-panel"
              data-hub-accent="true"
              id="source-pulse"
              style={sourceStyle}
            >
              <div className="insight-head">
                <div>
                  <p className="eyebrow">03 / Source Pulse</p>
                  <h2>Recent source work, shaped into something people can read</h2>
                </div>
                <p>
                  Surface the important framework, device tree, kernel, and
                  vendor-side changes without dumping raw commit noise.
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
              className="panel insight-panel"
              data-hub-accent="true"
              id="builder-notes"
              style={builderStyle}
            >
              <div className="insight-head">
                <div>
                  <p className="eyebrow">04 / Builder Notes</p>
                  <h2>Builder-side progress with room for actual release context</h2>
                </div>
                <p>
                  Keep community-facing notes readable while still making room
                  for bring-up status, blockers, and release readiness.
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
            className="panel support-panel"
            data-hub-accent="true"
            id="devices"
            style={devicesStyle}
          >
            <div className="support-copy">
              <div>
                <p className="eyebrow">05 / Device Coverage</p>
                <h2>Focused, expandable, and built around the 2a family.</h2>
              </div>
              <p>
                The structure is ready for more ROMs, more devices, and a
                cleaner release workflow as the project expands.
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
    </div>
  )
}

export default App
