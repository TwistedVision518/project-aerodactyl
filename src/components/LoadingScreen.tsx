import { useEffect, useState, useRef } from 'react'

const LOADING_PARTS = [
  { name: 'part0', frames: 98, startNum: 1001 },
  { name: 'part1', frames: 39, startNum: 2001 },
  { name: 'part2', frames: 80, startNum: 3001, loop: false },
]

const FRAME_INTERVAL = 1000 / 60

export function LoadingScreen({
  nativeMode = false,
  onComplete,
}: {
  nativeMode?: boolean
  onComplete: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [isPreloaded, setIsPreloaded] = useState(false)
  const [hasRenderedFrame, setHasRenderedFrame] = useState(false)
  const tintRef = useRef({
    start: '#a76fff',
    middle: '#785eff',
    end: '#7bd5ff',
  })
  
  const frameRef = useRef(0)
  const partRef = useRef(0)
  const imagesRef = useRef<HTMLImageElement[][]>([[], [], []])
  const lastTimeRef = useRef(0)

  useEffect(() => {
    if (!nativeMode) {
      return
    }

    const finishTimer = window.setTimeout(() => {
      setIsVisible(false)
      window.setTimeout(onComplete, 280)
    }, 900)

    return () => window.clearTimeout(finishTimer)
  }, [nativeMode, onComplete])

  useEffect(() => {
    if (nativeMode || typeof window === 'undefined') {
      return
    }

    const syncTint = () => {
      const styles = getComputedStyle(document.documentElement)

      tintRef.current = {
        start: styles.getPropertyValue('--scene-wave-a').trim() || '#a76fff',
        middle: styles.getPropertyValue('--scene-wave-c').trim() || '#785eff',
        end: styles.getPropertyValue('--scene-wave-b').trim() || '#7bd5ff',
      }
    }

    syncTint()

    const observer = new MutationObserver(syncTint)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style'],
    })

    return () => observer.disconnect()
  }, [nativeMode])

  useEffect(() => {
    if (nativeMode) {
      return
    }

    // 1. Preload all images
    let loadedCount = 0
    const totalFrames = LOADING_PARTS.reduce((acc, p) => acc + p.frames, 0)

    LOADING_PARTS.forEach((p, pIdx) => {
      for (let i = 1; i <= p.frames; i++) {
        const img = new Image()
        const num = (p.startNum + i - 1).toString().padStart(5, '0')
        img.src = `/assets/loading/${p.name}/${num}.png`
        
        img.onload = () => {
          loadedCount++
          imagesRef.current[pIdx][i - 1] = img
          
          if (loadedCount === totalFrames) {
            setIsPreloaded(true)
          }
        }
        
        img.onerror = () => {
          // If some images fail, we still want to continue
          loadedCount++
          if (loadedCount === totalFrames) {
            setIsPreloaded(true)
          }
        }
      }
    })

    // Safety timeout for preloading
    const preloadTimeout = setTimeout(() => {
      setIsPreloaded(true)
    }, 5000)

    return () => clearTimeout(preloadTimeout)
  }, [nativeMode])

  useEffect(() => {
    if (nativeMode || !isPreloaded) return

    let animationId: number
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')

    const startAnimation = () => {
      const animate = (time: number) => {
        if (!lastTimeRef.current) {
          lastTimeRef.current = time
        }

        const delta = time - lastTimeRef.current
        const currentInterval = partRef.current === 0 ? (1000 / 50) : FRAME_INTERVAL

        if (delta > currentInterval) {
          lastTimeRef.current = time - (delta % currentInterval)

          let nextFrame = frameRef.current + 1
          let nextPart = partRef.current

          if (nextFrame > LOADING_PARTS[nextPart].frames) {
            if (nextPart < LOADING_PARTS.length - 1) {
              nextPart += 1
              nextFrame = 1
              partRef.current = nextPart
            } else {
              // End animation
              setIsVisible(false)
              setTimeout(onComplete, 620)
              return
            }
          }

          frameRef.current = nextFrame
          
          if (ctx && canvas) {
            const img = imagesRef.current[nextPart][nextFrame - 1]
            if (img) {
              if (canvas.width !== img.width || canvas.height !== img.height) {
                canvas.width = img.width
                canvas.height = img.height
              }
              ctx.clearRect(0, 0, canvas.width, canvas.height)
              ctx.drawImage(img, 0, 0)
              const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
              gradient.addColorStop(0, tintRef.current.start)
              gradient.addColorStop(0.52, tintRef.current.middle)
              gradient.addColorStop(1, tintRef.current.end)
              ctx.globalCompositeOperation = 'source-atop'
              ctx.fillStyle = gradient
              ctx.fillRect(0, 0, canvas.width, canvas.height)
              ctx.globalCompositeOperation = 'source-over'
              setHasRenderedFrame(true)
            }
          }
        }

        animationId = requestAnimationFrame(animate)
      }

      animationId = requestAnimationFrame(animate)
    }

    startAnimation()

    // Auto-complete loading after some time if it's too long
    const timeout = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 620)
    }, 5000)

    return () => {
      cancelAnimationFrame(animationId)
      clearTimeout(timeout)
    }
  }, [isPreloaded, nativeMode, onComplete])

  return (
    <div className={`loading-overlay ${!isVisible ? 'is-hidden' : ''}`}>
      <div aria-hidden="true" className="loading-scene">
        <div className="loading-scene-vignette" />
        <div className="loading-scene-grid" />
        <div className="loading-scene-wave loading-scene-wave-left" />
        <div className="loading-scene-wave loading-scene-wave-right" />
        <div className="loading-scene-aura" />
      </div>
      <div className="loading-content">
        <span className="loading-badge">{nativeMode ? 'Opening app shell' : 'Booting release dashboard'}</span>
        <div className={`loading-panel ${nativeMode ? 'is-native' : ''}`.trim()}>
          <div
            className={`loading-logo-shell ${nativeMode ? 'is-native' : ''} ${hasRenderedFrame ? 'is-hidden' : ''}`.trim()}
            aria-hidden="true"
          >
            <span className="loading-logo-mark">
              <img alt="" className="loading-logo-image" src="/favicon.svg" />
            </span>
          </div>
          {nativeMode ? (
            <div className="loading-native-progress" aria-hidden="true">
              <span className="loading-native-progress-bar" />
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className={`loading-canvas ${hasRenderedFrame ? 'is-visible' : ''}`.trim()}
            />
          )}
          <div className="loading-copy">
            <strong>Project Aerodactyl</strong>
            <span>{nativeMode ? 'Preparing the Android app' : 'Preparing the release hub'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
