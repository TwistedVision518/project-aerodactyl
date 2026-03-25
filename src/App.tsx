import type { CSSProperties } from 'react'
import './App.css'
import { ReactivePanel } from './components/ReactivePanel'
import { Reveal } from './components/Reveal'
import { useSceneMotion } from './hooks/useSceneMotion'
import {
  builderUpdates,
  expansionCards,
  quickStats,
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

function App() {
  const sceneRef = useSceneMotion()
  const featuredRom = roms.find((rom) => rom.name === 'Evolution X') ?? roms[0]

  const featuredStyle: AccentStyle = {
    '--accent': featuredRom.accent,
    '--accent-soft': featuredRom.accentSoft,
    '--accent-strong': featuredRom.accentStrong,
  }

  return (
    <div className="app-shell scene-root" ref={sceneRef}>
      <div className="interactive-scene" aria-hidden="true">
        <div className="scene-aurora scene-aurora-a" />
        <div className="scene-aurora scene-aurora-b" />
        <div className="scene-spotlight" />
        <div className="scene-cursor-trail" />
        <div className="scene-cursor-glow" />
      </div>

      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brand-mark">PA</span>
          <span className="brand-copy">
            <strong>Project Aerodactyl</strong>
            <small>Nothing Phone 2a / 2a Plus release hub</small>
          </span>
        </a>

        <nav className="nav-links" aria-label="Primary">
          <a href="#rom-directory">ROMs</a>
          <a href="#source-pulse">Source Pulse</a>
          <a href="#builder-notes">Builder Notes</a>
          <a href="#devices">Devices</a>
        </nav>

        <div className="topbar-actions">
          <span className="status-badge">Per-ROM layout</span>
          <a className="pill-link" href="#rom-directory">
            Open ROM Directory
          </a>
        </div>
      </header>

      <main className="page" id="top">
        <Reveal>
          <section className="hero panel">
            <div className="hero-copy">
              <div className="hero-kicker">
                <span className="tonal-chip">Releases</span>
                <span className="tonal-chip">Source changes</span>
                <span className="tonal-chip">Builder notes</span>
              </div>

              <p className="eyebrow">Project Aerodactyl</p>
              <h1>Each ROM now gets its own section, with less room for confusion.</h1>
              <p className="lede">
                The site has been reorganized around distinct ROM lanes so users
                can move from one build to the next without mixing versions,
                devices, or Telegram links.
              </p>

              <div className="hero-actions">
                <a className="action-primary" href="#rom-directory">
                  Browse ROM Sections
                </a>
                <a className="action-secondary" href="#source-pulse">
                  View Source Pulse
                </a>
              </div>

              <div className="hero-story">
                <strong>Cleaner base palette, stronger separation.</strong>
                <p>
                  The overall color system is calmer now, and the ROM-specific
                  accents are doing the identity work instead of the whole page
                  fighting for attention.
                </p>
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
                <div className="feature-topline">
                  <span className="feature-badge">Featured ROM</span>
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

                <a className="feature-link" href={featuredRom.telegramUrl} target="_blank" rel="noreferrer">
                  Open Telegram Post
                </a>
              </ReactivePanel>

              <div className="directory-preview">
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
                      intensity={0.55}
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
          </section>
        </Reveal>

        <Reveal delay={80}>
          <section className="section-banner panel" id="rom-directory">
            <div className="section-banner-copy">
              <p className="eyebrow">ROM Directory</p>
              <h2>Dedicated sections for every ROM you build.</h2>
              <p>
                Each entry below has its own anchored lane with version, device
                support, release note summary, and a direct Telegram handoff.
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
                        <a href={rom.telegramUrl} target="_blank" rel="noreferrer">
                          Telegram Download
                        </a>
                        <span className="ghost-pill">{rom.maintenanceNote}</span>
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

        <section className="insight-grid">
          <Reveal>
            <div className="panel insight-panel" id="source-pulse">
              <div className="insight-head">
                <div>
                  <p className="eyebrow">Source Pulse</p>
                  <h2>Recent source changes in a format people can actually read</h2>
                </div>
                <p>
                  This section keeps recent source work concise instead of
                  reading like raw commit output.
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
            <div className="panel insight-panel" id="builder-notes">
              <div className="insight-head">
                <div>
                  <p className="eyebrow">Builder Notes</p>
                  <h2>Builder-side progress and project notes</h2>
                </div>
                <p>
                  Use this area for bring-up status, testing notes, and general
                  progress between releases.
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
          <section className="panel support-panel" id="devices">
            <div className="support-copy">
              <div>
                <p className="eyebrow">Device Coverage</p>
                <h2>Built around your Nothing lineup with room to grow.</h2>
              </div>
              <p>
                The data model still scales cleanly if you add more ROMs,
                devices, or automation later.
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
