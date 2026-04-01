import React, { useEffect } from 'react'
import { m, AnimatePresence } from 'motion/react'

type BottomSheetProps = {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export const BottomSheet = ({ isOpen, onClose, children, title }: BottomSheetProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="bottom-sheet-root">
          <m.div
            className="bottom-sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <m.div
            className="bottom-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose()
            }}
          >
            <div className="bottom-sheet-handle" />
            {title && (
              <div className="bottom-sheet-header">
                <h3>{title}</h3>
                <button className="bottom-sheet-close" onClick={onClose} aria-label="Close sheet">&times;</button>
              </div>
            )}
            <div className="bottom-sheet-content">
              {children}
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  )
}
