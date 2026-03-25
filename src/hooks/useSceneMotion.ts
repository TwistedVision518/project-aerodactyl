import { useEffect, useRef } from 'react'

type NetworkInformationLike = {
  saveData?: boolean
  addEventListener?: (type: 'change', listener: () => void) => void
  removeEventListener?: (type: 'change', listener: () => void) => void
}

type NavigatorPerformanceHints = Navigator & {
  connection?: NetworkInformationLike
  deviceMemory?: number
}

export function useSceneMotion() {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = ref.current

    if (!node) {
      return
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const prefersCoarsePointer = window.matchMedia('(pointer: coarse)')
    const navigatorHints = navigator as NavigatorPerformanceHints
    const connection = navigatorHints.connection
    const fineCenter = { x: 0.5, y: 0.28 }
    const coarseCenter = { x: 0.5, y: 0.24 }
    const applied = new Map<string, string>()
    const sectionAccentNodes = Array.from(
      node.querySelectorAll<HTMLElement>('[data-hub-accent="true"]'),
    )
    let frame: number | null = null
    let sectionFrame: number | null = null
    let activeSectionId = ''

    const isCoarsePointer = () => prefersCoarsePointer.matches
    const getCenter = () => (isCoarsePointer() ? coarseCenter : fineCenter)
    const setStyleValue = (name: string, value: string) => {
      if (applied.get(name) === value) {
        return
      }

      applied.set(name, value)
      node.style.setProperty(name, value)
    }
    const setPointer = (x: number, y: number) => {
      setStyleValue('--pointer-x', `${(x * 100).toFixed(2)}%`)
      setStyleValue('--pointer-y', `${(y * 100).toFixed(2)}%`)
    }
    const setFocus = (x: number, y: number) => {
      setStyleValue('--focus-x', `${(x * 100).toFixed(2)}%`)
      setStyleValue('--focus-y', `${(y * 100).toFixed(2)}%`)
    }
    const setTrail = (x: number, y: number) => {
      setStyleValue('--trail-x', `${(x * 100).toFixed(2)}%`)
      setStyleValue('--trail-y', `${(y * 100).toFixed(2)}%`)
    }
    const setHubAccent = (section: HTMLElement | null) => {
      if (!section) {
        return
      }

      const nextSectionId = section.id || 'top'

      if (activeSectionId === nextSectionId) {
        return
      }

      activeSectionId = nextSectionId

      const styles = window.getComputedStyle(section)
      const accent = styles.getPropertyValue('--accent').trim() || '#5a72ff'
      const accentSoft = styles.getPropertyValue('--accent-soft').trim() || 'rgba(90, 114, 255, 0.16)'
      const accentStrong = styles.getPropertyValue('--accent-strong').trim() || '#c6d1ff'

      setStyleValue('--hub-accent', accent)
      setStyleValue('--hub-accent-soft', accentSoft)
      setStyleValue('--hub-accent-strong', accentStrong)
    }
    const updateActiveSection = () => {
      sectionFrame = null

      if (sectionAccentNodes.length === 0) {
        return
      }

      const probeLine = window.innerHeight * 0.34
      let bestNode = sectionAccentNodes[0] ?? null
      let bestScore = Number.POSITIVE_INFINITY

      for (const section of sectionAccentNodes) {
        const rect = section.getBoundingClientRect()
        const containsProbe = rect.top <= probeLine && rect.bottom >= probeLine

        if (containsProbe) {
          bestNode = section
          break
        }

        const score = Math.min(
          Math.abs(rect.top - probeLine),
          Math.abs(rect.bottom - probeLine),
        )

        if (score < bestScore) {
          bestScore = score
          bestNode = section
        }
      }

      setHubAccent(bestNode)
    }
    const scheduleSectionUpdate = () => {
      if (sectionFrame !== null) {
        return
      }

      sectionFrame = window.requestAnimationFrame(updateActiveSection)
    }
    const applyMode = () => {
      node.dataset.inputMode = isCoarsePointer() ? 'coarse' : 'fine'
    }
    const applyPerformanceProfile = () => {
      const saveData = connection?.saveData === true
      const lowMemory =
        typeof navigatorHints.deviceMemory === 'number' && navigatorHints.deviceMemory <= 4
      const lowCpu = navigator.hardwareConcurrency <= 6

      node.dataset.performance = saveData || lowMemory || lowCpu ? 'lite' : 'full'
    }
    const center = getCenter()
    const target = { x: center.x, y: center.y }
    const current = { x: center.x, y: center.y }
    const trail = { x: center.x, y: center.y }

    const resetScene = () => {
      const nextCenter = getCenter()

      target.x = nextCenter.x
      target.y = nextCenter.y
      current.x = nextCenter.x
      current.y = nextCenter.y
      trail.x = nextCenter.x
      trail.y = nextCenter.y
      applyMode()
      applyPerformanceProfile()
      setPointer(nextCenter.x, nextCenter.y)
      setFocus(nextCenter.x, nextCenter.y)
      setTrail(nextCenter.x, nextCenter.y)
      activeSectionId = ''
      updateActiveSection()
    }

    const updateStyles = () => {
      const coarse = isCoarsePointer()

      if (coarse) {
        frame = null
        return
      }

      current.x += (target.x - current.x) * 0.18
      current.y += (target.y - current.y) * 0.18
      trail.x += (target.x - trail.x) * 0.1
      trail.y += (target.y - trail.y) * 0.1

      setPointer(current.x, current.y)
      setFocus(current.x, current.y)
      setTrail(trail.x, trail.y)

      const settled =
        Math.abs(target.x - current.x) < 0.0015 &&
        Math.abs(target.y - current.y) < 0.0015 &&
        Math.abs(target.x - trail.x) < 0.002 &&
        Math.abs(target.y - trail.y) < 0.002

      if (settled) {
        frame = null
        return
      }

      frame = window.requestAnimationFrame(updateStyles)
    }

    const scheduleUpdate = () => {
      if (frame !== null) {
        return
      }

      frame = window.requestAnimationFrame(updateStyles)
    }

    const updateTarget = (clientX: number, clientY: number) => {
      target.x = Math.max(0, Math.min(1, clientX / window.innerWidth))
      target.y = Math.max(0, Math.min(1, clientY / window.innerHeight))

      if (isCoarsePointer()) {
        current.x = target.x
        current.y = target.y
        trail.x = target.x
        trail.y = target.y
        setPointer(target.x, target.y)
        setFocus(target.x, target.y)
        setTrail(target.x, target.y)
        return
      }

      scheduleUpdate()
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (isCoarsePointer()) {
        return
      }

      updateTarget(event.clientX, event.clientY)
    }

    const handlePointerLeave = () => {
      if (isCoarsePointer()) {
        return
      }

      const nextCenter = getCenter()
      target.x = nextCenter.x
      target.y = nextCenter.y
      scheduleUpdate()
    }

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]

      if (!touch) {
        return
      }

      updateTarget(touch.clientX, touch.clientY)
    }

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]

      if (!touch) {
        return
      }

      updateTarget(touch.clientX, touch.clientY)
    }

    const handleTouchEnd = () => {
      const nextCenter = getCenter()

      target.x = nextCenter.x
      target.y = nextCenter.y
      current.x = nextCenter.x
      current.y = nextCenter.y
      trail.x = nextCenter.x
      trail.y = nextCenter.y
      setPointer(nextCenter.x, nextCenter.y)
      setFocus(nextCenter.x, nextCenter.y)
      setTrail(nextCenter.x, nextCenter.y)
    }

    const handleModeChange = () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame)
        frame = null
      }

      if (sectionFrame !== null) {
        window.cancelAnimationFrame(sectionFrame)
        sectionFrame = null
      }

      resetScene()
    }

    applyMode()
    applyPerformanceProfile()

    if (prefersReducedMotion.matches) {
      resetScene()
      return
    }

    resetScene()
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', handlePointerLeave)
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('scroll', scheduleSectionUpdate, { passive: true })
    window.addEventListener('resize', scheduleSectionUpdate, { passive: true })
    prefersCoarsePointer.addEventListener('change', handleModeChange)
    connection?.addEventListener?.('change', handleModeChange)

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame)
      }

      if (sectionFrame !== null) {
        window.cancelAnimationFrame(sectionFrame)
      }

      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('scroll', scheduleSectionUpdate)
      window.removeEventListener('resize', scheduleSectionUpdate)
      prefersCoarsePointer.removeEventListener('change', handleModeChange)
      connection?.removeEventListener?.('change', handleModeChange)
    }
  }, [])

  return ref
}
