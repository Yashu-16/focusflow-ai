"""
Safety & Monitoring Layer — Task registry and cancellation tokens.

Flow:
  1. POST /api/command/preview  → create_pending_task() → returns task_id
  2. GET  /api/command/stream/{task_id} → pop_pending_task(), register_cancel_token()
  3. POST /api/command/cancel/{task_id} → cancel_task() sets the Event
"""
import asyncio
import uuid
from typing import Dict, Optional

# task_id -> {user_id, command, intent, description}
pending_tasks: Dict[str, dict] = {}

# task_id -> asyncio.Event  (set = cancelled)
cancel_tokens: Dict[str, asyncio.Event] = {}

INTENT_META = {
    "summarize_emails":   {"description": "Read your recent emails and generate an AI summary",              "steps": 4},
    "daily_news":         {"description": "Fetch today's top news headlines and create a digest",           "steps": 3},
    "weekly_report":      {"description": "Analyze your weekly productivity data and generate insights",    "steps": 4},
    "productivity_tips":  {"description": "Generate personalized productivity coaching advice",             "steps": 3},
    "general_question":   {"description": "Process your question and generate an AI response",             "steps": 3},
}


def create_pending_task(user_id: str, command: str, intent: str) -> dict:
    """Register a classified task awaiting user confirmation. Returns task metadata."""
    task_id = str(uuid.uuid4())
    meta = INTENT_META.get(intent, INTENT_META["general_question"])
    pending_tasks[task_id] = {
        "user_id": user_id,
        "command": command,
        "intent": intent,
        "description": meta["description"],
        "steps": meta["steps"],
    }
    return {"task_id": task_id, **meta}


def pop_pending_task(task_id: str) -> Optional[dict]:
    """Claim a pending task (removes it so it can only be executed once)."""
    return pending_tasks.pop(task_id, None)


def register_cancel_token(task_id: str) -> asyncio.Event:
    """Create and store a cancel Event for an executing task."""
    event = asyncio.Event()
    cancel_tokens[task_id] = event
    return event


def cancel_task(task_id: str) -> bool:
    """Signal cancellation. Returns True if the token existed."""
    # Cancel an actively streaming task
    event = cancel_tokens.get(task_id)
    if event:
        event.set()
        return True
    # Cancel a task still waiting for user confirmation
    if task_id in pending_tasks:
        pending_tasks.pop(task_id)
        return True
    return False


def cleanup_cancel_token(task_id: str):
    """Remove the cancel token after execution completes."""
    cancel_tokens.pop(task_id, None)
