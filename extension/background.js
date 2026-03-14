const API_BASE = 'http://localhost:8000';

// Focus session state
let focusSession = null;
let focusInterval = null;

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SEND_COMMAND') {
    handleCommand(message.payload).then(sendResponse);
    return true;
  }
  if (message.type === 'START_FOCUS') {
    startFocusSession(message.payload).then(sendResponse);
    return true;
  }
  if (message.type === 'STOP_FOCUS') {
    stopFocusSession().then(sendResponse);
    return true;
  }
  if (message.type === 'GET_FOCUS_STATUS') {
    sendResponse({ active: focusSession !== null, session: focusSession });
    return true;
  }
  if (message.type === 'STORE_EMAILS') {
    storeEmails(message.payload).then(sendResponse);
    return true;
  }
  if (message.type === 'STORE_NEWS') {
    storeNews(message.payload).then(sendResponse);
    return true;
  }
  if (message.type === 'TRACK_ACTIVITY') {
    trackActivity(message.payload).then(sendResponse);
    return true;
  }
});

async function handleCommand(payload) {
  try {
    const res = await fetch(`${API_BASE}/api/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (e) {
    return { error: 'Backend not reachable. Make sure the backend server is running.' };
  }
}

async function startFocusSession(payload) {
  try {
    const res = await fetch(`${API_BASE}/api/focus/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    focusSession = { ...payload, id: data.session_id, startTime: Date.now() };

    // Update backend every 60 seconds
    focusInterval = setInterval(async () => {
      if (focusSession) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await fetch(`${API_BASE}/api/focus/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: focusSession.id,
            active_tab: tab?.url || '',
            elapsed: Math.floor((Date.now() - focusSession.startTime) / 1000)
          })
        });
      }
    }, 60000);

    return data;
  } catch (e) {
    return { error: 'Failed to start focus session' };
  }
}

async function stopFocusSession() {
  if (!focusSession) return { error: 'No active session' };
  clearInterval(focusInterval);
  try {
    const res = await fetch(`${API_BASE}/api/focus/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: focusSession.id })
    });
    focusSession = null;
    return await res.json();
  } catch (e) {
    focusSession = null;
    return { error: 'Failed to stop session' };
  }
}

async function storeEmails(emails) {
  try {
    const res = await fetch(`${API_BASE}/api/emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails })
    });
    return await res.json();
  } catch (e) {
    return { error: 'Failed to store emails' };
  }
}

async function storeNews(articles) {
  try {
    const res = await fetch(`${API_BASE}/api/news`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articles })
    });
    return await res.json();
  } catch (e) {
    return { error: 'Failed to store news' };
  }
}

async function trackActivity(activity) {
  try {
    const res = await fetch(`${API_BASE}/api/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity)
    });
    return await res.json();
  } catch (e) {
    return { error: 'Failed to track activity' };
  }
}

// Track tab changes for activity
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    trackActivity({
      activity_type: 'tab_switch',
      url: tab.url,
      timestamp: new Date().toISOString()
    });
  }
});
