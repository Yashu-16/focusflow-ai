'use client'
import { useEffect, useState } from 'react'
import { getEmails } from '@/lib/api'

export default function EmailsPage() {
  const [emails, setEmails] = useState<any[]>([])

  useEffect(() => {
    getEmails().then(setEmails).catch(() => {})
  }, [])

  const demoEmails = [
    { id: 1, sender_name: 'GitHub', sender: 'noreply@github.com', subject: '3 PRs waiting for your review', snippet: 'Pull requests on your repositories need attention...', is_unread: true, created_at: new Date(Date.now() - 1800000) },
    { id: 2, sender_name: 'Sarah Johnson', sender: 'sarah@company.com', subject: 'Q4 Roadmap Sync', snippet: 'Can we find a time this week to align on the Q4 roadmap?', is_unread: true, created_at: new Date(Date.now() - 3600000) },
    { id: 3, sender_name: 'Stripe', sender: 'receipts@stripe.com', subject: 'Invoice #1042 - $299.00', snippet: 'Your invoice is due by end of month.', is_unread: false, created_at: new Date(Date.now() - 7200000) },
    { id: 4, sender_name: 'TechCrunch', sender: 'newsletter@techcrunch.com', subject: 'AI Weekly Digest', snippet: 'Top stories in AI this week: OpenAI, Google DeepMind...', is_unread: false, created_at: new Date(Date.now() - 86400000) },
    { id: 5, sender_name: 'LinkedIn', sender: 'notifications@linkedin.com', subject: '12 new connection requests', snippet: 'People in your industry want to connect with you.', is_unread: false, created_at: new Date(Date.now() - 172800000) },
  ]
  const display = emails.length > 0 ? emails : demoEmails
  const unreadCount = display.filter(e => e.is_unread).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Emails 📧</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Captured from Gmail via the browser extension
          </p>
        </div>
        {unreadCount > 0 && (
          <div style={{
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 20, padding: '4px 12px',
            fontSize: 12, fontWeight: 600, color: 'var(--accent)',
          }}>
            {unreadCount} unread
          </div>
        )}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {display.map((email: any, i: number) => (
          <div key={email.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            borderBottom: i < display.length - 1 ? '1px solid var(--border)' : 'none',
            background: email.is_unread ? 'rgba(99,102,241,0.04)' : 'transparent',
            transition: 'background 0.15s',
            cursor: 'pointer',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = email.is_unread ? 'rgba(99,102,241,0.04)' : 'transparent'}
          >
            {/* Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {(email.sender_name || email.sender || '?')[0].toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 13, fontWeight: email.is_unread ? 600 : 400,
                  color: email.is_unread ? 'var(--text-primary)' : 'var(--text-secondary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1
                }}>
                  {email.sender_name}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {email.created_at ? new Date(email.created_at).toLocaleDateString() : ''}
                </span>
              </div>
              <div style={{
                fontSize: 12, fontWeight: email.is_unread ? 600 : 400,
                color: email.is_unread ? 'var(--text-primary)' : 'var(--text-secondary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {email.subject}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                {email.snippet}
              </div>
            </div>

            {email.is_unread && (
              <div style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: '50%', flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
        💡 Tip: Open Gmail with the extension installed to automatically capture emails
      </p>
    </div>
  )
}
