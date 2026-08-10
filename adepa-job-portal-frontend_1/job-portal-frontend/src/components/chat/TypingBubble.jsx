import React from 'react'

// The three-dot bubble. Always on the incoming side — you never need telling
// that you are typing.
//
// aria-live="polite" with a text label, because three animated dots convey
// nothing to a screen reader.
export default function TypingBubble({ label = 'Typing' }) {
  return (
    <div className="chat-row is-in">
      <div className="chat-bubble is-in has-tail chat-typing" aria-live="polite" aria-label={`${label}…`}>
        <span className="chat-typing__dot" />
        <span className="chat-typing__dot" />
        <span className="chat-typing__dot" />
      </div>
    </div>
  )
}
