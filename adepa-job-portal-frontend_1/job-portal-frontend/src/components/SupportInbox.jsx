import React, { useEffect, useRef, useState } from 'react'
import Avatar from './Avatar.jsx'
import ChatBubble from './chat/ChatBubble.jsx'
import TypingBubble from './chat/TypingBubble.jsx'
import EmptyState from './EmptyState.jsx'
import { SkeletonRows } from './Skeleton.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { withTimeSeparators, formatSeparator, mergeMessages } from '../utils/chatGrouping.js'
import {
  fetchSupportConversations,
  fetchMessages,
  sendSupportMessage,
  pingTyping,
  setConversationStatus,
} from '../api/support.js'

// Two polls with different jobs: the open thread needs to feel live, the list
// only needs to notice a new arrival.
const THREAD_POLL_MS = 2000
const LIST_POLL_MS = 8000
const TYPING_PING_MS = 2000

function formatWhen(date) {
  const d = new Date(date)
  const today = new Date().toDateString() === d.toDateString()
  return today
    ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function SupportInbox() {
  const toast = useToast()

  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState(null)
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const scrollRef = useRef(null)
  const lastTypingPing = useRef(0)

  const loadList = async () => {
    try {
      const data = await fetchSupportConversations()
      setConversations(data.conversations)
    } catch {
      // The thread poll will surface a real outage; a failed list refresh is noise
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadList()
    const interval = setInterval(loadList, LIST_POLL_MS)
    return () => clearInterval(interval)
  }, [])

  // Poll the open thread for replies and typing state
  useEffect(() => {
    if (!activeId) return

    let cancelled = false

    const tick = async () => {
      try {
        const newest = messages[messages.length - 1]?.createdAt
        const data = await fetchMessages(activeId, newest)
        if (cancelled) return
        if (data.messages.length > 0) setMessages((prev) => mergeMessages(prev, data.messages))
        setActive(data.conversation)
      } catch {
        /* next tick */
      }
    }

    tick()
    const interval = setInterval(tick, THREAD_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [activeId, messages.length])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, active?.peerTyping])

  const openThread = (conversation) => {
    setActiveId(conversation._id)
    setActive(null)
    setMessages([])
    // Clear the unread dot locally straight away; the server clears it on read
    setConversations((prev) =>
      prev.map((c) => (c._id === conversation._id ? { ...c, unread: 0 } : c))
    )
  }

  const handleDraft = (e) => {
    setDraft(e.target.value)
    const now = Date.now()
    if (activeId && now - lastTypingPing.current > TYPING_PING_MS) {
      lastTypingPing.current = now
      pingTyping(activeId)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    const body = draft.trim()
    if (!body || !activeId) return

    setDraft('')
    setSending(true)
    try {
      const data = await sendSupportMessage(activeId, body)
      setMessages((prev) => mergeMessages(prev, [data.message]))
      loadList()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send that message.')
      setDraft(body)
    } finally {
      setSending(false)
    }
  }

  const handleClose = async () => {
    try {
      await setConversationStatus(activeId, 'closed')
      setActive((a) => (a ? { ...a, status: 'closed' } : a))
      loadList()
      toast.success('Conversation closed.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not close that conversation.')
    }
  }

  const activeConversation = conversations.find((c) => c._id === activeId)

  if (loading) return <SkeletonRows count={4} height={64} />

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon="💬"
        title="No support conversations"
        description="When someone asks the assistant to put them through to a person, their conversation appears here."
      />
    )
  }

  return (
    <div className="inbox">
      <ul className="inbox__list">
        {conversations.map((c) => (
          <li key={c._id}>
            <button
              type="button"
              className={`inbox__item ${c._id === activeId ? 'is-active' : ''} is-${c.status}`}
              onClick={() => openThread(c)}
            >
              <Avatar src={c.user?.profilePictureUrl} name={c.user?.name} size={34} />
              <span className="inbox__item-body">
                <span className="inbox__item-top">
                  <strong>{c.user?.name || 'Unknown user'}</strong>
                  <span className="inbox__item-when">{formatWhen(c.lastMessageAt)}</span>
                </span>
                <span className="inbox__item-meta">
                  {c.status === 'waiting' ? 'Waiting for a reply' : c.status === 'open' ? 'In progress' : 'Closed'}
                  {c.user?.role ? ` · ${c.user.role}` : ''}
                </span>
              </span>
              {c.unread > 0 && <span className="inbox__badge">{c.unread}</span>}
            </button>
          </li>
        ))}
      </ul>

      <div className="inbox__thread">
        {!activeId ? (
          <p className="inbox__placeholder">Pick a conversation to read and reply.</p>
        ) : (
          <>
            <header className="inbox__thread-head">
              <div>
                <strong>{activeConversation?.user?.name || 'Conversation'}</strong>
                <span className="inbox__thread-meta">
                  {activeConversation?.user?.email}
                  {active?.peerTyping ? ' · typing…' : ''}
                </span>
              </div>
              {active?.status !== 'closed' && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={handleClose}>
                  Close
                </button>
              )}
            </header>

            <div className="chat-scroll inbox__scroll" ref={scrollRef}>
              {/* What they told the bot before asking for a person */}
              {active?.botTranscript?.length > 0 && (
                <details className="inbox__transcript">
                  <summary>Chat with the assistant before escalating</summary>
                  {active.botTranscript.map((m, i) => (
                    <p key={i}>
                      <strong>{m.from === 'user' ? 'Them' : 'Assistant'}:</strong> {m.body}
                    </p>
                  ))}
                </details>
              )}

              {withTimeSeparators(messages).map((m, i, all) => {
                if (m.separator) {
                  return <div className="chat-daymark" key={m.key}>{formatSeparator(m.at)}</div>
                }

                const next = all[i + 1]
                return (
                  <ChatBubble
                    key={m._id || i}
                    system={m.from === 'system'}
                    // Reversed from the user's view: here the admin is 'out'
                    side={m.from === 'admin' ? 'out' : 'in'}
                    body={m.body}
                    showTail={!next || next.separator || next.from !== m.from}
                  />
                )
              })}

              {messages.length > 0 &&
                messages[messages.length - 1].from === 'admin' &&
                !active?.peerTyping && <div className="chat-receipt">Delivered</div>}

              {active?.peerTyping && <TypingBubble label="They are typing" />}
            </div>

            {active?.status !== 'closed' ? (
              <form className="chat-compose" onSubmit={handleSend}>
                <input
                  value={draft}
                  onChange={handleDraft}
                  placeholder="Reply to this person…"
                  aria-label="Reply"
                  maxLength={2000}
                />
                <button type="submit" className="chat-send" disabled={!draft.trim() || sending} aria-label="Send">
                  ↑
                </button>
              </form>
            ) : (
              <p className="chat-note">This conversation is closed.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
