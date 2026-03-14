'use client'
import { useState, useRef, useEffect } from 'react'
import { previewCommand, cancelTask, openTaskStream } from '@/lib/api'
import SafetyPanel, { SafetyState, TaskPreview, ProgressEvent } from './SafetyPanel'

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

  // ── Safety layer state ────────────────────────────────────────────────────
  const [safetyState, setSafetyState] = useState<SafetyState>('idle')
  const [pendingTask, setPendingTask] = useState<TaskPreview | null>(null)
  const [progress, setProgress] = useState<ProgressEvent | null>(null)
  const activeStreamRef = useRef<EventSource | null>(null)
  const activeTaskIdRef = useRef<string | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => { activeStreamRef.current?.close() }
  }, [])

  // ── Step 1: classify command → show confirmation modal ───────────────────
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
      const preview = await previewCommand(text)
      setPendingTask(preview)
      setSafetyState('confirming')
    } catch {
      addAiMessage('⚠️ Could not connect to backend. Make sure the backend server is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: user confirmed → open SSE stream ─────────────────────────────
  const handleConfirm = () => {
    if (!pendingTask) return
    setSafetyState('executing')
    setProgress({ percent: 0, message: 'Starting...' })

    const taskId = pendingTask.task_id
    activeTaskIdRef.current = taskId
    const stream = openTaskStream(taskId)
    activeStreamRef.current = stream

    stream.onmessage = (e) => {
      const event: ProgressEvent = JSON.parse(e.data)

      if (event.cancelled) {
        stream.close()
        activeStreamRef.current = null
        setSafetyState('stopped')
        setTimeout(() => setSafetyState('idle'), 2500)
        return
      }

      if (event.error) {
        stream.close()
        activeStreamRef.current = null
        setSafetyState('idle')
        addAiMessage(`⚠️ Task error: ${event.error}`)
        return
      }

      // Progress update
      setProgress(event)

      // Final event: result is included
      if (event.result) {
        stream.close()
        activeStreamRef.current = null
        setSafetyState('idle')
        setPendingTask(null)
        setProgress(null)
        addAiMessage(event.result)
      }
    }

    stream.onerror = () => {
      stream.close()
      activeStreamRef.current = null
      setSafetyState('idle')
      addAiMessage('⚠️ Lost connection to backend during task execution.')
    }
  }

  // ── Step 3a: user cancelled before confirming ────────────────────────────
  const handleDismiss = () => {
    if (pendingTask) {
      // Discard the pending task server-side too
      cancelTask(pendingTask.task_id).catch(() => {})
    }
    setSafetyState('idle')
    setPendingTask(null)
    setProgress(null)
    addAiMessage('ℹ️ Task cancelled before execution.')
  }

  // ── Step 3b: emergency stop during execution ──────────────────────────────
  const handleStop = () => {
    const taskId = activeTaskIdRef.current
    if (taskId) {
      cancelTask(taskId).catch(() => {})
      activeTaskIdRef.current = null
    }
    activeStreamRef.current?.close()
    activeStreamRef.current = null
    setSafetyState('stopped')
    setTimeout(() => {
      setSafetyState('idle')
      setPendingTask(null)
      setProgress(null)
    }, 2500)
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const addAiMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'ai',
      content,
      timestamp: new Date(),
    }])
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
      content: 'Chat cleared. How can I help you?',
      timestamp: new Date(),
    }])
  }

  const isBlocked = loading || safetyState !== 'idle'

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
            <div style={{ fontSize: 10, color: 'var(--text-muted)', paddingLeft: 4 }}>Analyzing request...</div>
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

      {/* ── Safety Panel (sits above the quick prompts) ── */}
      <SafetyPanel
        state={safetyState}
        task={pendingTask}
        progress={progress}
        onConfirm={handleConfirm}
        onDismiss={handleDismiss}
        onStop={handleStop}
      />

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
            disabled={isBlocked}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              color: 'var(--text-secondary)',
              padding: '4px 10px',
              fontSize: 11,
              cursor: isBlocked ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              opacity: isBlocked ? 0.5 : 1,
            }}
            onMouseEnter={e => {
              if (!isBlocked) {
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
            placeholder={isBlocked ? 'Waiting for task to complete...' : 'Ask anything...'}
            disabled={isBlocked}
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
            disabled={!input.trim() || isBlocked}
            style={{
              width: 32, height: 32,
              background: input.trim() && !isBlocked ? 'var(--accent)' : 'var(--bg-elevated)',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              cursor: input.trim() && !isBlocked ? 'pointer' : 'not-allowed',
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
