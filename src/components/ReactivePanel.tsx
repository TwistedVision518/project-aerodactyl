import {
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
  useEffect,
  useRef,
} from 'react'

type BaseProps<T extends ElementType> = {
  as?: T
  children: ReactNode
  className?: string
  intensity?: number
}

type ReactivePanelProps<T extends ElementType> = BaseProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof BaseProps<T>>

export function ReactivePanel<T extends ElementType = 'div'>({
  as,
  children,
  className = '',
  intensity = 1,
  ...rest
}: ReactivePanelProps<T>) {
  const Component = (as ?? 'div') as ElementType
  const ref = useRef<HTMLElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const targetRef = useRef({ x: 0.5, y: 0.5, active: 0 })
  const currentRef = useRef({ x: 0.5, y: 0.5, active: 0 })
  const interactiveRef = useRef(true)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const media = window.matchMedia('(hover: hover) and (pointer: fine)')
    const updateMode = () => {
      interactiveRef.current = media.matches
    }

    updateMode()
    media.addEventListener('change', updateMode)

    return () => media.removeEventListener('change', updateMode)
  }, [])

  const updateStyles = () => {
    const node = ref.current

    if (!node) {
      frameRef.current = null
      return
    }

    const current = currentRef.current
    const target = targetRef.current

    current.x += (target.x - current.x) * 0.22
    current.y += (target.y - current.y) * 0.22
    current.active += (target.active - current.active) * 0.24

    const rotateY = (current.x - 0.5) * 6 * intensity
    const rotateX = (0.5 - current.y) * 6 * intensity
    const lift = current.active * 6 * intensity

    node.style.setProperty('--panel-rotate-x', `${rotateX.toFixed(2)}deg`)
    node.style.setProperty('--panel-rotate-y', `${rotateY.toFixed(2)}deg`)
    node.style.setProperty('--panel-glow-x', `${(current.x * 100).toFixed(2)}%`)
    node.style.setProperty('--panel-glow-y', `${(current.y * 100).toFixed(2)}%`)
    node.style.setProperty('--panel-lift', `${lift.toFixed(2)}px`)
    node.style.setProperty('--panel-active', current.active.toFixed(3))

    const settled =
      Math.abs(target.x - current.x) < 0.002 &&
      Math.abs(target.y - current.y) < 0.002 &&
      Math.abs(target.active - current.active) < 0.01

    if (settled) {
      frameRef.current = null
      return
    }

    frameRef.current = window.requestAnimationFrame(updateStyles)
  }

  const scheduleUpdate = () => {
    if (frameRef.current !== null) {
      return
    }

    frameRef.current = window.requestAnimationFrame(updateStyles)
  }

  const handlePointerMove: NonNullable<ComponentPropsWithoutRef<'div'>['onPointerMove']> = (
    event,
  ) => {
    if (!interactiveRef.current) {
      return
    }

    const node = ref.current

    if (!node) {
      return
    }

    const rect = node.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height

    targetRef.current.x = Math.max(0, Math.min(1, x))
    targetRef.current.y = Math.max(0, Math.min(1, y))
    targetRef.current.active = 1
    scheduleUpdate()
  }

  const handlePointerLeave: NonNullable<ComponentPropsWithoutRef<'div'>['onPointerLeave']> = () => {
    if (!interactiveRef.current) {
      return
    }

    targetRef.current.x = 0.5
    targetRef.current.y = 0.5
    targetRef.current.active = 0
    scheduleUpdate()
  }

  return (
    <Component
      {...rest}
      className={`reactive-panel ${className}`.trim()}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      ref={ref}
    >
      {children}
    </Component>
  )
}
