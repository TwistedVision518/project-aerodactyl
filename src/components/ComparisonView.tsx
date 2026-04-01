import React from 'react'
import { m } from 'motion/react'
import type { RomEntry } from '../data/types'

type ComparisonViewProps = {
  selectedRoms: RomEntry[]
  onClose: () => void
}

export const ComparisonView = ({ selectedRoms, onClose }: ComparisonViewProps) => {
  return (
    <div className="comparison-view-root">
      <m.div 
        className="comparison-view-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <m.div 
        className="comparison-view surface-editorial"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="comparison-view-header">
          <h2>Compare ROMs</h2>
          <button onClick={onClose} className="close-view" aria-label="Close comparison">&times;</button>
        </div>
        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                {selectedRoms.map(rom => (
                  <th key={rom.name} style={{ color: rom.accent }}>{rom.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Version</td>
                {selectedRoms.map(rom => <td key={rom.name}>{rom.version}</td>)}
              </tr>
              <tr>
                <td>Status</td>
                {selectedRoms.map(rom => (
                  <td key={rom.name}>
                    <span className="chip" style={{ borderColor: rom.accentSoft, color: rom.accent }}>
                      {rom.status}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td>Build Date</td>
                {selectedRoms.map(rom => <td key={rom.name}>{rom.buildDate}</td>)}
              </tr>
              <tr>
                <td>Devices</td>
                {selectedRoms.map(rom => <td key={rom.name}>{rom.devices.join(', ')}</td>)}
              </tr>
              <tr>
                <td>Android</td>
                {selectedRoms.map(rom => <td key={rom.name}>{rom.branch}</td>)}
              </tr>
              <tr>
                <td>Maintenance</td>
                {selectedRoms.map(rom => <td key={rom.name} className="comparison-small-text">{rom.maintenanceNote}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </m.div>
    </div>
  )
}
