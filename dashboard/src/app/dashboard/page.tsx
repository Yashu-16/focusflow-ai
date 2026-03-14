'use client'
import { useEffect, useState } from 'react'
import { getWeeklyReport, getDailyReport } from '@/lib/api'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

export default function DashboardPage() {
  const [weekly, setWeekly] = useState<any>(null)
  const [daily, setDaily] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getWeeklyReport(), getDailyReport()])
      .then(([w, d]) => { setWeekly(w); setDaily(d) })
      .catch(() => setError('Backend not connected. Start the backend server.'))
      .finally(() => setLoading(false))
  }, [])

  // Demo data for when backend isn't connected yet
  const demoWeekly = {
    focus_hours: 18.5,
    routine_hours: 8.2,
    efficiency: 69,
    total_sessions: 12,
    daily_focus: [
      { day: 'Mon', focus_hours: 2.5 },
      { day: 'Tue', focus_hours: 3.2 },
      { day: 'Wed', focus_hours: 1.8 },
      { day: 'Thu', focus_hours: 4.0 },
      { day: 'Fri', focus_hours: 3.5 },
      { day: 'Sat', focus_hours: 2.0 },
      { day: 'Sun', focus_hours: 1.5 },
    ],
    activity_breakdown: { reading_email: 45, reading_news: 30, tab_switch: 80 }
  }

  const demoCurrent = weekly || demoWeekly
  const isDemo = !weekly

  const pieData = [
    { name: 'Focus', value: demoCurrent.focus_hours, color: '#6366f1' },
    { name: 'Routine', value: demoCurrent.routine_hours, color: '#22d3ee' },
  ]

  const STATS = [
    {
      label: 'Focus Time', value: `${demoCurrent.focus_hours}h`,
      sub: 'This week', icon: '🎯', color: '#6366f1',
    },
    {
      label: 'Routine Time', value: `${demoCurrent.routine_hours}h`,
      sub: 'Emails + News', icon: '🔄', color: '#22d3ee',
    },
    {
      label: 'Efficiency', value: `${demoCurrent.efficiency}%`,
      sub: 'Focus / Total', icon: '⚡', color: '#4ade80',
    },
    {
      label: 'Sessions', value: demoCurrent.total_sessions,
      sub: 'Focus sessions', icon: '📌', color: '#fbbf24',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
            Good {getTimeOfDay()}, Productivity Pro 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            {isDemo ? '⚠️ Demo mode — start the backend for live data' : "Here's your productivity overview"}
          </p>
        </div>
        {daily && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '8px 16px',
            textAlign: 'right',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Today's Focus</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
              {daily.focus_hours}h
            </div>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {STATS.map(stat => (
          <div key={stat.label} className="stat-card" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '16px',
            cursor: 'default',
            transition: 'all 0.2s',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{stat.sub}</div>
              </div>
              <div style={{ fontSize: 24 }}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 12 }}>
        {/* Weekly focus area chart */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '16px 16px 8px',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Weekly Focus Hours
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={demoCurrent.daily_focus}>
              <defs>
                <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: '#4a5568', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4a5568', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-secondary)' }}
                itemStyle={{ color: '#6366f1' }}
              />
              <Area type="monotone" dataKey="focus_hours" stroke="#6366f1" strokeWidth={2} fill="url(#focusGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
            Time Split
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={46} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, background: d.color, borderRadius: '50%', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-muted)', flex: 1 }}>{d.name}</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{d.value}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's sessions */}
      {daily?.sessions && daily.sessions.length > 0 && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '16px',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Today's Focus Sessions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {daily.sessions.map((s: any, i: number) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'var(--bg-secondary)',
                borderRadius: 8,
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: s.is_active ? 'var(--green)' : 'var(--accent)',
                  }} />
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{s.task_name}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {s.is_active ? '● Active' : `${Math.round((s.duration_seconds || 0) / 60)} min`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
