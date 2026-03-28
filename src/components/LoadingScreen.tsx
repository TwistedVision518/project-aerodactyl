import { useEffect, useState, useRef } from 'react'

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [frame, setFrame] = useState(0)
  const [part, setPart] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const frameRef = useRef(0)
  const lastTimeRef = useRef(0)
  const fps = 60
  const interval = 1000 / fps

  const parts = [
    { name: 'part0', frames: 98, startNum: 1001 },
    { name: 'part1', frames: 39, startNum: 2001 },
    { name: 'part2', frames: 80, startNum: 3001, loop: true },
  ]

  useEffect(() => {
    let animationId: number

    const animate = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time
      }

      const delta = time - lastTimeRef.current

      if (delta > interval) {
        lastTimeRef.current = time - (delta % interval)
        
        let nextFrame = frameRef.current + 1
        let nextPart = part

        if (nextFrame > parts[nextPart].frames) {
          if (nextPart < parts.length - 1) {
            nextPart += 1
            nextFrame = 1
            setPart(nextPart)
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
        setFrame(nextFrame)
      }

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    // Preload images
    parts.forEach((p) => {
      for (let i = 1; i <= p.frames; i++) {
        const img = new Image()
        const num = (p.startNum + i - 1).toString().padStart(5, '0')
        img.src = `/assets/loading/${p.name}/${num}.png`
      }
    })

    // Auto-complete loading after some time if it's too long
    const timeout = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 500)
    }, 5000)

    return () => {
      cancelAnimationFrame(animationId)
      clearTimeout(timeout)
    }
  }, [onComplete])

  const currentPart = parts[part]
  const currentFrameNum = (currentPart.startNum + frame - 1).toString().padStart(5, '0')
  const imgSrc = `/assets/loading/${currentPart.name}/${currentFrameNum}.png`

  return (
    <div className={`loading-overlay ${!isVisible ? 'is-hidden' : ''}`}>
      <div className="loading-content">
        <img 
          src={imgSrc} 
          alt="Loading..." 
          className="loading-animation"
        />
      </div>
    </div>
  )
}
