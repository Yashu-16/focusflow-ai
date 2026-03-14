// Gmail Email Content Script
(function () {
  if (!window.location.href.includes('mail.google.com')) return;

  let lastExtracted = 0;
  const EXTRACT_INTERVAL = 30000; // 30 seconds

  function extractEmails() {
    const now = Date.now();
    if (now - lastExtracted < EXTRACT_INTERVAL) return;
    lastExtracted = now;

    const emailRows = document.querySelectorAll('tr.zA');
    if (!emailRows.length) return;

    const emails = [];
    emailRows.forEach((row) => {
      const senderEl = row.querySelector('.yX.xY span[email]');
      const subjectEl = row.querySelector('.y6 span[data-thread-id]') || row.querySelector('.bog');
      const snippetEl = row.querySelector('.y2');
      const timeEl = row.querySelector('.xW.xY span');
      const isUnread = row.classList.contains('zE');

      if (subjectEl) {
        emails.push({
          sender: senderEl ? senderEl.getAttribute('email') : 'Unknown',
          sender_name: senderEl ? senderEl.textContent.trim() : 'Unknown',
          subject: subjectEl.textContent.trim(),
          snippet: snippetEl ? snippetEl.textContent.trim() : '',
          timestamp: timeEl ? timeEl.getAttribute('title') || timeEl.textContent.trim() : '',
          is_unread: isUnread
        });
      }
    });

    if (emails.length > 0) {
      chrome.runtime.sendMessage({ type: 'STORE_EMAILS', payload: emails });
    }
  }

  // Watch for Gmail loading
  const observer = new MutationObserver(() => {
    const inbox = document.querySelector('tr.zA');
    if (inbox) extractEmails();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Track email reading activity
  document.addEventListener('click', (e) => {
    const emailRow = e.target.closest('tr.zA');
    if (emailRow) {
      chrome.runtime.sendMessage({
        type: 'TRACK_ACTIVITY',
        payload: {
          activity_type: 'reading_email',
          url: window.location.href,
          timestamp: new Date().toISOString(),
          duration: 0
        }
      });
    }
  });
})();
