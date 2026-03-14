let timerInterval = null;
let sessionStartTime = null;

// DOM refs
const focusTaskInput = document.getElementById('focus-task');
const startFocusBtn = document.getElementById('start-focus');
const stopFocusBtn = document.getElementById('stop-focus');
const focusStatus = document.getElementById('focus-status');
const focusTimer = document.getElementById('focus-timer');
const commandInput = document.getElementById('command-input');
const sendCommandBtn = document.getElementById('send-command');
const responseCard = document.getElementById('response-card');
const responseContent = document.getElementById('response-content');
const loading = document.getElementById('loading');

// Check focus status on open
chrome.runtime.sendMessage({ type: 'GET_FOCUS_STATUS' }, (res) => {
  if (res && res.active) {
    setFocusActive(true, res.session);
  }
});

// Start focus
startFocusBtn.addEventListener('click', () => {
  const task = focusTaskInput.value.trim() || 'General Focus';
  chrome.runtime.sendMessage(
    { type: 'START_FOCUS', payload: { task_name: task, user_id: getUserId() } },
    (res) => {
      if (!res?.error) {
        sessionStartTime = Date.now();
        setFocusActive(true, { task_name: task });
      } else {
        showResponse('Error: ' + res.error);
      }
    }
  );
});

// Stop focus
stopFocusBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'STOP_FOCUS' }, (res) => {
    setFocusActive(false);
    if (res && !res.error) {
      showResponse(`✅ Focus session ended!\nDuration: ${formatTime(Math.floor((Date.now() - sessionStartTime) / 1000))}\nTask: ${focusTaskInput.value || 'General Focus'}`);
    }
  });
});

// Quick commands
document.querySelectorAll('.quick-cmd').forEach(btn => {
  btn.addEventListener('click', () => {
    const cmd = btn.getAttribute('data-cmd');
    sendCommand(cmd);
  });
});

// Send command button
sendCommandBtn.addEventListener('click', () => {
  const cmd = commandInput.value.trim();
  if (cmd) {
    sendCommand(cmd);
    commandInput.value = '';
  }
});

commandInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const cmd = commandInput.value.trim();
    if (cmd) {
      sendCommand(cmd);
      commandInput.value = '';
    }
  }
});

function sendCommand(command) {
  showLoading(true);
  responseCard.style.display = 'none';
  chrome.runtime.sendMessage(
    { type: 'SEND_COMMAND', payload: { user_id: getUserId(), command } },
    (res) => {
      showLoading(false);
      if (res?.result) {
        showResponse(res.result);
      } else if (res?.error) {
        showResponse('⚠️ ' + res.error);
      } else {
        showResponse('No response received.');
      }
    }
  );
}

function showResponse(text) {
  responseContent.textContent = text;
  responseCard.style.display = 'flex';
}

function showLoading(show) {
  loading.classList.toggle('hidden', !show);
}

function setFocusActive(active, session) {
  if (active) {
    focusStatus.textContent = `● Active: ${session?.task_name || 'Focus Session'}`;
    focusStatus.className = 'focus-status active';
    startFocusBtn.disabled = true;
    stopFocusBtn.disabled = false;
    focusTimer.classList.remove('hidden');
    sessionStartTime = sessionStartTime || Date.now();
    timerInterval = setInterval(updateTimer, 1000);
  } else {
    focusStatus.textContent = '● No Active Session';
    focusStatus.className = 'focus-status inactive';
    startFocusBtn.disabled = false;
    stopFocusBtn.disabled = true;
    focusTimer.classList.add('hidden');
    clearInterval(timerInterval);
    sessionStartTime = null;
  }
}

function updateTimer() {
  if (!sessionStartTime) return;
  const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
  focusTimer.textContent = formatTime(elapsed);
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function getUserId() {
  let uid = localStorage.getItem('ai_efficiency_uid');
  if (!uid) {
    uid = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('ai_efficiency_uid', uid);
  }
  return uid;
}
