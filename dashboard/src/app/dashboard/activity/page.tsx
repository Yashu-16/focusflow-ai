'use client'
import { useEffect, useState } from 'react'
import { getActivity } from '@/lib/api'

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  reading_email:  { label: 'Reading Email',  icon: '📧', color: '#6366f1' },
  reading_news:   { label: 'Reading News',   icon: '📰', color: '#22d3ee' },
  tab_switch:     { label: 'Tab Switch',     icon: '🔀', color: '#fbbf24' },
  focus_session:  { label: 'Focus Session',  icon: '🎯', color: '#4ade80' },
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => {
    getActivity().then(setActivities).catch(() => {})
  }, [])

  const demoActivities = [
    { id: 1, activity_type: 'reading_email', url: 'https://mail.google.com', timestamp: new Date(Date.now() - 600000) },
    { id: 2, activity_type: 'tab_switch', url: 'https://github.com', timestamp: new Date(Date.now() - 1200000) },
    { id: 3, activity_type: 'reading_news', url: 'https://techcrunch.com', timestamp: new Date(Date.now() - 1800000) },
    { id: 4, activity_type: 'reading_email', url: 'https://mail.google.com', timestamp: new Date(Date.now() - 3600000) },
    { id: 5, activity_type: 'tab_switch', url: 'https://stackoverflow.com', timestamp: new Date(Date.now() - 4200000) },
  ]
  const display = activities.length > 0 ? activities : demoActivities

  // Aggregate counts
  const counts: Record<string, number> = {}
  display.forEach(a => { counts[a.activity_type] = (counts[a.activity_type] || 0) + 1 })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Activity Log 📋</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Your browser activity tracked by the extension</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {Object.entries(counts).map(([type, count]) => {
          const meta = TYPE_LABELS[type] || { label: type, icon: '⚪', color: '#94a3b8' }
          return (
            <div key={type} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '14px',
            }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{meta.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: meta.color }}>{count}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{meta.label}</div>
            </div>
          )
        })}
      </div>

      {/* Activity list */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Recent Activity ({display.length} events)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {display.map((a: any) => {
            const meta = TYPE_LABELS[a.activity_type] || { label: a.activity_type, icon: '⚪', color: '#94a3b8' }
            return (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 12px',
                background: 'var(--bg-secondary)',
                borderRadius: 8, border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 16, flexShrink: 0 }}>{meta.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: meta.color }}>{meta.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.url || '—'}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {a.timestamp ? new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
