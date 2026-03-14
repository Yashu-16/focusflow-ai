'use client'

/**
 * SafetyPanel — The "Safety & Monitoring Layer" UI component.
 *
 * Three visible states:
 *   confirming  — modal asking user to approve AI action before it executes
 *   executing   — live progress bar + current step label + Emergency Stop button
 *   stopped     — brief acknowledgement that the task was halted
 */

export type SafetyState = 'idle' | 'confirming' | 'executing' | 'stopped'

export interface TaskPreview {
  task_id: string
  intent: string
  description: string
  steps: number
}

export interface ProgressEvent {
  step?: number
  total?: number
  message?: string
  percent?: number
  result?: string
  cancelled?: boolean
  error?: string
}

interface SafetyPanelProps {
  state: SafetyState
  task: TaskPreview | null
  progress: ProgressEvent | null
  /** User clicked "Confirm" — begin streaming execution */
  onConfirm: () => void
  /** User cancelled before execution started */
  onDismiss: () => void
  /** User hit Emergency Stop during execution */
  onStop: () => void
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div style={{
      width: '100%',
      height: 6,
      background: 'var(--bg-elevated)',
      borderRadius: 99,
      overflow: 'hidden',
      marginTop: 10,
      marginBottom: 6,
    }}>
      <div style={{
        height: '100%',
        width: `${Math.min(100, Math.max(0, percent))}%`,
        background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
        borderRadius: 99,
        transition: 'width 0.4s ease',
      }} />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SafetyPanel({
  state, task, progress, onConfirm, onDismiss, onStop,
}: SafetyPanelProps) {
  if (state === 'idle') return null

  const panelStyle: React.CSSProperties = {
    margin: '0 12px 12px',
    borderRadius: 12,
    padding: '14px 16px',
    border: '1px solid var(--border)',
    flexShrink: 0,
    animation: 'fadeIn 0.2s ease',
  }

  // ── Confirming ─────────────────────────────────────────────────────────────
  if (state === 'confirming' && task) {
    return (
      <div style={{
        ...panelStyle,
        background: 'var(--bg-secondary)',
        borderColor: '#6366f1',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{
            width: 28, height: 28,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, flexShrink: 0,
          }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              AI Action Requested
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              Confirm before execution · {task.steps} steps
            </div>
          </div>
        </div>

        {/* Action description */}
        <div style={{
          background: 'var(--bg-elevated)',
          borderRadius: 8,
          padding: '10px 12px',
          marginBottom: 12,
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          borderLeft: '3px solid #6366f1',
        }}>
          {task.description}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onDismiss}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'none',
              color: 'var(--text-muted)',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'var(--text-muted)' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'var(--border)' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.opacity = '0.9' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.opacity = '1' }}
          >
            ✓ Confirm
          </button>
        </div>
      </div>
    )
  }

  // ── Executing ──────────────────────────────────────────────────────────────
  if (state === 'executing') {
    const percent = progress?.percent ?? 0
    const message = progress?.message ?? 'Initializing...'
    const step = progress?.step
    const total = progress?.total

    return (
      <div style={{
        ...panelStyle,
        background: 'var(--bg-secondary)',
        borderColor: '#6366f1',
      }}>
        {/* Header with pulsing indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Animated "live" dot */}
            <div style={{
              width: 8, height: 8,
              background: '#6366f1',
              borderRadius: '50%',
              animation: 'pulse-glow 1s ease infinite',
              flexShrink: 0,
            }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI Running
              </div>
              {step != null && total != null && (
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  Step {step}/{total}
                </div>
              )}
            </div>
          </div>

          {/* Emergency Stop — always visible during execution */}
          <button
            onClick={onStop}
            style={{
              padding: '5px 12px',
              borderRadius: 8,
              border: '1px solid #ef4444',
              background: 'rgba(239,68,68,0.08)',
              color: '#ef4444',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.15s',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={e => {
              const el = e.target as HTMLElement
              el.style.background = 'rgba(239,68,68,0.18)'
            }}
            onMouseLeave={e => {
              const el = e.target as HTMLElement
              el.style.background = 'rgba(239,68,68,0.08)'
            }}
            title="Immediately stop the current AI task"
          >
            ■ Emergency Stop
          </button>
        </div>

        {/* Progress bar */}
        <ProgressBar percent={percent} />

        {/* Step label */}
        <div style={{
          fontSize: 11,
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>{message}</span>
          <span style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
            {percent}%
          </span>
        </div>
      </div>
    )
  }

  // ── Stopped ────────────────────────────────────────────────────────────────
  if (state === 'stopped') {
    return (
      <div style={{
        ...panelStyle,
        background: 'rgba(239,68,68,0.06)',
        borderColor: 'rgba(239,68,68,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 28, height: 28,
          background: 'rgba(239,68,68,0.15)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, flexShrink: 0,
        }}>
          ■
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#ef4444' }}>
            Task stopped
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
            The AI task was halted before completion.
          </div>
        </div>
      </div>
    )
  }

  return null
}
