import React from 'react'
import useReveal from '../hooks/useReveal.js'

// Fades + lifts its children into place the first time they scroll into view.
// `delay` (ms) is how you stagger siblings: delay={i * 90} across a mapped list.
//
// Renders a plain <div> by default; pass `as` to keep semantics intact
// (e.g. as="section"). Styling comes from .reveal / .is-visible in animations.css.
export default function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className = '',
  style,
  ...rest
}) {
  const [ref, visible] = useReveal()

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
