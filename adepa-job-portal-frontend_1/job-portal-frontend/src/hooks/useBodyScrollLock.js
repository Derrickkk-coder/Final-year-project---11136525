import { useEffect } from 'react'

// Stops the page behind an open overlay from scrolling.
//
// `overflow: hidden` on the body is the obvious answer and it does not work on
// iOS Safari, which ignores it for touch scrolling — so a drag anywhere over the
// overlay scrolls the page underneath instead. What does work is taking the body
// out of flow with `position: fixed` and holding it at its current offset, then
// putting the scroll position back on release, since a fixed body forgets it.
//
// `query` narrows the lock to the viewports where the overlay actually covers the
// page. A drawer or sheet that only exists on small screens shouldn't freeze a
// desktop window where the page is still fully visible beside it.
export default function useBodyScrollLock(active, query) {
  useEffect(() => {
    if (!active) return
    if (query && !window.matchMedia?.(query)?.matches) return

    const scrollY = window.scrollY
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
      Object.assign(style, previous)
      window.scrollTo(0, scrollY)
    }
  }, [active, query])
}
