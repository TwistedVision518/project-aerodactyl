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
  const rectRef = useRef<DOMRect | null>(null)
  const appliedRef = useRef<Record<string, string>>({})
  const interactiveRef = useRef(true)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const media = window.matchMedia('(hover: hover) and (pointer: fine)')
    let listening = false

    const resetRect = () => {
      rectRef.current = null
    }

    const syncListeners = () => {
      if (media.matches && !listening) {
        window.addEventListener('resize', resetRect, { passive: true })
        listening = true
      } else if (!media.matches && listening) {
        window.removeEventListener('resize', resetRect)
        listening = false
      }
    }

    const updateMode = () => {
      interactiveRef.current = media.matches
      if (!media.matches) {
        rectRef.current = null
      }
      syncListeners()
    }

    updateMode()
    media.addEventListener('change', updateMode)

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }

      media.removeEventListener('change', updateMode)
      if (listening) {
        window.removeEventListener('resize', resetRect)
      }
    }
  }, [])

  const setStyleValue = (name: string, value: string) => {
    const node = ref.current

    if (!node || appliedRef.current[name] === value) {
      return
    }

    appliedRef.current[name] = value
    node.style.setProperty(name, value)
  }

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

    if (current.active > 0.02) {
      node.style.willChange = 'box-shadow, opacity'
    }

    setStyleValue('--panel-glow-x', `${(current.x * 100).toFixed(2)}%`)
    setStyleValue('--panel-glow-y', `${(current.y * 100).toFixed(2)}%`)
    setStyleValue('--panel-active', current.active.toFixed(3))

    const settled =
      Math.abs(target.x - current.x) < 0.002 &&
      Math.abs(target.y - current.y) < 0.002 &&
      Math.abs(target.active - current.active) < 0.01

    if (settled) {
      if (target.active === 0) {
        node.style.willChange = 'auto'
      }
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

    const rect = rectRef.current ?? node.getBoundingClientRect()
    rectRef.current = rect
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height

    targetRef.current.x = Math.max(0, Math.min(1, x))
    targetRef.current.y = Math.max(0, Math.min(1, y))
    targetRef.current.active = 1
    scheduleUpdate()
  }

  const handlePointerEnter: NonNullable<ComponentPropsWithoutRef<'div'>['onPointerEnter']> = () => {
    const node = ref.current

    if (!node || !interactiveRef.current) {
      return
    }

    rectRef.current = node.getBoundingClientRect()
    node.style.willChange = 'transform, box-shadow'
  }

  const handlePointerLeave: NonNullable<ComponentPropsWithoutRef<'div'>['onPointerLeave']> = () => {
    if (!interactiveRef.current) {
      return
    }

    rectRef.current = null
    targetRef.current.x = 0.5
    targetRef.current.y = 0.5
    targetRef.current.active = 0
    scheduleUpdate()
  }

  return (
    <Component
      {...rest}
      className={`reactive-panel ${className}`.trim()}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      ref={ref}
    >
      {children}
    </Component>
  )
}
