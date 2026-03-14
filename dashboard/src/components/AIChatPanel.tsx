'use client'
import { useState, useRef, useEffect } from 'react'
import { sendCommand, getUserId } from '@/lib/api'

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: Date
}

const QUICK_PROMPTS = [
  { label: '📧 Email Summary', cmd: 'Summarize my unread emails' },
  { label: '📰 News Digest', cmd: 'Give me today\'s top news summary' },
  { label: '📊 Weekly Report', cmd: 'What is my productivity score this week?' },
  { label: '💡 Focus Tips', cmd: 'Suggest 5 ways to improve my focus today' },
  { label: '✍️ Draft Reply', cmd: 'Help me draft a professional email reply' },
  { label: '🎯 Daily Plan', cmd: 'Help me plan my tasks for today' },
]

export default function AIChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'ai',
      content: `👋 Hello! I'm your AI productivity assistant.\n\nI can help you:\n• Summarize your emails\n• Get today's news digest\n• Analyze your productivity\n• Generate email replies\n• Plan your day\n• Answer any question\n\nTry a quick command below or type anything!`,
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const data = await sendCommand(text)
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.result || 'No response received.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (e: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: '⚠️ Could not connect to backend. Make sure the backend server is running on port 8000.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  const clearChat = () => {
    setMessages([{
      id: '0',
      role: 'ai',
      content: `Chat cleared. How can I help you?`,
      timestamp: new Date(),
    }])
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-card)',
      borderLeft: '1px solid var(--border)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 16px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>⚡</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>AI Assistant</div>
            <div style={{ fontSize: 10, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, background: 'var(--green)', borderRadius: '50%', display: 'inline-block' }} />
              Online
            </div>
          </div>
        </div>
        <button
          onClick={clearChat}
          style={{
            background: 'none', border: '1px solid var(--border)',
            color: 'var(--text-muted)', borderRadius: 6,
            padding: '4px 8px', fontSize: 11, cursor: 'pointer',
          }}
          title="Clear chat"
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            animation: 'fadeIn 0.2s ease',
          }}>
            {msg.role === 'ai' && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, paddingLeft: 4 }}>
                AI Assistant · {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            <div className={msg.role === 'user' ? 'chat-message-user' : 'chat-message-ai'}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, paddingRight: 4 }}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', paddingLeft: 4 }}>AI Assistant is thinking...</div>
            <div className="chat-message-ai" style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '12px 16px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8,
                  background: 'var(--accent)',
                  borderRadius: '50%',
                  animation: `pulse-glow 1s ease ${i * 0.2}s infinite`,
                  opacity: 0.7,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        {QUICK_PROMPTS.map(p => (
          <button
            key={p.label}
            onClick={() => send(p.cmd)}
            disabled={loading}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              color: 'var(--text-secondary)',
              padding: '4px 10px',
              fontSize: 11,
              cursor: loading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={e => {
              if (!loading) {
                (e.target as HTMLElement).style.borderColor = 'var(--accent)'
                ;(e.target as HTMLElement).style.color = 'var(--text-primary)'
              }
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.borderColor = 'var(--border)'
              ;(e.target as HTMLElement).style.color = 'var(--text-secondary)'
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px 14px',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          gap: 8,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '6px 6px 6px 12px',
          alignItems: 'center',
        }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything..."
            disabled={loading}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 32, height: 32,
              background: input.trim() && !loading ? 'var(--accent)' : 'var(--bg-elevated)',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            {loading ? (
              <div style={{
                width: 14, height: 14,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            ) : '↑'}
          </button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
          Press Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  )
}
