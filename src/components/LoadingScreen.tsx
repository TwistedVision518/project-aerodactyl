import { useEffect, useState, useRef } from 'react'

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [isPreloaded, setIsPreloaded] = useState(false)
  
  const frameRef = useRef(0)
  const partRef = useRef(0)
  const imagesRef = useRef<HTMLImageElement[][]>([[], [], []])
  const lastTimeRef = useRef(0)
  
  const fps = 60
  const interval = 1000 / fps

  const parts = [
    { name: 'part0', frames: 98, startNum: 1001 },
    { name: 'part1', frames: 39, startNum: 2001 },
    { name: 'part2', frames: 80, startNum: 3001, loop: true },
  ]

  useEffect(() => {
    // 1. Preload all images
    let loadedCount = 0
    const totalFrames = parts.reduce((acc, p) => acc + p.frames, 0)

    parts.forEach((p, pIdx) => {
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
      if (!isPreloaded) {
        setIsPreloaded(true)
      }
    }, 3000)

    return () => clearTimeout(preloadTimeout)
  }, [])

  useEffect(() => {
    if (!isPreloaded) return

    let animationId: number
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')

    const animate = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time
      }

      const delta = time - lastTimeRef.current

      if (delta > interval) {
        lastTimeRef.current = time - (delta % interval)
        
        let nextFrame = frameRef.current + 1
        let nextPart = partRef.current

        if (nextFrame > parts[nextPart].frames) {
          if (nextPart < parts.length - 1) {
            nextPart += 1
            nextFrame = 1
            partRef.current = nextPart
          } else if (parts[nextPart].loop) {
            nextFrame = 1
          } else {
            // End of animation
            setIsVisible(false)
            setTimeout(onComplete, 300)
            return
          }
        }

        frameRef.current = nextFrame
        
        // Draw the frame to canvas
        if (ctx && canvas) {
          const img = imagesRef.current[nextPart][nextFrame - 1]
          if (img) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          }
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    // Auto-complete loading after some time if it's too long
    const timeout = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 500)
    }, 8000)

    return () => {
      cancelAnimationFrame(animationId)
      clearTimeout(timeout)
    }
  }, [isPreloaded, onComplete])

  return (
    <div className={`loading-overlay ${!isVisible ? 'is-hidden' : ''}`}>
      <div className="loading-content">
        <canvas 
          ref={canvasRef}
          width={1080} 
          height={2400} 
          className="loading-canvas"
          style={{ width: '240px', height: 'auto' }}
        />
      </div>
    </div>
  )
}
