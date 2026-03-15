import os
import json
import logging
from datetime import date
from dotenv import load_dotenv
 
load_dotenv()
logger = logging.getLogger(__name__)
<<<<<<< HEAD

=======
 
>>>>>>> cca257e98261bc0b772533a5b639f26f8b50eb13
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
 
 
async def call_ai(prompt: str, system: str = None) -> str:
    """Call AI API - tries Anthropic first, falls back to OpenAI"""
 
    if ANTHROPIC_API_KEY and ANTHROPIC_API_KEY != "your_anthropic_api_key_here":
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
            messages = [{"role": "user", "content": prompt}]
            kwargs = {"model": "claude-haiku-4-5-20251001", "max_tokens": 1024, "messages": messages}
            if system:
                kwargs["system"] = system
            message = client.messages.create(**kwargs)
            return message.content[0].text
        except Exception as e:
            print(f"Anthropic error: {e}")
 
    if OPENAI_API_KEY and OPENAI_API_KEY != "your_openai_api_key_here":
        try:
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_API_KEY)
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=1024
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI error: {e}")
 
    return demo_response(prompt)
 
 
def demo_response(prompt: str) -> str:
    prompt_lower = prompt.lower()
 
    if "email" in prompt_lower and "summar" in prompt_lower:
        return """📧 Email Summary (Demo Mode):
 
• **Newsletter** from TechCrunch - 5 new articles on AI developments
• **Meeting Request** from Sarah - "Can we sync on the Q4 roadmap?"
• **Invoice #1042** from Stripe - $299 due by end of month
• **GitHub** - 3 new PRs ready for review on your repository
• **LinkedIn** - 12 new connection requests
 
Configure your API key to get real AI-powered summaries!"""
 
    if "news" in prompt_lower:
        return """📰 Today's News Digest (Demo Mode):
 
🤖 **Technology**
• OpenAI announces new reasoning model with improved capabilities
• Google DeepMind releases updated AlphaFold protein structure predictor
 
📈 **Finance**
• S&P 500 rises 0.8% amid positive earnings reports
• Fed signals potential rate adjustments in Q1
 
🌍 **World**
• Climate summit reaches new emissions agreement
• WHO updates global health guidelines
 
Configure your API key for personalized news summaries!"""
 
    if "productiv" in prompt_lower or "score" in prompt_lower or "report" in prompt_lower:
        return """📊 Weekly Productivity Report (Demo Mode):
 
Focus Time: 18h 30m
Routine Time: 8h 15m
Efficiency Score: 69%
 
Top Focus Tasks:
• Project Development - 8h
• Research & Reading - 5h
• Meetings - 5.5h
 
Suggestions:
• Try batching emails to 2x per day
• Your peak focus window is 9am-12pm
• Reduce context switching by grouping similar tasks
 
Configure your API key for real insights!"""
 
    if "focus" in prompt_lower and "tip" in prompt_lower:
        return """💡 Focus Enhancement Tips:
 
1. **Pomodoro Technique** - Work 25 min, break 5 min
2. **Single-tab browsing** - Close distracting tabs before sessions
3. **Notification batching** - Check notifications only at set times
4. **Deep work blocks** - Reserve 9am-12pm for complex tasks
5. **End-of-day review** - Spend 10 min planning tomorrow
 
Your recent data shows your best focus hours are morning. Protect that time!"""
 
    return f"""AI Response (Demo Mode):
 
You asked: "{prompt}"
 
This is a demo response. To get real AI-powered responses:
 
1. Open backend/.env
2. Add your ANTHROPIC_API_KEY or OPENAI_API_KEY
3. Restart the backend server
 
Get your API key at:
• Anthropic: console.anthropic.com
• OpenAI: platform.openai.com"""
 
 
async def classify_intent(command: str) -> dict:
    system = """You are an intent classifier. Given a user command, return a JSON with:
{
  "intent": "one of: summarize_emails, daily_news, start_focus, stop_focus, generate_reply, weekly_report, productivity_tips, set_preference, adjust_priority, general_question",
  "parameters": {
    "task": "extracted task name if intent is start_focus, else null"
  }
}
 
Examples:
- "start a focus session on writing report" -> {"intent": "start_focus", "parameters": {"task": "writing report"}}
- "stop my focus session" -> {"intent": "stop_focus", "parameters": {}}
- "summarize emails" -> {"intent": "summarize_emails", "parameters": {}}
- "what's in the news today" -> {"intent": "daily_news", "parameters": {}}
- "how productive was I this week" -> {"intent": "weekly_report", "parameters": {}}
 
Return ONLY the JSON, nothing else."""
 
    result = await call_ai(command, system)
    try:
        result = result.strip()
        if result.startswith("```"):
            result = result.split("```")[1]
            if result.startswith("json"):
                result = result[4:]
        return json.loads(result)
    except:
        return {"intent": "general_question", "parameters": {}}
 
 
async def summarize_emails(emails: list) -> str:
    if not emails:
        return "No emails found to summarize."
 
    email_text = "\n\n".join([
        f"From: {e.get('sender_name', e.get('sender', 'Unknown'))}\n"
        f"Subject: {e.get('subject', 'No subject')}\n"
        f"Preview: {e.get('snippet', '')}"
        for e in emails[:15]
    ])
 
    prompt = f"""Summarize these emails into clear bullet points grouped by priority (Urgent, Important, FYI):
 
{email_text}
 
Be concise and actionable. Format with emojis for readability."""
 
    return await call_ai(prompt)
 
 
async def generate_reply(email_content: str) -> str:
    prompt = f"""Generate a short, professional email reply to this message:
 
{email_content}
 
Write only the reply body, no subject line. Keep it concise and professional."""
    return await call_ai(prompt)
 
 
async def summarize_news(articles: list) -> str:
    if not articles:
        return "No news articles found."
 
    article_text = "\n\n".join([
        f"• {a.get('headline', '')} - {a.get('source', '')} ({a.get('summary', '')[:100]})"
        for a in articles[:20]
    ])
 
    prompt = f"""Create a brief news digest from these headlines, grouped by topic (Tech, Finance, World, etc.):
 
{article_text}
 
Format with clear sections and key takeaways. Keep it scannable."""
 
    return await call_ai(prompt)
 
 
async def generate_productivity_insights(stats: dict) -> str:
    prompt = f"""Based on this productivity data, generate a weekly cognitive efficiency report:
<<<<<<< HEAD

=======
 
>>>>>>> cca257e98261bc0b772533a5b639f26f8b50eb13
Focus Time: {stats.get('focus_hours', 0):.1f} hours
Longest Uninterrupted Session: {stats.get('longest_session_minutes', 0)} minutes
Best Focus Day: {stats.get('best_focus_day', 'N/A')}
Work About Work: {stats.get('work_about_work_pct', 60):.0f}% (industry avg: 60%)
Cognitive Minutes Saved by AI: {stats.get('cognitive_minutes_saved', 0)} minutes
AI Handled Items: {stats.get('ai_handled_items', 0)} (emails + activities)
Total Sessions: {stats.get('total_sessions', 0)}
<<<<<<< HEAD

Write a short report (3-4 sentences) in this style:
"This week you saved X minutes of context switching. Your longest uninterrupted session was Y minutes on [day]. Work about work dropped to Z% — vs the 60% industry average. [One specific encouragement or tip]."

Be specific with the numbers. Format with emojis."""

    return await call_ai(prompt)


EMAIL_CATEGORIZE_SYSTEM = """You are an email analysis assistant. For each email, produce a JSON object with:
1. "category": one of "important", "meeting", "newsletter", "ads", "social", "notification", "other"
2. "summary": a concise 1-3 sentence summary highlighting action items
3. "is_schedule_related": boolean — true if the email mentions a meeting, deadline, event, appointment, RSVP, calendar invite, or any time-bound commitment

Category definitions:
- "important": direct messages requiring your action (approvals, requests, questions from colleagues)
- "meeting": calendar invites, meeting requests, scheduling discussions
- "newsletter": news digests, blog subscriptions, industry updates
- "ads": marketing, promotions, sales, coupons
- "social": social media notifications, connection requests
- "notification": automated alerts (GitHub, CI/CD, billing, shipping, system alerts)
- "other": anything that doesn't fit above

Return ONLY the JSON object. No markdown, no extra text."""


async def categorize_and_summarize_email(subject: str, sender: str, body: str) -> dict:
    """Categorize an email and generate a summary in one LLM call."""
    truncated_body = body[:2000] if body else ""
    prompt = f"""Analyze this email:

=======
 
Write a short report (3-4 sentences) in this style:
"This week you saved X minutes of context switching. Your longest uninterrupted session was Y minutes on [day]. Work about work dropped to Z% — vs the 60% industry average. [One specific encouragement or tip]."
 
Be specific with the numbers. Format with emojis."""
 
    return await call_ai(prompt)
 
 
async def rank_message_importance(messages: list) -> list:
    """Rank messages by importance using AI."""
    if not messages:
        return []
    try:
        messages_text = "\n".join([
            f"{i+1}. From: {m.get('sender', '?')} | Subject: {m.get('subject', '?')} | Preview: {m.get('snippet', '')[:100]}"
            for i, m in enumerate(messages[:20])
        ])
        prompt = f"""Rank these messages by importance (1=most important). Return ONLY a JSON array of indices in order of importance:
 
{messages_text}
 
Return format: [3, 1, 5, 2, 4] (indices of messages in order of importance)"""
        result = await call_ai(prompt, system="You are an email prioritization assistant. Return only a JSON array of numbers.")
        result = result.strip()
        if result.startswith("```"):
            result = result.split("```")[1]
            if result.startswith("json"):
                result = result[4:]
        indices = json.loads(result)
        return [messages[i-1] for i in indices if 0 < i <= len(messages)]
    except:
        return messages
 
 
EMAIL_CATEGORIZE_SYSTEM = """You are an email analysis assistant. For each email, produce a JSON object with:
1. "category": one of "important", "meeting", "newsletter", "ads", "social", "notification", "other"
2. "summary": a concise 1-3 sentence summary highlighting action items
3. "is_schedule_related": boolean
 
Return ONLY the JSON object. No markdown, no extra text."""
 
 
async def categorize_and_summarize_email(subject: str, sender: str, body: str) -> dict:
    truncated_body = body[:2000] if body else ""
    prompt = f"""Analyze this email:
 
>>>>>>> cca257e98261bc0b772533a5b639f26f8b50eb13
From: {sender}
Subject: {subject}
Body:
{truncated_body}"""
<<<<<<< HEAD

=======
 
>>>>>>> cca257e98261bc0b772533a5b639f26f8b50eb13
    result = await call_ai(prompt, EMAIL_CATEGORIZE_SYSTEM)
    try:
        clean = result.strip().strip("`").strip()
        if clean.startswith("json"):
            clean = clean[4:].strip()
        parsed = json.loads(clean)
        return {
            "category": parsed.get("category", "other"),
            "summary": parsed.get("summary", ""),
            "is_schedule_related": parsed.get("is_schedule_related", False),
        }
    except (json.JSONDecodeError, AttributeError):
        return {"category": "other", "summary": result[:200], "is_schedule_related": False}
<<<<<<< HEAD


async def summarize_single_email(subject: str, sender: str, body: str) -> str:
    """Generate a concise 1-3 sentence summary of a single email."""
    result = await categorize_and_summarize_email(subject, sender, body)
    return result["summary"]


async def summarize_email_category(emails: list[dict], category: str) -> str:
    """Generate a cohesive summary for a batch of emails in one category."""
    if not emails:
        return "No emails in this category."

=======
 
 
async def summarize_single_email(subject: str, sender: str, body: str) -> str:
    result = await categorize_and_summarize_email(subject, sender, body)
    return result["summary"]
 
 
async def summarize_email_category(emails: list, category: str) -> str:
    if not emails:
        return "No emails in this category."
 
>>>>>>> cca257e98261bc0b772533a5b639f26f8b50eb13
    email_text = "\n\n".join([
        f"- From: {e.get('sender_name', e.get('sender', '?'))}\n"
        f"  Subject: {e.get('subject', '(no subject)')}\n"
        f"  Summary: {e.get('summary', e.get('snippet', ''))}"
        for e in emails[:20]
    ])
<<<<<<< HEAD

    prompt = f"""Here are {len(emails)} emails in the "{category}" category:\n\n{email_text}\n\nProvide a concise digest covering the key points, action items, and notable information. Group related items together. Be scannable and actionable."""
    system = "You are a productivity assistant. Output a clean, concise digest. No preamble."
    return await call_ai(prompt, system)


INVITE_DETECTION_SYSTEM = """You are an email invitation detector. Analyze the email and determine if it contains a calendar invitation, meeting request, scheduling discussion, deadline, or any time-bound event.

If it DOES contain a schedulable event, return a JSON object:
{{"is_invite": true, "event": {{"title": "...", "start_time": "ISO8601", "end_time": "ISO8601", "description": "A rich summary including: agenda, purpose, relevant context. Include any meeting link, participant names, and location.", "location": "..." or null, "meeting_link": "URL or null", "attendees": ["name1", "name2"] or []}}}}

If it does NOT contain a schedulable event, return:
{{"is_invite": false}}

RULES:
1. Look for: meeting times/dates, RSVPs, calendar links, "join" links, scheduling requests, deadlines, appointments, office hours, interviews, calls.
2. Common patterns: "Let's meet at...", "You're invited to...", "Join us for...", "Calendar invite", Zoom/Teams/Google Meet links, "due by...", "deadline is...".
3. Extract meeting links (Zoom, Teams, Meet, Webex URLs) into "meeting_link".
4. Extract participant/attendee names into "attendees".
5. The "description" should be a helpful rich summary: what the meeting is about, who's attending, links, and any preparation needed.
6. If date/time is ambiguous, estimate based on context. Today is {today}.
7. Return ONLY the JSON. No markdown fences, no explanation."""


async def detect_and_extract_invite(subject: str, body: str) -> dict | None:
    """Detect if email contains a calendar invitation and extract rich event details."""
    truncated_body = body[:2000] if body else ""
    today = date.today().isoformat()
    system = INVITE_DETECTION_SYSTEM.replace("{today}", today)

    prompt = f"""Analyze this email for calendar invitations or schedulable events:

Subject: {subject}
Body:
{truncated_body}"""

=======
 
    prompt = f"""Here are {len(emails)} emails in the "{category}" category:\n\n{email_text}\n\nProvide a concise digest covering the key points, action items, and notable information."""
    system = "You are a productivity assistant. Output a clean, concise digest. No preamble."
    return await call_ai(prompt, system)
 
 
async def detect_and_extract_invite(subject: str, body: str) -> dict | None:
    truncated_body = body[:2000] if body else ""
    today = date.today().isoformat()
    system = f"""You are an email invitation detector. If the email contains a schedulable event, return JSON:
{{"is_invite": true, "event": {{"title": "...", "start_time": "ISO8601", "end_time": "ISO8601", "description": "...", "location": null, "meeting_link": null, "attendees": []}}}}
If not: {{"is_invite": false}}
Today is {today}. Return ONLY JSON."""
 
    prompt = f"""Analyze this email for calendar invitations:
 
Subject: {subject}
Body:
{truncated_body}"""
 
>>>>>>> cca257e98261bc0b772533a5b639f26f8b50eb13
    result = await call_ai(prompt, system)
    try:
        clean = result.strip().strip("`").strip()
        if clean.startswith("json"):
            clean = clean[4:].strip()
        parsed = json.loads(clean)
<<<<<<< HEAD
        if isinstance(parsed, str):
            parsed = json.loads(parsed)
        if parsed.get("is_invite") and parsed.get("event"):
            event = parsed["event"]
            meeting_link = event.get("meeting_link", "")
            attendees = event.get("attendees", [])
            desc_parts = [event.get("description", "")]
            if meeting_link:
                desc_parts.append(f"\nMeeting Link: {meeting_link}")
            if attendees:
                desc_parts.append(f"\nAttendees: {', '.join(attendees)}")
            event["description"] = "\n".join(desc_parts)
            return event
    except (json.JSONDecodeError, AttributeError):
        pass
    return None


SCHEDULE_EXTRACTION_SYSTEM = """You are a schedule extraction assistant. Parse the provided text and extract ALL calendar events.

Output STRICT JSON array. Each event object must have:
- "title": string (event name, concise)
- "start_time": string (ISO 8601 format: "2026-03-16T09:00:00")
- "end_time": string (ISO 8601 format: "2026-03-16T10:00:00")
- "description": string (detailed notes and context from the source material)
- "location": string or null
- "confidence": number between 0.0 and 1.0 (how confident you are about the extracted time)
- "needs_review": boolean (true if any date/time information is ambiguous or incomplete)
- "review_reason": string or null (explain what is uncertain, e.g. "Time not specified, defaulted to 09:00")

RULES:
1. If only a date is given without a specific time, default to 09:00-10:00 and set needs_review=true with an appropriate review_reason.
2. If only a day-of-week is given without a date, calculate the next occurrence from today ({today}).
3. If duration is not specified, default to 1 hour and set needs_review=true.
4. For recurring events (e.g. "every Monday"), create entries for the next 4 weeks.
5. Preserve ALL relevant details from the source as the description/notes field.
6. Return ONLY the JSON array. No markdown code fences, no explanation, no extra text.

Examples:
Input: "Team standup Monday 10am-10:30am Room 204"
Output: [{{"title":"Team Standup","start_time":"2026-03-16T10:00:00","end_time":"2026-03-16T10:30:00","description":"Team standup meeting","location":"Room 204","confidence":0.95,"needs_review":false,"review_reason":null}}]

Input: "Project deadline March 20"
Output: [{{"title":"Project Deadline","start_time":"2026-03-20T09:00:00","end_time":"2026-03-20T10:00:00","description":"Project deadline","location":null,"confidence":0.7,"needs_review":true,"review_reason":"Time not specified, defaulted to 09:00-10:00"}}]"""


def _parse_json_from_ai(text: str) -> list:
    """Try to extract a JSON array from AI response text, handling common formatting issues."""
    text = text.strip()

    if text.startswith("```"):
        lines = text.split("\n")
        lines = lines[1:]  # remove opening fence
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    try:
        result = json.loads(text)
        if isinstance(result, list):
            return result
        if isinstance(result, dict) and "events" in result:
            return result["events"]
        return [result]
    except json.JSONDecodeError:
        pass

    # Try to find JSON array in the text
    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse JSON from AI response: {text[:200]}")


async def extract_schedule_events(text: str) -> list[dict]:
    """Extract structured schedule events from text using AI."""
    today = date.today().isoformat()
    system = SCHEDULE_EXTRACTION_SYSTEM.replace("{today}", today)

    prompt = f"Extract all calendar events from this content:\n\n{text}"

    result = await call_ai(prompt, system)
    events = _parse_json_from_ai(result)

    validated = []
    required_fields = {"title", "start_time", "end_time"}
    for event in events:
        if not isinstance(event, dict):
            continue
        if not required_fields.issubset(event.keys()):
            logger.warning(f"Skipping event missing required fields: {event}")
            continue
        validated.append({
            "title": str(event.get("title", "")),
            "start_time": str(event.get("start_time", "")),
            "end_time": str(event.get("end_time", "")),
            "description": str(event.get("description", "")),
            "location": event.get("location"),
            "confidence": float(event.get("confidence", 0.5)),
            "needs_review": bool(event.get("needs_review", False)),
            "review_reason": event.get("review_reason"),
        })

    if not validated:
        raise ValueError("AI could not extract any valid events from the provided content")

    return validated


async def extract_preference(command: str) -> dict:
    """Extract user preference from a command."""
    system = """Extract a user preference from this command. Return ONLY JSON:
=======
        if parsed.get("is_invite") and parsed.get("event"):
            return parsed["event"]
    except:
        pass
    return None
 
 
async def extract_schedule_events(text: str) -> list:
    today = date.today().isoformat()
    system = f"""Extract ALL calendar events from text. Return a JSON array. Each event:
{{"title": "...", "start_time": "ISO8601", "end_time": "ISO8601", "description": "...", "location": null, "confidence": 0.9, "needs_review": false, "review_reason": null}}
Today is {today}. Return ONLY the JSON array."""
 
    prompt = f"Extract all calendar events from this content:\n\n{text}"
    result = await call_ai(prompt, system)
 
    try:
        text_clean = result.strip()
        if text_clean.startswith("```"):
            lines = text_clean.split("\n")[1:]
            if lines[-1].strip() == "```":
                lines = lines[:-1]
            text_clean = "\n".join(lines).strip()
        events = json.loads(text_clean)
        if isinstance(events, dict):
            events = [events]
        return events
    except:
        return []
 
 
async def extract_preference(command: str) -> dict:
    system = """Extract a user preference. Return ONLY JSON:
>>>>>>> cca257e98261bc0b772533a5b639f26f8b50eb13
{
  "pref_type": "filter|display|notification|other",
  "key": "short_key_name",
  "value": "preference_value",
  "summary": "Human readable summary"
}"""
    result = await call_ai(command, system)
    try:
        clean = result.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        return json.loads(clean)
    except:
        return {"pref_type": "other", "key": "custom", "value": command, "summary": command}
<<<<<<< HEAD


async def extract_priority_rule(command: str) -> dict:
    """Extract a priority rule from a command."""
    system = """Extract a priority rule from this command. Return ONLY JSON:
{
  "key": "short_key_name",
  "value": "rule_value_or_list",
=======
 
 
async def extract_priority_rule(command: str) -> dict:
    system = """Extract a priority rule. Return ONLY JSON:
{
  "key": "short_key_name",
  "value": "rule_value",
>>>>>>> cca257e98261bc0b772533a5b639f26f8b50eb13
  "summary": "Human readable summary"
}"""
    result = await call_ai(command, system)
    try:
        clean = result.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        return json.loads(clean)
    except:
        return {"key": "custom", "value": command, "summary": command}


async def generate_daily_insights(stats: dict) -> str:
    prompt = f"""Based on today's productivity data, generate a personalized daily cognitive report:

Longest Deep Focus Session: {stats.get('longest_session_minutes', 0)} minutes
Peak Focus Window: {stats.get('peak_focus_window', 'N/A')}
Context Switches: {stats.get('context_switches', 0)} times today
Flow Rate: {stats.get('flow_rate', 0):.0f}% (focus time vs interruption time)
AI Handled Items: {stats.get('ai_handled_today', 0)} (saving ~{stats.get('ai_minutes_saved_today', 0)} minutes)
Total Focus Sessions: {stats.get('sessions_today', 0)}

Write a short daily report (3-4 sentences) in this style:
"Today your peak focus was [window] with a [X]-minute deep work block. You switched context [N] times — [specific tip to reduce it tomorrow]. AI handled [N] items for you, saving ~[X] minutes of attention. [One encouraging or actionable closing tip based on the data]."

Be specific with numbers. Format with emojis. Make it feel personal, not generic."""

    return await call_ai(prompt)
