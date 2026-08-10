import React, { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import ChatBubble from './chat/ChatBubble.jsx'
import TypingBubble from './chat/TypingBubble.jsx'
import { BOT_NODES, BOT_START, botThinkingMs } from '../utils/supportBot.js'
import { withTimeSeparators, formatSeparator } from '../utils/chatGrouping.js'
import {
  startSupportConversation,
  fetchMyConversation,
  fetchMessages,
  sendSupportMessage,
  pingTyping,
} from '../api/support.js'
import useBodyScrollLock from '../hooks/useBodyScrollLock.js'
import { useSidebar } from '../context/SidebarContext.jsx'

// Mirrors the 560px breakpoint in global.css at which .chat-panel becomes a
// full-height sheet. Needed in JS because the iOS scroll lock can't be expressed
// in CSS alone — change both together.
const MOBILE_SHEET_QUERY = '(max-width: 560px)'

// While the panel is open, how often to check for the other side's messages and
// typing state. Fast enough that a reply and a typing bubble feel live; slow
// enough to be reasonable on a free-tier host.
const POLL_MS = 2000
// Don't send a keystroke heartbeat more than this often
const TYPING_PING_MS = 2000

export default function SupportWidget() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const [open, setOpen] = useState(false)
  // 'bot' until someone asks for a person, then 'live'
  const [mode, setMode] = useState('bot')

  // ---- Bot stage (all local) ----
  const [thread, setThread] = useState([])
  const [nodeKey, setNodeKey] = useState(BOT_START)
  const [botTyping, setBotTyping] = useState(false)

  // ---- Live stage ----
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const scrollRef = useRef(null)
  const lastTypingPing = useRef(0)
  const node = BOT_NODES[nodeKey]

  // The dashboard drawer opens over the bottom-left corner this button lives in,
  // and at z-index 250 the button wins — it was sitting on top of the drawer's
  // Log out. A floating action button over an open drawer is wrong anyway: the
  // drawer is the thing being interacted with.
  const { open: drawerOpen } = useSidebar()

  // A notification links here with ?support=open so a reply is one click away
  useEffect(() => {
    if (searchParams.get('support') === 'open') setOpen(true)
  }, [searchParams])

  // Pick up an existing live thread on mount, so closing the tab mid-conversation
  // and coming back later resumes rather than restarting at the bot.
  useEffect(() => {
    if (!user) return
    fetchMyConversation()
      .then((data) => {
        if (data.conversation) {
          setConversation(data.conversation)
          setMode('live')
        }
      })
      .catch(() => {})
  }, [user?._id])

  // Bot opens by greeting, once
  useEffect(() => {
    if (!open || mode !== 'bot' || thread.length > 0) return
    sayBot(BOT_NODES[BOT_START].body)
  }, [open, mode])

  // .chat-open handles the desktop case, where the body only needs overflow
  // hidden. It is not enough on a phone — see the hook below.
  useEffect(() => {
    if (!open) return
    document.body.classList.add('chat-open')
    return () => document.body.classList.remove('chat-open')
  }, [open])

  // Mobile only, because on desktop the panel is a small floating card and
  // someone may legitimately want to scroll the page while reading it. The lock
  // itself used to be inlined here; it's now shared with the dashboard's mobile
  // drawer, which hits the same iOS quirk.
  useBodyScrollLock(open, MOBILE_SHEET_QUERY)

  // Keep the newest message in view. Depends on the typing flags too, since a
  // bubble appearing changes the height.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [thread, messages, botTyping, conversation?.peerTyping, open])

  // ---- Polling, only while the panel is open on a live thread ----
  useEffect(() => {
    if (!open || mode !== 'live' || !conversation?._id) return

    let cancelled = false

    const tick = async () => {
      try {
        const newest = messages[messages.length - 1]?.createdAt
        const data = await fetchMessages(conversation._id, newest)
        if (cancelled) return

        if (data.messages.length > 0) {
          setMessages((prev) => [...prev, ...data.messages])
        }
        // Always refresh the conversation: peerTyping changes with no new messages
        setConversation(data.conversation)
      } catch {
        // A failed poll is not worth surfacing — the next one will likely work
      }
    }

    tick()
    const interval = setInterval(tick, POLL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [open, mode, conversation?._id, messages.length])

  // ---- Bot helpers ----
  function sayBot(body) {
    setBotTyping(true)
    // The delay is the point: the bubbles are what make it feel like a reply
    // rather than a page render.
    setTimeout(() => {
      setBotTyping(false)
      setThread((prev) => [...prev, { from: 'bot', body, at: new Date().toISOString() }])
    }, botThinkingMs(body))
  }

  function chooseOption(option) {
    setThread((prev) => [...prev, { from: 'user', body: option.label, at: new Date().toISOString() }])

    if (option.escalate) {
      escalate()
      return
    }

    setNodeKey(option.next)
    sayBot(BOT_NODES[option.next].body)
  }

  async function escalate() {
    if (!user) {
      // Nothing to reply to without an account, so say so rather than failing
      sayBot(
        "To put you through to a person I need an account to send the reply to — otherwise there's nowhere for support to answer.\n\nLog in or register, then open this window again and I'll connect you."
      )
      return
    }

    setBotTyping(true)
    try {
      const data = await startSupportConversation({
        botTranscript: thread.map((m) => ({ from: m.from, body: m.body })),
        subject: `Help: ${node?.body?.slice(0, 40) || 'support request'}`,
      })
      setConversation(data.conversation)
      setMode('live')
      setMessages([])
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reach support right now. Please try again.')
    } finally {
      setBotTyping(false)
    }
  }

  // ---- Live helpers ----
  function handleDraft(e) {
    setDraft(e.target.value)

    // Throttled heartbeat — the server expires the flag on its own, so there's
    // nothing to clear when they stop
    const now = Date.now()
    if (conversation?._id && now - lastTypingPing.current > TYPING_PING_MS) {
      lastTypingPing.current = now
      pingTyping(conversation._id)
    }
  }

  async function handleSend(e) {
    e.preventDefault()
    const body = draft.trim()
    if (!body || !conversation?._id) return

    setDraft('')
    setSending(true)
    setError('')
    try {
      const data = await sendSupportMessage(conversation._id, body)
      setMessages((prev) => [...prev, data.message])
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send that message.')
      setDraft(body) // hand the text back rather than losing it
    } finally {
      setSending(false)
    }
  }

  const waiting = conversation?.status === 'waiting'
  const unread = conversation?.unread || 0

  // Admins are the other end of this conversation — they answer from the Support
  // tab on their dashboard, and a help button that opened a thread with
  // themselves would be nonsense.
  if (user?.role === 'admin') return null

  return (
    <>
      <button
        type="button"
        className={`help-fab ${open ? 'is-open' : ''} ${drawerOpen ? 'is-stowed' : ''}`}
        // Out of the tab order too, not just out of sight
        tabIndex={drawerOpen ? -1 : 0}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close help' : 'Need help?'}
      >
        {open ? (
          <span aria-hidden="true">✕</span>
        ) : (
          <>
            <span className="help-fab__icon" aria-hidden="true">💬</span>
            <span className="help-fab__label">Need help?</span>
            {unread > 0 && <span className="help-fab__badge">{unread}</span>}
          </>
        )}
      </button>

      {open && (
        <div className="chat-panel" role="dialog" aria-label="Support chat">
          {/* Centred identity above a service label, with the dismiss control on
              the left — the iMessage thread header. */}
          <header className="chat-panel__head">
            <button
              type="button"
              className="chat-panel__back"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ‹
            </button>

            <div className="chat-panel__ident">
              <img src="/images/logo-mark.png" alt="" className="chat-panel__avatar" />
              <strong className="chat-panel__name">
                {mode === 'bot' ? 'NextLeap Assistant' : 'NextLeap Support'}
                <span className="chat-panel__chevron" aria-hidden="true">›</span>
              </strong>
              <span className="chat-panel__service">
                {mode === 'bot'
                  ? 'Automated replies'
                  : waiting
                    ? 'Waiting for a team member…'
                    : conversation?.peerTyping
                      ? 'Typing…'
                      : 'Support team'}
              </span>
            </div>

            {/* Balances the back button so the identity stays optically centred */}
            <span className="chat-panel__spacer" aria-hidden="true" />
          </header>

          <div className="chat-scroll" ref={scrollRef}>
            {mode === 'bot' ? (
              <>
                {withTimeSeparators(thread).map((m, i) =>
                  m.separator ? (
                    <div className="chat-daymark" key={m.key}>{formatSeparator(m.at)}</div>
                  ) : (
                    <ChatBubble
                      key={i}
                      side={m.from === 'user' ? 'out' : 'in'}
                      body={m.body}
                    />
                  )
                )}
                {botTyping && <TypingBubble label="Assistant is typing" />}

                {/* Quick replies only once the bot has finished speaking */}
                {!botTyping && node?.options && (
                  <div className="chat-options">
                    {node.options.map((option) => (
                      <button
                        type="button"
                        key={option.label}
                        className={`chat-option ${option.escalate ? 'is-escalate' : ''}`}
                        onClick={() => chooseOption(option)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}

                {!user && (
                  <p className="chat-note">
                    <Link to="/login">Log in</Link> or <Link to="/register">register</Link> if you need
                    to speak to a person.
                  </p>
                )}
              </>
            ) : (
              <>
                {conversation?.botTranscript?.length > 0 && (
                  <div className="chat-system">
                    Your chat with the assistant has been shared with support for context.
                  </div>
                )}

                {withTimeSeparators(messages).map((m, i, all) => {
                  if (m.separator) {
                    return <div className="chat-daymark" key={m.key}>{formatSeparator(m.at)}</div>
                  }

                  const previous = all[i - 1]
                  const next = all[i + 1]
                  return (
                    <ChatBubble
                      key={m._id || i}
                      system={m.from === 'system'}
                      side={m.from === 'user' ? 'out' : 'in'}
                      body={m.body}
                      // Name the admin only on the first of a run, as iMessage does
                      author={
                        m.from === 'admin' && previous?.from !== 'admin'
                          ? m.sender?.name || 'Support'
                          : null
                      }
                      // The tail belongs to the last bubble of a run
                      showTail={!next || next.separator || next.from !== m.from}
                    />
                  )
                })}

                {/* Receipt under the newest message, and only when it's ours —
                    there's nothing to report about a message we received. */}
                {messages.length > 0 &&
                  messages[messages.length - 1].from === 'user' &&
                  !conversation?.peerTyping && <div className="chat-receipt">Delivered</div>}

                {conversation?.peerTyping && <TypingBubble label="Support is typing" />}
              </>
            )}
          </div>

          {error && <p className="chat-error">{error}</p>}

          {mode === 'live' && conversation?.status !== 'closed' && (
            <form className="chat-compose" onSubmit={handleSend}>
              <input
                value={draft}
                onChange={handleDraft}
                placeholder="Type a message…"
                aria-label="Message"
                maxLength={2000}
              />
              <button type="submit" className="chat-send" disabled={!draft.trim() || sending} aria-label="Send">
                ↑
              </button>
            </form>
          )}

          {mode === 'live' && conversation?.status === 'closed' && (
            <p className="chat-note">This conversation is closed. Reopen the assistant to start a new one.</p>
          )}
        </div>
      )}
    </>
  )
}
