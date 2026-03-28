import { useEffect, useRef } from 'react'

export function useSceneMotion() {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = ref.current

    if (!node) {
      return
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const prefersCoarsePointer = window.matchMedia('(pointer: coarse)')
    const fineCenter = { x: 0.5, y: 0.28 }
    const coarseCenter = { x: 0.5, y: 0.24 }
    const applied = new Map<string, string>()
    const sectionIds = ['rom-directory', 'gcams', 'devices']
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null)
    const visibleSections = new Map<string, { ratio: number; top: number }>()
    let frame: number | null = null
    let sectionFrame: number | null = null
    let observer: IntersectionObserver | null = null

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
    const applyMode = () => {
      node.dataset.inputMode = isCoarsePointer() ? 'coarse' : 'fine'
    }
    const applyPerformanceProfile = () => {
      node.dataset.performance = 'full'
    }
    const setActiveSection = (sectionId: string) => {
      setStyleValue('--active-section', sectionId)
      node.dataset.activeSection = sectionId
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
      setActiveSection('top')
    }
    const resolveActiveSection = () => {
      if (window.scrollY < Math.max(160, window.innerHeight * 0.18)) {
        setActiveSection('top')
        return
      }

      if (visibleSections.size === 0) {
        return
      }

      let active = 'top'
      let bestRatio = -1
      let bestTopDistance = Number.POSITIVE_INFINITY
      const probeLine = window.innerHeight * 0.34

      for (const [id, entry] of visibleSections) {
        const topDistance = Math.abs(entry.top - probeLine)

        if (
          entry.ratio > bestRatio ||
          (Math.abs(entry.ratio - bestRatio) < 0.001 && topDistance < bestTopDistance)
        ) {
          active = id
          bestRatio = entry.ratio
          bestTopDistance = topDistance
        }
      }

      if (active !== 'top') {
        setActiveSection(active)
      }
    }

    const updateActiveSection = () => {
      sectionFrame = null
      resolveActiveSection()
    }
    const scheduleSectionUpdate = () => {
      if (sectionFrame !== null) {
        return
      }

      sectionFrame = window.requestAnimationFrame(updateActiveSection)
    }

    const updateStyles = () => {
      const coarse = isCoarsePointer()

      if (coarse) {
        frame = null
        return
      }

      current.x += (target.x - current.x) * 0.22
      current.y += (target.y - current.y) * 0.22
      trail.x += (target.x - trail.x) * 0.12
      trail.y += (target.y - trail.y) * 0.12

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

    const handleModeChange = () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame)
        frame = null
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
    if (sections.length > 0) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              visibleSections.set(entry.target.id, {
                ratio: entry.intersectionRatio,
                top: entry.boundingClientRect.top,
              })
            } else {
              visibleSections.delete(entry.target.id)
            }
          }

          scheduleSectionUpdate()
        },
        {
          root: null,
          rootMargin: '-24% 0px -46% 0px',
          threshold: [0, 0.12, 0.24, 0.4, 0.6, 0.8, 1],
        },
      )

      sections.forEach((section) => observer?.observe(section))
    }

    scheduleSectionUpdate()
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', handlePointerLeave)
    window.addEventListener('scroll', scheduleSectionUpdate, { passive: true })
    window.addEventListener('resize', scheduleSectionUpdate, { passive: true })
    prefersCoarsePointer.addEventListener('change', handleModeChange)

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame)
      }

      if (sectionFrame !== null) {
        window.cancelAnimationFrame(sectionFrame)
      }

      observer?.disconnect()

      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('scroll', scheduleSectionUpdate)
      window.removeEventListener('resize', scheduleSectionUpdate)
      prefersCoarsePointer.removeEventListener('change', handleModeChange)
    }
  }, [])

  return ref
}
