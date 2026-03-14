'use client'
import { useState, useEffect } from 'react'

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [apiProvider, setApiProvider] = useState('anthropic')
  const [backendUrl, setBackendUrl] = useState('http://localhost:8000')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setApiKey(localStorage.getItem('ai_api_key') || '')
    setApiProvider(localStorage.getItem('ai_provider') || 'anthropic')
    setBackendUrl(localStorage.getItem('backend_url') || 'http://localhost:8000')
  }, [])

  const save = () => {
    localStorage.setItem('ai_api_key', apiKey)
    localStorage.setItem('ai_provider', apiProvider)
    localStorage.setItem('backend_url', backendUrl)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Settings ⚙️</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Configure your AI assistant</p>
      </div>

      {/* AI Provider */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>🤖 AI Provider</div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Provider</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['anthropic', 'openai'].map(p => (
              <button key={p} onClick={() => setApiProvider(p)} style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', border: '1px solid',
                borderColor: apiProvider === p ? 'var(--accent)' : 'var(--border)',
                background: apiProvider === p ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                color: apiProvider === p ? 'var(--accent)' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}>
                {p === 'anthropic' ? '⚡ Anthropic Claude' : '🤖 OpenAI GPT'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 4 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
            API Key <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>(stored in backend .env, not here)</span>
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={apiProvider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
            style={{
              width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)',
              fontSize: 13, outline: 'none',
            }}
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            Get your key: {apiProvider === 'anthropic'
              ? 'console.anthropic.com → API Keys'
              : 'platform.openai.com → API Keys'}
          </div>
        </div>
      </div>

      {/* Backend */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>🖥️ Backend Server</div>
        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Backend URL</label>
        <input
          type="text"
          value={backendUrl}
          onChange={e => setBackendUrl(e.target.value)}
          style={{
            width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)',
            fontSize: 13, outline: 'none',
          }}
        />
      </div>

      {/* Setup Guide */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>🚀 Quick Setup Guide</div>
        {[
          { step: '1', title: 'Start the backend', desc: 'Run start-backend.bat from the project root' },
          { step: '2', title: 'Start the dashboard', desc: 'Run start-dashboard.bat from the project root' },
          { step: '3', title: 'Add your API key', desc: 'Edit backend/.env and add your ANTHROPIC_API_KEY or OPENAI_API_KEY' },
          { step: '4', title: 'Install the extension', desc: 'Open Chrome → chrome://extensions → Load unpacked → select the extension/ folder' },
          { step: '5', title: 'Open Gmail', desc: 'Visit mail.google.com — the extension will auto-capture your emails' },
        ].map(s => (
          <div key={s.step} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0, marginTop: 1
            }}>{s.step}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{s.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={save} style={{
        background: saved ? '#4ade80' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        border: 'none', borderRadius: 10, padding: '12px 24px',
        color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        transition: 'all 0.2s', alignSelf: 'flex-start',
      }}>
        {saved ? '✅ Saved!' : 'Save Settings'}
      </button>
    </div>
  )
}
