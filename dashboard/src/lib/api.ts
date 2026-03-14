import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

// Get or create a persistent user ID
export function getUserId(): string {
  if (typeof window === 'undefined') return 'default_user'
  let uid = localStorage.getItem('ai_efficiency_uid')
  if (!uid) {
    uid = 'user_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('ai_efficiency_uid', uid)
  }
  return uid
}

export async function sendCommand(command: string) {
  const res = await api.post('/api/command', {
    user_id: getUserId(),
    command,
  })
  return res.data
}

/**
 * Classify a command without executing it.
 * Returns { task_id, intent, description, steps } for the confirmation modal.
 */
export async function previewCommand(command: string) {
  const res = await api.post('/api/command/preview', {
    user_id: getUserId(),
    command,
  })
  return res.data as { task_id: string; intent: string; description: string; steps: number }
}

/**
 * Signal the backend to stop an executing task.
 */
export async function cancelTask(taskId: string) {
  const res = await api.post(`/api/command/cancel/${taskId}`)
  return res.data
}

/**
 * Open an SSE connection for a confirmed task.
 * Returns an EventSource. Caller is responsible for closing it.
 */
export function openTaskStream(taskId: string): EventSource {
  const url = `${API_BASE}/api/command/stream/${taskId}?user_id=${getUserId()}`
  return new EventSource(url)
}

export async function getWeeklyReport() {
  const res = await api.get(`/api/report/weekly?user_id=${getUserId()}`)
  return res.data
}

export async function getDailyReport() {
  const res = await api.get(`/api/report/daily?user_id=${getUserId()}`)
  return res.data
}

export async function getEmails() {
  const res = await api.get(`/api/emails/${getUserId()}`)
  return res.data
}

export async function getActivity() {
  const res = await api.get(`/api/activity/${getUserId()}`)
  return res.data
}

export async function getNews() {
  const res = await api.get('/api/news')
  return res.data
}

export async function getFocusHistory() {
  const res = await api.get(`/api/focus/history/${getUserId()}`)
  return res.data
}

export async function getCommandHistory() {
  const res = await api.get(`/api/report/commands/${getUserId()}`)
  return res.data
}
