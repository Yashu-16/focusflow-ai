import Sidebar from '@/components/Sidebar'
import AIChatPanel from '@/components/AIChatPanel'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Left sidebar */}
      <Sidebar />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          height: 52,
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          background: 'var(--bg-secondary)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            AI Life Efficiency Dashboard
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              color: 'var(--green)',
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              <span style={{ width: 6, height: 6, background: 'var(--green)', borderRadius: '50%', display: 'inline-block' }} />
              Backend Connected
            </div>
          </div>
        </div>

        {/* Content + Chat panel */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Page content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {children}
          </div>

          {/* Right AI Chat Panel */}
          <div style={{ width: 340, flexShrink: 0, height: '100%', overflow: 'hidden' }}>
            <AIChatPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
