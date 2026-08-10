import React from 'react'

// `side` is 'out' for the viewer's own messages (right, blue) and 'in' for the
// other party's (left, grey) — the iMessage convention. Which *role* is which
// depends on who's looking, so the caller decides rather than this component.
//
// No timestamp inside the bubble: the time lives in a centred separator above
// each burst instead. See utils/chatGrouping.js.
export default function ChatBubble({ side = 'in', body, author, showTail = true, system }) {
  if (system) {
    return <div className="chat-system">{body}</div>
  }

  return (
    <div className={`chat-row is-${side}`}>
      <div className={`chat-bubble is-${side} ${showTail ? 'has-tail' : ''}`}>
        {author && <span className="chat-bubble__author">{author}</span>}
        {/* pre-line so the bot's paragraph breaks and bullet lists survive */}
        <span className="chat-bubble__body">{body}</span>
      </div>
    </div>
  )
}
