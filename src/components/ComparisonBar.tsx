import { m, AnimatePresence } from 'motion/react'

type ComparisonBarProps = {
  count: number
  onCompare: () => void
  onClear: () => void
}

export const ComparisonBar = ({ count, onCompare, onClear }: ComparisonBarProps) => {
  return (
    <AnimatePresence>
      {count > 0 && (
        <m.div
          className="comparison-bar"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        >
          <div className="comparison-bar-content">
            <span className="comparison-count"><strong>{count}</strong> ROMs selected</span>
            <div className="comparison-actions">
              <button className="clear-comparison" onClick={onClear}>Clear</button>
              <button 
                className={`action-primary compare-trigger ${count < 2 ? 'is-disabled' : ''}`} 
                onClick={onCompare}
                disabled={count < 2}
              >
                {count < 2 ? 'Select 1 more' : 'Compare Now'}
              </button>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
