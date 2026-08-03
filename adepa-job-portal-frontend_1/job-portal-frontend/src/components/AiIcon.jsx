import React from 'react'

// A small gradient ring icon (blue → purple → pink) used to mark AI-powered
// features, replacing the plain ✨ emoji with something more distinctive.
export default function AiIcon({ size = 14, style = {} }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'conic-gradient(from 180deg, #4F8FFF, #A855F7, #EC4899, #4F8FFF)',
        position: 'relative',
        flexShrink: 0,
        ...style,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '28%',
          left: '28%',
          width: '44%',
          height: '44%',
          borderRadius: '50%',
          background: '#fff',
        }}
      />
    </span>
  )
}