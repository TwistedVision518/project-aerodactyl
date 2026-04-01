import { memo } from 'react'
import { m } from 'motion/react'
import type { LatestUpdate } from '../data/siteContent'

type PulseTimelineProps = {
  updates: LatestUpdate[]
  onUpdateClick: (event: React.MouseEvent<HTMLAnchorElement>, href: string) => void
}

export const PulseTimeline = memo(({ updates, onUpdateClick }: PulseTimelineProps) => {
  return (
    <div className="pulse-timeline">
      <div className="pulse-timeline-line" />
      <div className="pulse-timeline-items">
        {updates.map((update, index) => (
          <m.a
            key={`${update.category}-${update.title}-${index}`}
            href={update.href}
            className="pulse-timeline-item"
            onClick={(e) => onUpdateClick(e, update.href)}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <div className="pulse-timeline-dot-shell">
              <div className={`pulse-timeline-dot pulse-timeline-dot-${update.category.toLowerCase()}`} />
            </div>
            <div className="pulse-timeline-content">
              <div className="pulse-timeline-meta">
                <span className="pulse-timeline-category">{update.category}</span>
                <span className="pulse-timeline-date">{update.date}</span>
              </div>
              <strong className="pulse-timeline-title">{update.title}</strong>
            </div>
          </m.a>
        ))}
      </div>
    </div>
  )
})

PulseTimeline.displayName = 'PulseTimeline'
