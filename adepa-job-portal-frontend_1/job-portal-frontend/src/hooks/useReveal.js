import { useEffect, useRef, useState } from 'react'

// Reports whether the returned ref's element has scrolled into view, so a
// component can animate itself in exactly once. Used by <Reveal> and <CountUp>.
//
// The `rootMargin` bottom inset means the reveal fires slightly *before* the
// element reaches the viewport edge — by the time the reader's eye arrives, the
// motion has already begun, which reads as responsive rather than laggy.
export default function useReveal({
  threshold = 0.15,
  rootMargin = '0px 0px -60px 0px',
  once = true,
} = {}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current

    // If there's no node yet, or the browser has no IntersectionObserver,
    // show the content immediately. Failing "visible" rather than "hidden"
    // matters — the alternative is text stuck at opacity 0 forever.
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            if (once) observer.unobserve(entry.target)
          } else if (!once) {
            setVisible(false)
          }
        })
      },
      { threshold, rootMargin }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  return [ref, visible]
}
