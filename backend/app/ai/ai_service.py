import os
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


async def call_ai(prompt: str, system: str = None) -> str:
    """Call AI API - tries Anthropic first, falls back to OpenAI"""

    # Try Anthropic first
    if ANTHROPIC_API_KEY and ANTHROPIC_API_KEY != "your_anthropic_api_key_here":
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
            messages = [{"role": "user", "content": prompt}]
            kwargs = {"model": "claude-3-haiku-20240307", "max_tokens": 1024, "messages": messages}
            if system:
                kwargs["system"] = system
            message = client.messages.create(**kwargs)
            return message.content[0].text
        except Exception as e:
            print(f"Anthropic error: {e}")

    # Try OpenAI
    if OPENAI_API_KEY and OPENAI_API_KEY != "your_openai_api_key_here":
        try:
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_API_KEY)
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=1024
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI error: {e}")

    # Fallback demo response
    return demo_response(prompt)


def demo_response(prompt: str) -> str:
    """Demo response when no API key is configured"""
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
    """Classify user command intent"""
    system = """You are an intent classifier. Given a user command, return a JSON with:
{
  "intent": "one of: summarize_emails, daily_news, start_focus, stop_focus, generate_reply, weekly_report, productivity_tips, general_question",
  "parameters": {}
}
Return ONLY the JSON, nothing else."""

    result = await call_ai(command, system)

    import json
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
    prompt = f"""Based on this productivity data, give personalized insights and 3 specific improvement suggestions:

Focus Time This Week: {stats.get('focus_hours', 0):.1f} hours
Routine Time: {stats.get('routine_hours', 0):.1f} hours
Efficiency Ratio: {stats.get('efficiency', 0):.0f}%
Total Sessions: {stats.get('total_sessions', 0)}
Most Common Activity: {stats.get('top_activity', 'unknown')}

Be specific and encouraging. Format with clear sections."""

    return await call_ai(prompt)
