'use client'
import { useEffect, useState } from 'react'
import { getNews } from '@/lib/api'

export default function NewsPage() {
  const [articles, setArticles] = useState<any[]>([])

  useEffect(() => {
    getNews().then(setArticles).catch(() => {})
  }, [])

  const demoArticles = [
    { id: 1, headline: 'OpenAI Releases New Reasoning Model with Improved Capabilities', summary: 'The latest model shows significant improvements in complex reasoning tasks.', source: 'techcrunch.com', url: '#', timestamp: new Date(Date.now() - 3600000) },
    { id: 2, headline: 'Google DeepMind Updates AlphaFold Protein Structure Predictor', summary: 'New version can predict protein structures with unprecedented accuracy.', source: 'bbc.com', url: '#', timestamp: new Date(Date.now() - 7200000) },
    { id: 3, headline: 'S&P 500 Rises 0.8% Amid Positive Earnings Reports', summary: 'Stock markets responded positively to better-than-expected corporate earnings.', source: 'reuters.com', url: '#', timestamp: new Date(Date.now() - 10800000) },
    { id: 4, headline: 'Climate Summit Reaches New Global Emissions Agreement', summary: 'World leaders commit to new targets in landmark climate deal.', source: 'nytimes.com', url: '#', timestamp: new Date(Date.now() - 86400000) },
    { id: 5, headline: 'New Study Shows Remote Work Productivity Higher Than Office', summary: 'Research across 10,000 workers shows remote workers are 20% more productive.', source: 'techcrunch.com', url: '#', timestamp: new Date(Date.now() - 172800000) },
  ]
  const display = articles.length > 0 ? articles : demoArticles

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>News Feed 📰</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Headlines captured from news sites via the extension</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {display.map((article: any) => (
          <a key={article.id} href={article.url !== '#' ? article.url : undefined}
            target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '14px 16px',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'
              ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
              ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'
            }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 6 }}>
                    {article.headline}
                  </div>
                  {article.summary && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {article.summary}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 10, alignItems: 'center' }}>
                <span style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: 20, padding: '2px 8px', fontSize: 10, color: 'var(--text-muted)',
                }}>
                  {article.source}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {article.timestamp ? new Date(article.timestamp).toLocaleString() : ''}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
        💡 Visit news sites with the extension installed to automatically capture headlines
      </p>
    </div>
  )
}
