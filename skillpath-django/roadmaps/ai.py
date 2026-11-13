"""Groq service layer — port of backend/services/aiService.js (same prompts and temperatures).

Groq's API is OpenAI-compatible, so it's called with `requests` (already a dependency) instead of an SDK.
Everything streams, so the UI can render roadmap steps and mentor text as they arrive.
AI output is validated before anything is stored.
"""

import json
import logging
import re

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "openai/gpt-oss-120b"  # Groq retired its Llama chat models; list current ones at /openai/v1/models
MAX_STEPS = 20
BAD_OUTPUT = "Invalid JSON structure returned from AI"
UNAVAILABLE = "The AI service is unavailable right now — please try again shortly"

ROADMAP_PROMPT = """Act as a senior technical learning advisor.
Generate a learning roadmap for someone who wants to learn "{goal}".
Their current skill level is "{level}" and they can dedicate {hours} hours per week.

Return the response ONLY as a raw JSON object with this structure:
{{
  "estimatedDuration": "X weeks",
  "steps": [
    {{
      "stepNumber": 1,
      "title": "Topic Name",
      "description": "Brief description of what to learn",
      "duration": "Y weeks",
      "resources": ["Keyword or Site 1", "Keyword 2"]
    }}
  ]
}}
Make sure the JSON is valid and contains no markdown formatting like ```json."""

# Quick-action lenses for the mentor overlay. Default "explain" keeps the four-section deep dive;
# the others re-angle the same step.
EXPLAIN_MODES = {
    "explain": lambda goal: f"""
    Explain this step in markdown with EXACTLY these four sections:
    ## What it really is
    ## Why it matters for {goal}
    ## How to practice this week
    ## Watch out
    """,
    "simplify": lambda goal: """
    Explain this step as if to a curious 12-year-old. Markdown with EXACTLY these sections:
    ## The simple version
    ## A picture in words
    ## Try this
    Use everyday words only — no jargon unless you immediately define it.
    """,
    "example": lambda goal: f"""
    Show ONE concrete practical example of this step applied to "{goal}". Markdown with EXACTLY these sections:
    ## The scenario
    ## Step by step
    ## What you'd have at the end
    Be specific: real tool names, realistic inputs and outputs, no vague hand-waving.
    """,
    "analogy": lambda goal: """
    Explain this step through ONE real-world analogy carried all the way through. Markdown with EXACTLY these sections:
    ## The analogy
    ## How it maps
    ## Where the analogy breaks
    """,
}

EXPLAIN_PROMPT = """
    Act as a friendly senior mentor. Your student is learning "{goal}" (current level: {level})
    and has reached the roadmap step "{title}": {description}
    {sections}
    ## Watch & read
    End with this section: ONE flat list of "- " bullets (no sub-bullets, no group labels), each a markdown link —
    2 YouTube picks first, then the 2-3 best websites to study this step.
    - YouTube: name a well-known channel that teaches this well and link a YouTube SEARCH (never a video id), like
      [▶ <topic> — <channel>](https://www.youtube.com/results?search_query=<channel>+<topic+words>)
    - Websites: only well-known sites you are sure exist (official docs, MDN, freeCodeCamp, GeeksforGeeks, W3Schools,
      Real Python, Kaggle Learn, Khan Academy, ...), linking the homepage or documentation home, never a guessed deep
      link, plus a few words on why, like [MDN Web Docs](https://developer.mozilla.org/) — clear reference with examples
    Keep the whole answer under 300 words. Use short paragraphs and "- " bullets,
    bold the key terms with **double asterisks**, and speak directly to the student as "you".
    No preamble, no code fences, no headings other than the ones listed above.
    """

ENHANCE_PROMPT = """A learner typed this learning goal: "{goal}".
Rewrite it as ONE richer, more specific learning goal (25 words max) naming the key sub-topics worth covering.
Return ONLY the rewritten goal text — no quotes, no preamble, no explanations."""


class AIError(Exception):
    """Any AI failure. The message is safe to show users; details go to the server log."""


def stream_text(prompt, *, temperature):
    """Yield the model's answer text as it streams (Groq sends OpenAI-style `data: {...}` lines).
    The model's hidden reasoning arrives in `delta.reasoning` and is skipped."""
    if not settings.GROQ_API_KEY:
        raise AIError("AI service is not configured")
    body = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "reasoning_effort": "low",  # think briefly, answer fast
        "stream": True,
    }
    headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}"}
    try:
        with requests.post(GROQ_URL, json=body, headers=headers, stream=True, timeout=(10, 120)) as response:
            if response.status_code == 429:
                logger.warning("Groq rate limit hit: %s", response.text[:500])
                raise AIError("The AI service is busy right now — please try again in a minute")
            if not response.ok:
                logger.error("Groq request failed: %s %s", response.status_code, response.text[:500])
                raise AIError(UNAVAILABLE)
            for line in response.iter_lines():
                if not line.startswith(b"data: ") or line == b"data: [DONE]":
                    continue
                choices = json.loads(line[6:]).get("choices") or [{}]
                if text := (choices[0].get("delta") or {}).get("content"):
                    yield text
    except (requests.RequestException, ValueError) as exc:  # network failure or a garbled stream line
        logger.exception("Groq request failed")
        raise AIError(UNAVAILABLE) from exc


def _text(value, limit):
    return str(value or "").strip()[:limit]


def parse_roadmap(text):
    """Validate and normalise AI output. Raises AIError instead of letting bad data reach the DB."""
    start, end = text.find("{"), text.rfind("}")  # tolerate ```json fences or a sentence around the JSON
    try:
        data = json.loads(text[start : end + 1])
    except json.JSONDecodeError as exc:  # no JSON at all, or output cut off mid-way
        raise AIError(BAD_OUTPUT) from exc
    steps = data.get("steps") if isinstance(data, dict) else None
    if not isinstance(steps, list) or not 1 <= len(steps) <= MAX_STEPS:
        raise AIError(BAD_OUTPUT)
    clean_steps = []
    for number, step in enumerate(steps, start=1):  # renumber; never trust AI numbering
        if not isinstance(step, dict) or not _text(step.get("title"), 200):
            raise AIError(BAD_OUTPUT)
        resources = step.get("resources") or []
        if not isinstance(resources, list):
            raise AIError(BAD_OUTPUT)
        clean_steps.append(
            {
                "number": number,
                "title": _text(step["title"], 200),
                "description": _text(step.get("description"), 2000),
                "duration": _text(step.get("duration"), 50),
                "resources": [r for r in (_text(r, 200) for r in resources) if r][:10],
            }
        )
    return {"estimated_duration": _text(data.get("estimatedDuration"), 50), "steps": clean_steps}


def complete_steps(text):
    """Every COMPLETE step object in partial JSON text. String-aware brace matching, so braces
    inside descriptions don't break it (port of parseCompleteSteps)."""
    key = text.find('"steps"')
    start = text.find("[", key) if key != -1 else -1
    if start == -1:
        return []
    steps, depth, obj_start, in_string, escaped = [], 0, -1, False, False
    for i in range(start + 1, len(text)):
        ch = text[i]
        if escaped:
            escaped = False
        elif ch == "\\":
            escaped = True
        elif ch == '"':
            in_string = not in_string
        elif in_string:
            continue
        elif ch == "{":
            if depth == 0:
                obj_start = i
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and obj_start != -1:
                try:
                    steps.append(json.loads(text[obj_start : i + 1]))
                except json.JSONDecodeError:
                    pass  # closed but not valid JSON yet — skip until more text arrives
                obj_start = -1
        elif ch == "]" and depth == 0:
            break
    return steps


def roadmap_events(goal, level, weekly_hours):
    """Yield {"type": "meta"|"step"} events as the JSON takes shape, then {"type": "complete", "data": ...}."""
    text, emitted, meta_sent = "", 0, False
    prompt = ROADMAP_PROMPT.format(goal=goal, level=level, hours=weekly_hours)
    for delta in stream_text(prompt, temperature=0.3):
        text += delta
        if not meta_sent and (match := re.search(r'"estimatedDuration"\s*:\s*"([^"]*)"', text)):
            meta_sent = True
            yield {"type": "meta", "estimatedDuration": match.group(1)}
        steps = complete_steps(text)  # ponytail: rescans the whole text per delta; fine for ~5 KB of JSON
        while emitted < len(steps):
            yield {"type": "step", "step": steps[emitted], "index": emitted}
            emitted += 1
    yield {"type": "complete", "data": parse_roadmap(text)}


def generate_roadmap(goal, level, weekly_hours):
    events = list(roadmap_events(goal, level, weekly_hours))
    return events[-1]["data"]


def explanation_stream(roadmap, step, mode="explain"):
    sections = EXPLAIN_MODES.get(mode, EXPLAIN_MODES["explain"])(roadmap.goal)
    prompt = EXPLAIN_PROMPT.format(
        goal=roadmap.goal, level=roadmap.level, title=step.title, description=step.description, sections=sections
    )
    return stream_text(prompt, temperature=0.5)


def enhance_goal(goal):
    text = "".join(stream_text(ENHANCE_PROMPT.format(goal=goal), temperature=0.4)).strip()
    return text.strip("\"'")
