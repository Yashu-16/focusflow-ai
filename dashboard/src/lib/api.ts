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
