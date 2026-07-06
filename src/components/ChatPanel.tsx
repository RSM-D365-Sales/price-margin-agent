import { useEffect, useRef, useState } from 'react'
import { askAgent, SUGGESTED_PROMPTS } from '../lib/agent'

interface Msg {
  role: 'user' | 'agent'
  text: string
}

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'agent',
      text:
        'I\u2019m the Sales Margin assistant. Ask me about price overrides, margin threshold tests, price history, or the open pricing recommendations.',
    },
  ])
  const [input, setInput] = useState('')
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function send(text: string) {
    const t = text.trim()
    if (!t) return
    const reply = askAgent(t)
    setMessages((m) => [...m, { role: 'user', text: t }, { role: 'agent', text: reply.text }])
    setInput('')
  }

  return (
    <aside className="chat-panel">
      <div className="chat-head">
        <div>
          <div className="eyebrow">Vince · Sales Margin Agent</div>
          <div className="title">Ask the Agent</div>
        </div>
        <button className="close" onClick={onClose} aria-label="Close assistant">
          ✕
        </button>
      </div>
      <div className="chat-body" ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            {m.text}
          </div>
        ))}
        {messages.length <= 1 && (
          <div className="chat-suggest">
            {SUGGESTED_PROMPTS.map((p) => (
              <button key={p} onClick={() => send(p)}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="chat-input-row">
        <input
          className="input"
          placeholder="Ask about margins, overrides, pricing…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
        />
        <button className="btn small" onClick={() => send(input)}>
          Send
        </button>
      </div>
    </aside>
  )
}
