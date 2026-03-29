import { type ReactNode, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { m, useReducedMotion } from 'motion/react'

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
}

export function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const prefersReducedMotion = useReducedMotion()
  const isNativeApp = Capacitor.isNativePlatform()
  const [useViewportReveal, setUseViewportReveal] = useState(() => {
    if (typeof window === 'undefined') {
      return !isNativeApp
    }

    if (isNativeApp) {
      return false
    }

    return window.matchMedia('(hover: hover) and (pointer: fine)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || isNativeApp) {
      return
    }

    const media = window.matchMedia('(hover: hover) and (pointer: fine)')
    const syncRevealMode = () => setUseViewportReveal(media.matches)
    media.addEventListener('change', syncRevealMode)

    return () => media.removeEventListener('change', syncRevealMode)
  }, [isNativeApp])

  const useImmediateReveal = prefersReducedMotion || !useViewportReveal

  return (
    <m.div
      className={`reveal ${className}`.trim()}
      initial={useImmediateReveal ? false : { opacity: 0, y: 26 }}
      transition={{
        delay: delay / 1000,
        duration: 0.62,
        ease: [0.22, 1, 0.36, 1],
      }}
      viewport={useImmediateReveal ? undefined : { amount: 0.18, margin: '0px 0px -12% 0px', once: true }}
      whileInView={useImmediateReveal ? undefined : { opacity: 1, y: 0 }}
    >
      {children}
    </m.div>
  )
}
