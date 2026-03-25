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

    if (prefersReducedMotion.matches) {
      node.style.setProperty('--pointer-x', '50%')
      node.style.setProperty('--pointer-y', '30%')
      node.style.setProperty('--trail-x', '50%')
      node.style.setProperty('--trail-y', '30%')
      node.style.setProperty('--scene-shift-x', '0px')
      node.style.setProperty('--scene-shift-y', '0px')
      node.style.setProperty('--scene-tilt', '0deg')
      node.style.setProperty('--scroll-progress', '0')
      return
    }

    const target = { x: 0.5, y: 0.28, scroll: 0 }
    const current = { x: 0.5, y: 0.28, scroll: 0 }
    const trail = { x: 0.5, y: 0.28 }
    let frame: number | null = null
    const isCoarsePointer = () => prefersCoarsePointer.matches

    const setPointer = (x: number, y: number) => {
      node.style.setProperty('--pointer-x', `${(x * 100).toFixed(2)}%`)
      node.style.setProperty('--pointer-y', `${(y * 100).toFixed(2)}%`)
    }

    const updateStyles = () => {
      current.x += (target.x - current.x) * 0.2
      current.y += (target.y - current.y) * 0.2
      current.scroll += (target.scroll - current.scroll) * 0.14
      trail.x += (target.x - trail.x) * 0.18
      trail.y += (target.y - trail.y) * 0.18

      const shiftX = (current.x - 0.5) * (isCoarsePointer() ? 20 : 44)
      const shiftY = (current.y - 0.5) * (isCoarsePointer() ? 18 : 32)
      const tilt = (current.x - 0.5) * (isCoarsePointer() ? 1.1 : 2.4)

      node.style.setProperty('--trail-x', `${(trail.x * 100).toFixed(2)}%`)
      node.style.setProperty('--trail-y', `${(trail.y * 100).toFixed(2)}%`)
      node.style.setProperty('--scene-shift-x', `${shiftX.toFixed(2)}px`)
      node.style.setProperty('--scene-shift-y', `${shiftY.toFixed(2)}px`)
      node.style.setProperty('--scene-tilt', `${tilt.toFixed(2)}deg`)
      node.style.setProperty('--scroll-progress', current.scroll.toFixed(4))

      const settled =
        Math.abs(target.x - current.x) < 0.0015 &&
        Math.abs(target.y - current.y) < 0.0015 &&
        Math.abs(target.scroll - current.scroll) < 0.0015 &&
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

    const handlePointerMove = (event: PointerEvent) => {
      if (isCoarsePointer()) {
        return
      }

      target.x = event.clientX / window.innerWidth
      target.y = event.clientY / window.innerHeight
      setPointer(target.x, target.y)
      scheduleUpdate()
    }

    const handlePointerLeave = () => {
      if (isCoarsePointer()) {
        return
      }

      target.x = 0.5
      target.y = 0.28
      setPointer(target.x, target.y)
      scheduleUpdate()
    }

    const handleScroll = () => {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      )
      target.scroll = window.scrollY / maxScroll

      if (isCoarsePointer()) {
        target.x = 0.5 + Math.sin(window.scrollY * 0.0014) * 0.08
        target.y = 0.2 + target.scroll * 0.22
        setPointer(target.x, target.y)
      }

      scheduleUpdate()
    }

    setPointer(target.x, target.y)
    node.style.setProperty('--trail-x', `${(trail.x * 100).toFixed(2)}%`)
    node.style.setProperty('--trail-y', `${(trail.y * 100).toFixed(2)}%`)
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', handlePointerLeave)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame)
      }
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return ref
}
