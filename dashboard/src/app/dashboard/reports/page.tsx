'use client'
import { useEffect, useState } from 'react'
import { getWeeklyReport, getCommandHistory } from '@/lib/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Legend
} from 'recharts'

export default function ReportsPage() {
  const [weekly, setWeekly] = useState<any>(null)
  const [commands, setCommands] = useState<any[]>([])

  useEffect(() => {
    getWeeklyReport().then(setWeekly).catch(() => {})
    getCommandHistory().then(setCommands).catch(() => {})
  }, [])

  const demo = {
    focus_hours: 18.5,
    routine_hours: 8.2,
    efficiency: 69,
    total_sessions: 12,
    email_count: 47,
    daily_focus: [
      { day: 'Mon', focus_hours: 2.5 },
      { day: 'Tue', focus_hours: 3.2 },
      { day: 'Wed', focus_hours: 1.8 },
      { day: 'Thu', focus_hours: 4.0 },
      { day: 'Fri', focus_hours: 3.5 },
      { day: 'Sat', focus_hours: 2.0 },
      { day: 'Sun', focus_hours: 1.5 },
    ],
  }
  const data = weekly || demo
  const isDemo = !weekly

  const radialData = [
    { name: 'Efficiency', value: data.efficiency, fill: '#6366f1' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Weekly Report 📊</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          {isDemo ? '⚠️ Demo data — connect backend for real stats' : 'Your productivity summary for this week'}
        </p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {[
          { label: 'Focus Time',    value: `${data.focus_hours}h`,    color: '#6366f1', icon: '🎯' },
          { label: 'Routine Time',  value: `${data.routine_hours}h`,  color: '#22d3ee', icon: '🔄' },
          { label: 'Efficiency',    value: `${data.efficiency}%`,     color: '#4ade80', icon: '⚡' },
          { label: 'Sessions',      value: data.total_sessions,       color: '#fbbf24', icon: '📌' },
          { label: 'Emails Logged', value: data.email_count ?? 0,     color: '#f472b6', icon: '📧' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '14px',
          }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 12 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 16px 8px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Daily Focus Hours
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.daily_focus}>
              <XAxis dataKey="day" tick={{ fill: '#4a5568', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4a5568', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="focus_hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '16px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Efficiency Score
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width={160} height={160}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" data={radialData} startAngle={90} endAngle={90 - 360 * (data.efficiency / 100)}>
                <RadialBar dataKey="value" fill="#6366f1" cornerRadius={6} background={{ fill: 'var(--bg-elevated)' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{
              position: 'absolute',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#6366f1' }}>{data.efficiency}%</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>efficiency</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
            {data.efficiency >= 70 ? '🏆 Excellent week!' : data.efficiency >= 50 ? '👍 Good progress' : '💪 Room to grow'}
          </div>
        </div>
      </div>

      {/* AI Command History */}
      {commands.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recent AI Commands
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {commands.map((c: any) => (
              <div key={c.id} style={{
                padding: '10px 12px', background: 'var(--bg-secondary)',
                borderRadius: 8, border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {c.command}
                  </span>
                  <span style={{
                    fontSize: 10, background: 'var(--accent-glow)', border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: 4, padding: '2px 6px', color: 'var(--accent)', flexShrink: 0
                  }}>
                    {c.intent}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {c.result}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
