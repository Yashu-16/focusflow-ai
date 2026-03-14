/**
 * progressOverlay.js — Content script injected into all pages.
 *
 * Listens for TASK_PROGRESS messages from background.js and renders
 * a floating progress overlay in the bottom-right corner of the page.
 *
 * Messages handled:
 *   SAFETY_CONFIRM  — show confirmation overlay (optional; dashboard handles this)
 *   TASK_PROGRESS   — update progress bar and step label
 *   TASK_DONE       — show completion state, then fade out
 *   TASK_CANCELLED  — show "stopped" state, then fade out
 *   TASK_ERROR      — show error state, then fade out
 */

(function () {
  'use strict';

  let overlay = null;

  // ─── Build the overlay DOM (created once, reused) ─────────────────────────

  function ensureOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = '__focusflow_overlay__';
    overlay.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 280px;
      background: #1e1e2e;
      border: 1px solid #6366f1;
      border-radius: 12px;
      padding: 14px 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 12px;
      color: #c9d1d9;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      z-index: 2147483647;
      transition: opacity 0.3s ease, transform 0.3s ease;
      opacity: 0;
      transform: translateY(8px);
      pointer-events: auto;
    `;
    overlay.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span id="ff_dot" style="width:8px;height:8px;background:#6366f1;border-radius:50%;display:inline-block;animation:ff_pulse 1s ease infinite;"></span>
          <span id="ff_title" style="font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#fff;">AI Running</span>
        </div>
        <button id="ff_stop" style="
          background:rgba(239,68,68,0.12);
          border:1px solid rgba(239,68,68,0.5);
          color:#ef4444;
          border-radius:6px;
          padding:3px 9px;
          font-size:10px;
          font-weight:700;
          cursor:pointer;
          font-family:inherit;
        ">■ Stop</button>
      </div>
      <div id="ff_bar_track" style="height:5px;background:#2d2d3f;border-radius:99px;overflow:hidden;margin-bottom:8px;">
        <div id="ff_bar_fill" style="height:100%;width:0%;background:linear-gradient(90deg,#6366f1,#8b5cf6);border-radius:99px;transition:width 0.4s ease;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span id="ff_msg" style="color:#8b949e;font-size:11px;">Initializing...</span>
        <span id="ff_pct" style="color:#6e7681;font-size:11px;font-variant-numeric:tabular-nums;">0%</span>
      </div>
    `;

    // Inject keyframe animation for the pulsing dot
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ff_pulse {
        0%,100% { opacity:1; transform:scale(1); }
        50% { opacity:0.5; transform:scale(1.3); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    // Wire up the Stop button
    overlay.querySelector('#ff_stop').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'CANCEL_TASK' });
    });

    return overlay;
  }

  function showOverlay() {
    const el = ensureOverlay();
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  }

  function hideOverlay(delay = 2500) {
    if (!overlay) return;
    setTimeout(() => {
      overlay.style.opacity = '0';
      overlay.style.transform = 'translateY(8px)';
    }, delay);
  }

  function setOverlayState(title, dotColor, showStop) {
    const el = ensureOverlay();
    el.querySelector('#ff_title').textContent = title;
    el.querySelector('#ff_dot').style.background = dotColor;
    el.querySelector('#ff_dot').style.animation = dotColor === '#6366f1' ? 'ff_pulse 1s ease infinite' : 'none';
    el.querySelector('#ff_stop').style.display = showStop ? 'block' : 'none';
    el.style.borderColor = dotColor === '#ef4444' ? 'rgba(239,68,68,0.5)' : '#6366f1';
  }

  function updateProgress(event) {
    const el = ensureOverlay();
    if (event.percent != null) {
      el.querySelector('#ff_bar_fill').style.width = `${event.percent}%`;
      el.querySelector('#ff_pct').textContent = `${event.percent}%`;
    }
    if (event.message) {
      el.querySelector('#ff_msg').textContent = event.message;
    }
  }

  // ─── Message listener ─────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg) => {
    switch (msg.type) {

      case 'SAFETY_CONFIRM':
        ensureOverlay();
        setOverlayState('Awaiting Confirmation', '#f59e0b', false);
        updateProgress({ percent: 0, message: msg.description || 'Pending user approval...' });
        showOverlay();
        break;

      case 'TASK_PROGRESS':
        ensureOverlay();
        setOverlayState('AI Running', '#6366f1', true);
        updateProgress(msg.event);
        showOverlay();
        break;

      case 'TASK_DONE':
        if (!overlay) return;
        setOverlayState('Done', '#22c55e', false);
        updateProgress({ percent: 100, message: 'Task completed.' });
        hideOverlay(2500);
        break;

      case 'TASK_CANCELLED':
        if (!overlay) return;
        setOverlayState('Stopped', '#ef4444', false);
        updateProgress({ message: 'Task stopped by user.' });
        hideOverlay(2000);
        break;

      case 'TASK_ERROR':
        if (!overlay) return;
        setOverlayState('Error', '#ef4444', false);
        updateProgress({ message: msg.error || 'An error occurred.' });
        hideOverlay(3000);
        break;
    }
  });
})();
