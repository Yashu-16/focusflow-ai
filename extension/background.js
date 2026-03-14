const API_BASE = 'http://localhost:8000';

// Focus session state
let focusSession = null;
let focusInterval = null;

// Safety layer: track active SSE stream for kill-switch
let activeTaskId = null;
let activeStream = null;

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SEND_COMMAND') {
    handleCommandWithSafety(message.payload).then(sendResponse);
    return true;
  }
  if (message.type === 'CANCEL_TASK') {
    cancelActiveTask().then(sendResponse);
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

/**
 * Safety-aware command handler.
 *
 * Flow:
 *   1. POST /api/command/preview  → get task_id + description (for confirm overlay)
 *   2. Broadcast SAFETY_CONFIRM to all tabs so the page overlay can ask the user
 *   3. Wait for the popup/overlay to send CONFIRM_TASK or CANCEL_TASK
 *
 * NOTE: For the extension use-case the confirmation is handled by the popup UI.
 * The content script overlay is notified of progress via TASK_PROGRESS broadcasts.
 */
async function handleCommandWithSafety(payload) {
  try {
    // Step 1 — classify without executing
    const previewRes = await fetch(`${API_BASE}/api/command/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const preview = await previewRes.json();
    activeTaskId = preview.task_id;

    // Step 2 — notify all tabs: show the confirmation overlay
    broadcastToTabs({
      type: 'SAFETY_CONFIRM',
      taskId: preview.task_id,
      description: preview.description,
      steps: preview.steps,
    });

    // Return preview data so the popup can show its own confirmation UI
    return { status: 'pending_confirm', preview };
  } catch (e) {
    return { error: 'Backend not reachable.' };
  }
}

/**
 * Called after the user confirms (from popup or content-script overlay).
 * Opens an SSE stream and forwards progress events to all content scripts.
 */
async function startConfirmedTask(taskId, userId) {
  const url = `${API_BASE}/api/command/stream/${taskId}?user_id=${userId}`;

  // EventSource is available in service workers via the Fetch API workaround;
  // we use fetch + ReadableStream instead for MV3 service worker compatibility.
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'text/event-stream' },
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    activeStream = reader;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const raw = decoder.decode(value, { stream: true });
      // Parse SSE lines: "data: {...}\n\n"
      for (const line of raw.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event = JSON.parse(line.slice(6));
          broadcastToTabs({ type: 'TASK_PROGRESS', taskId, event });

          if (event.result || event.cancelled || event.error) {
            // Task finished — clear active task
            activeTaskId = null;
            activeStream = null;
            broadcastToTabs({ type: 'TASK_DONE', taskId, event });
          }
        } catch (_) { /* malformed line — skip */ }
      }
    }
  } catch (e) {
    broadcastToTabs({ type: 'TASK_ERROR', taskId, error: e.message });
    activeTaskId = null;
    activeStream = null;
  }
}

/**
 * Kill switch — cancels the currently active task on the backend
 * and closes the SSE stream.
 */
async function cancelActiveTask() {
  if (!activeTaskId) return { status: 'no_active_task' };

  const taskId = activeTaskId;
  activeTaskId = null;

  // Cancel the stream reader (stops reading but doesn't close fetch)
  if (activeStream) {
    try { activeStream.cancel(); } catch (_) {}
    activeStream = null;
  }

  // Signal backend cancellation
  try {
    await fetch(`${API_BASE}/api/command/cancel/${taskId}`, { method: 'POST' });
  } catch (_) { /* best-effort */ }

  broadcastToTabs({ type: 'TASK_CANCELLED', taskId });
  return { status: 'cancelled', taskId };
}

// ─── Helper: broadcast a message to all active tabs ──────────────────────────

function broadcastToTabs(msg) {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, msg).catch(() => {
          // Tab may not have a content script — ignore silently
        });
      }
    }
  });
}

// ─── Existing helpers (unchanged) ────────────────────────────────────────────

async function startFocusSession(payload) {
  try {
    const res = await fetch(`${API_BASE}/api/focus/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    focusSession = { ...payload, id: data.session_id, startTime: Date.now() };

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

// Expose startConfirmedTask so the popup can call it after confirmation
// via chrome.runtime.sendMessage({ type: 'CONFIRM_TASK', taskId, userId })
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CONFIRM_TASK') {
    startConfirmedTask(message.taskId, message.userId);
    sendResponse({ status: 'streaming_started' });
    return true;
  }
});
