'use client'
import { useEffect, useState } from 'react'
import { getFocusHistory, getDailyReport } from '@/lib/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function formatDuration(seconds: number) {
  if (!seconds) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function FocusPage() {
  const [history, setHistory] = useState<any[]>([])
  const [daily, setDaily] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getFocusHistory(), getDailyReport()])
      .then(([h, d]) => { setHistory(h); setDaily(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const demoHistory = [
    { id: 1, task_name: 'Writing Report', duration_seconds: 5400, start_time: new Date(Date.now() - 3600000) },
    { id: 2, task_name: 'Code Review', duration_seconds: 3600, start_time: new Date(Date.now() - 7200000) },
    { id: 3, task_name: 'Research', duration_seconds: 2700, start_time: new Date(Date.now() - 86400000) },
    { id: 4, task_name: 'Planning', duration_seconds: 1800, start_time: new Date(Date.now() - 172800000) },
  ]
  const displayHistory = history.length > 0 ? history : demoHistory

  const chartData = displayHistory.slice(0, 7).map(s => ({
    name: s.task_name.slice(0, 12),
    minutes: Math.round((s.duration_seconds || 0) / 60)
  })).reverse()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Focus Sessions 🎯</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Track and review your deep work sessions</p>
      </div>

      {/* Today stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Today Focus', value: daily ? `${daily.focus_hours}h` : '—', icon: '⏱️', color: '#6366f1' },
          { label: 'Sessions Today', value: daily?.sessions_today ?? '—', icon: '📌', color: '#22d3ee' },
          { label: 'All Time Sessions', value: displayHistory.length, icon: '🏆', color: '#4ade80' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '16px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 20, marginTop: 4 }}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 16px 8px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recent Sessions (minutes)
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: '#4a5568', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4a5568', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Session history */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Session History
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayHistory.map((s: any) => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px',
              background: 'var(--bg-secondary)',
              borderRadius: 8, border: '1px solid var(--border)',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{s.task_name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {s.start_time ? new Date(s.start_time).toLocaleString() : ''}
                </div>
              </div>
              <div style={{
                background: 'var(--accent-glow)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 6, padding: '4px 10px',
                fontSize: 12, fontWeight: 600, color: 'var(--accent)',
              }}>
                {formatDuration(s.duration_seconds)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
