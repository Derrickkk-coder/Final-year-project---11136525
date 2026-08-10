import React from 'react'

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

// `side` is 'out' for the viewer's own messages (right, filled) and 'in' for the
// other party's (left, grey) — the iMessage convention. Which *role* is which
// depends on who's looking, so the caller decides rather than this component.
export default function ChatBubble({ side = 'in', body, at, author, showTail = true, system }) {
  if (system) {
    return <div className="chat-system">{body}</div>
  }

  return (
    <div className={`chat-row is-${side}`}>
      <div className={`chat-bubble is-${side} ${showTail ? 'has-tail' : ''}`}>
        {author && <span className="chat-bubble__author">{author}</span>}
        {/* pre-line so the bot's paragraph breaks and bullet lists survive */}
        <span className="chat-bubble__body">{body}</span>
        {at && <time className="chat-bubble__time">{formatTime(at)}</time>}
      </div>
    </div>
  )
}
