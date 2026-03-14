// News Scraper Content Script
(function () {
  const hostname = window.location.hostname;

  function extractNewsArticles() {
    const articles = [];

    // Generic headline selectors that work on most news sites
    const selectors = [
      'h1 a', 'h2 a', 'h3 a',
      'article h1', 'article h2', 'article h3',
      '.article-title', '.story-title', '.headline'
    ];

    const seen = new Set();
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        const text = el.textContent.trim();
        const href = el.href || el.closest('a')?.href || '';
        if (text.length > 20 && !seen.has(text)) {
          seen.add(text);
          const parent = el.closest('article') || el.parentElement;
          const snippet = parent?.querySelector('p')?.textContent?.trim() || '';
          articles.push({
            headline: text,
            summary: snippet.slice(0, 200),
            url: href || window.location.href,
            source: hostname,
            timestamp: new Date().toISOString()
          });
        }
      });
    });

    return articles.slice(0, 10); // limit to 10 articles
  }

  // Extract after page loads
  setTimeout(() => {
    const articles = extractNewsArticles();
    if (articles.length > 0) {
      chrome.runtime.sendMessage({ type: 'STORE_NEWS', payload: articles });
    }
  }, 2000);

  // Track news reading activity
  chrome.runtime.sendMessage({
    type: 'TRACK_ACTIVITY',
    payload: {
      activity_type: 'reading_news',
      url: window.location.href,
      timestamp: new Date().toISOString(),
      duration: 0
    }
  });
})();
