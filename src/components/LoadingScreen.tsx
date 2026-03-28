import { useEffect, useState, useRef } from 'react'

const LOADING_PARTS = [
  { name: 'part0', frames: 98, startNum: 1001 },
  { name: 'part1', frames: 39, startNum: 2001 },
  { name: 'part2', frames: 80, startNum: 3001, loop: false },
]

const FRAME_INTERVAL = 1000 / 60

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [isPreloaded, setIsPreloaded] = useState(false)
  
  const frameRef = useRef(0)
  const partRef = useRef(0)
  const imagesRef = useRef<HTMLImageElement[][]>([[], [], []])
  const lastTimeRef = useRef(0)

  useEffect(() => {
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
  }, [])

  useEffect(() => {
    if (!isPreloaded) return

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
              setTimeout(onComplete, 450)
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
            }
          }
        }

        animationId = requestAnimationFrame(animate)
      }

      animationId = requestAnimationFrame(animate)
    }

    // Add a 0.3s delay before starting the animation
    const delayTimeout = setTimeout(startAnimation, 300)

    // Auto-complete loading after some time if it's too long
    const timeout = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 500)
    }, 5000)

    return () => {
      cancelAnimationFrame(animationId)
      clearTimeout(delayTimeout)
      clearTimeout(timeout)
    }
  }, [isPreloaded, onComplete])

  return (
    <div className={`loading-overlay ${!isVisible ? 'is-hidden' : ''}`}>
      <div className="loading-content">
        <span className="loading-badge">Booting release dashboard</span>
        <canvas 
          ref={canvasRef}
          className="loading-canvas"
        />
        <div className="loading-copy">
          <strong>Project Aerodactyl</strong>
          <span>Preparing the release hub</span>
        </div>
      </div>
    </div>
  )
}
