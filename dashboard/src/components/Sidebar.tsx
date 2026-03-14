'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard',         icon: '⚡', label: 'Dashboard' },
  { href: '/dashboard/focus',   icon: '🎯', label: 'Focus' },
  { href: '/dashboard/activity',icon: '📋', label: 'Activity' },
  { href: '/dashboard/emails',  icon: '📧', label: 'Emails' },
  { href: '/dashboard/news',    icon: '📰', label: 'News' },
  { href: '/dashboard/reports', icon: '📊', label: 'Reports' },
  { href: '/dashboard/settings',icon: '⚙️', label: 'Settings' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div style={{
      width: 60,
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px 0',
      gap: 4,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        width: 36, height: 36,
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, marginBottom: 16,
      }}>⚡</div>

      {/* Nav items */}
      {NAV.map(item => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
        return (
          <Link key={item.href} href={item.href} title={item.label} style={{ textDecoration: 'none' }}>
            <div style={{
              width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 10,
              background: isActive ? 'var(--accent-glow)' : 'transparent',
              border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
              fontSize: 18,
              cursor: 'pointer',
              transition: 'all 0.15s',
              position: 'relative',
            }}
            onMouseEnter={e => {
              if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'
            }}
            onMouseLeave={e => {
              if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
            }}
            >
              {item.icon}
              {isActive && (
                <div style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: 3, height: 20,
                  background: 'var(--accent)',
                  borderRadius: '0 2px 2px 0',
                }} />
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
