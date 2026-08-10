import { useEffect } from 'react'

// Stops the page behind an open overlay from scrolling, and puts the reader back
// where they were when it closes.
//
// `overflow: hidden` on the body is the obvious answer and it does not work on
// iOS Safari, which ignores it for touch scrolling — so a drag anywhere over the
// overlay scrolls the page underneath instead. What does work is taking the body
// out of flow with `position: fixed` and holding it at its current offset.
//
// The catch is the way back. A fixed body has no scroll offset of its own, so the
// document collapses to 0 while the overlay is open and the offset has to be
// captured on the way in and reapplied on the way out. Two details matter:
//
//   - Capture it before touching anything else. Reading `window.scrollY` after a
//     class or style has already landed on the body means reading it through
//     whatever that change did to the layout.
//   - Reapply it twice. The document only regains its full scroll height once the
//     body is back in flow, and a scroll offset larger than the current height is
//     clamped to fit — which lands you at the top of the page. The synchronous
//     call is what normally works; the animation-frame one covers the case where
//     layout hasn't caught up yet, and is a no-op when it already has.
//
// `options.query` narrows all of this to the viewports where the overlay actually
// covers the page: a drawer or sheet that only exists on small screens shouldn't
// freeze a desktop window where the page is still fully visible beside it.
//
// `options.bodyClass` is toggled alongside the lock. It lives here rather than in
// a separate effect in the caller so the order is guaranteed in both directions —
// the offset is read before the class is added, and the class is removed before
// the body goes back into flow.
export default function useBodyScrollLock(active, options = {}) {
  const { query, bodyClass } = options

  useEffect(() => {
    if (!active) return

    // First, before any class or style can affect what this reads.
    const scrollY = window.scrollY

    if (bodyClass) document.body.classList.add(bodyClass)

    const applies = !query || !!window.matchMedia?.(query)?.matches
    if (!applies) {
      return () => {
        if (bodyClass) document.body.classList.remove(bodyClass)
      }
    }

    const { style } = document.body
    const previous = {
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      width: style.width,
    }

    style.position = 'fixed'
    style.top = `-${scrollY}px`
    style.left = '0'
    style.right = '0'
    style.width = '100%'

    return () => {
      if (bodyClass) document.body.classList.remove(bodyClass)
      Object.assign(style, previous)

      window.scrollTo(0, scrollY)
      requestAnimationFrame(() => window.scrollTo(0, scrollY))
    }
  }, [active, query, bodyClass])
}
