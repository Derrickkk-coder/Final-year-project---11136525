import React, { useEffect, useRef, useState } from 'react'
import useReveal from '../hooks/useReveal.js'

function prefersReducedMotion() {
  return Boolean(
    typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

// Counts from 0 up to `end` the first time it scrolls into view.
//
// `end` is allowed to change after mount — the hero's "open roles" figure
// starts at 0 and is replaced once the jobs request resolves, which simply
// restarts the count against the real number.
export default function CountUp({ end = 0, duration = 1600, suffix = '' }) {
  const [ref, visible] = useReveal({ threshold: 0.4 })
  const [value, setValue] = useState(0)
  const frame = useRef(0)

  useEffect(() => {
    if (!visible) return

    // Nothing to animate towards, or the visitor asked for less motion:
    // land on the final figure straight away.
    if (end === 0 || prefersReducedMotion()) {
      setValue(end)
      return
    }

    const start = performance.now()

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      // easeOutExpo — quick off the mark, long gentle settle
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setValue(Math.round(end * eased))
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [visible, end, duration])

  return (
    <span ref={ref}>
      {value.toLocaleString('en-GB')}
      {suffix}
    </span>
  )
}
