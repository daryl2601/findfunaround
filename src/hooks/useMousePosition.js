import { useEffect, useRef, useState } from 'react'

/**
 * Tracks the pointer (mouse, pen or touch) in viewport coordinates.
 * Updates are batched to one per animation frame.
 * Returns { x, y } — both null until the first movement.
 */
export default function useMousePosition() {
  const [pos, setPos] = useState({ x: null, y: null })
  const frame = useRef(0)
  const latest = useRef(null)

  useEffect(() => {
    const push = (x, y) => {
      latest.current = { x, y }
      if (!frame.current) {
        frame.current = requestAnimationFrame(() => {
          frame.current = 0
          setPos(latest.current)
        })
      }
    }
    const onPointer = (e) => push(e.clientX, e.clientY)
    const onTouch = (e) => {
      const t = e.touches[0]
      if (t) push(t.clientX, t.clientY)
    }

    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('touchstart', onTouch, { passive: true })
    window.addEventListener('touchmove', onTouch, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('touchstart', onTouch)
      window.removeEventListener('touchmove', onTouch)
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [])

  return pos
}
