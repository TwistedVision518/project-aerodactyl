import { type ReactNode } from 'react'
import { m, useReducedMotion } from 'motion/react'

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
}

export function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <m.div
      className={`reveal ${className}`.trim()}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 26 }}
      transition={{
        delay: delay / 1000,
        duration: 0.62,
        ease: [0.22, 1, 0.36, 1],
      }}
      viewport={{ amount: 0.18, margin: '0px 0px -12% 0px', once: true }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
    >
      {children}
    </m.div>
  )
}
