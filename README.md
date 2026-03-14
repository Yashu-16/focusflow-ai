# ⚡ AI Life Efficiency Assistant

A full-stack AI productivity assistant with a browser extension, FastAPI backend, and Next.js dashboard with a built-in AI chat panel.

---

## 📁 Project Structure

```
life-efficiency-ai/
├── extension/          ← Chrome browser extension
├── backend/            ← Python FastAPI backend
├── dashboard/          ← Next.js web dashboard
├── START-ALL.bat       ← Launch everything (Windows)
├── start-backend.bat   ← Launch backend only
└── start-dashboard.bat ← Launch dashboard only
```

---

## 🚀 Quick Start (Windows)

### Step 1 — Install Prerequisites

| Tool | Download | Version |
|------|----------|---------|
| Python | https://python.org | 3.9 or higher |
| Node.js | https://nodejs.org | 18 or higher |
| Chrome | https://google.com/chrome | Latest |

> ✅ During Python install, check **"Add Python to PATH"**

---

### Step 2 — Add Your API Key

1. Open `backend/` folder
2. Copy `.env.example` → rename to `.env`
3. Edit `.env` and add your key:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
# OR
OPENAI_API_KEY=sk-your-key-here
```

**Get API keys:**
- Anthropic: https://console.anthropic.com → API Keys
- OpenAI: https://platform.openai.com → API Keys

> ⚠️ Without an API key the app runs in **demo mode** with sample responses.

---

### Step 3 — Start Everything

Double-click **`START-ALL.bat`**

This opens two windows:
- 🟢 Backend on http://localhost:8000
- 🟢 Dashboard on http://localhost:3000

Your browser will open automatically.

---

### Step 4 — Install the Chrome Extension

1. Open Chrome and go to: `chrome://extensions`
2. Enable **Developer Mode** (toggle, top right)
3. Click **Load unpacked**
4. Select the `extension/` folder from this project
5. The ⚡ icon appears in your toolbar

---

### Step 5 — Use It!

| Action | How |
|--------|-----|
| Chat with AI | Use the right panel in the dashboard |
| Summarize emails | Open Gmail → extension auto-captures |
| Get news digest | Visit any news site → extension captures headlines |
| Start focus session | Click extension icon → Start Focus |
| View dashboard | http://localhost:3000 |
| API docs | http://localhost:8000/docs |

---

## 🧩 Features

### Browser Extension
- **AI Command Input** — type any command directly in the popup
- **Quick Commands** — one-click email summary, news digest, reports
- **Focus Session Timer** — live timer with task tracking
- **Gmail Integration** — auto-captures emails when you open Gmail
- **News Scraping** — captures headlines from major news sites

### Dashboard
- **Main Dashboard** — focus stats, efficiency score, weekly charts
- **Focus Page** — session history with duration breakdown
- **Activity Log** — all tracked browser activity
- **Emails Page** — captured emails with unread indicators
- **News Feed** — captured news headlines
- **Reports Page** — weekly analytics with radial efficiency gauge
- **Settings Page** — configure API keys and backend URL
- **AI Chat Panel** (right side) — chat with your AI assistant from any page

### Backend
- **Command Processing** — AI interprets and executes any command
- **Email Storage** — deduplicates and stores email metadata
- **Focus Tracking** — start/stop/update focus sessions with live updates
- **Activity Tracking** — logs browser activity by type
- **News Storage** — aggregates scraped news articles
- **Weekly Reports** — calculates focus time, efficiency, and breakdowns
- **Auto DB Setup** — SQLite database created automatically (no setup needed)

---

## 🛠️ Manual Start (if .bat files don't work)

### Backend
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Dashboard
```cmd
cd dashboard
npm install
npm run dev
```

---

## 🗄️ Database

By default uses **SQLite** (file: `backend/ai_efficiency.db`) — no setup needed.

To use PostgreSQL, update `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/ai_efficiency
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/command` | Process AI command |
| POST | `/api/emails` | Store emails from extension |
| GET | `/api/emails/{user_id}` | Get stored emails |
| POST | `/api/focus/start` | Start focus session |
| POST | `/api/focus/stop` | Stop focus session |
| GET | `/api/focus/history/{user_id}` | Focus session history |
| POST | `/api/activity` | Track browser activity |
| POST | `/api/news` | Store news articles |
| GET | `/api/news` | Get news articles |
| GET | `/api/report/weekly` | Weekly productivity stats |
| GET | `/api/report/daily` | Today's stats |

Full interactive docs: http://localhost:8000/docs

---

## ❓ Troubleshooting

**"Python not found"** → Reinstall Python with "Add to PATH" checked

**"Node not found"** → Install Node.js 18+ from nodejs.org

**Dashboard shows demo data** → Make sure backend is running on port 8000

**Extension not capturing emails** → Make sure you're on mail.google.com and the extension is enabled

**AI returns demo responses** → Add your API key to `backend/.env` and restart the backend

---

## 🔐 Privacy

- All data stays on your local machine
- No data is sent to any cloud except AI API calls (which are anonymized prompts)
- SQLite database is stored at `backend/ai_efficiency.db`

---

## 📋 Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension | Chrome MV3, Vanilla JS |
| Backend | Python, FastAPI, SQLAlchemy, SQLite |
| Dashboard | Next.js 14, React, TailwindCSS, Recharts |
| AI | Anthropic Claude / OpenAI GPT |
