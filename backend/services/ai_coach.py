import os
from typing import AsyncGenerator
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

# Initialized once at module level — never per request
_groq_client: AsyncGroq = AsyncGroq(api_key=os.environ["GROQ_API_KEY"])

_SYSTEM_PROMPT: str = (
    "You are an AI Coach passively observing a live peer skill-sharing session "
    "on SkillBridge between a teacher and a learner. You intervene occasionally to:\n"
    "- Clarify concepts that seem unclear\n"
    "- Provide concrete, real-world examples\n"
    "- Suggest free learning resources (YouTube, freeCodeCamp, MDN, Khan Academy, etc.)\n\n"
    "Keep responses concise (3–5 sentences). Be encouraging and practical. "
    "Do not repeat what has already been said."
)


def build_coach_prompt(messages: list[dict]) -> list[dict]:
    """
    Format the recent chat history into Groq's message list format,
    prefixed with the AI Coach system prompt.
    """
    formatted: list[dict] = [{"role": "system", "content": _SYSTEM_PROMPT}]
    for msg in messages:
        sender: str = msg.get("sender_id", "user")
        content: str = msg.get("content", "")
        # Coach's own past messages map to 'assistant'; all others to 'user'
        role: str = "assistant" if sender == "ai_coach" else "user"
        formatted.append({"role": role, "content": f"[{sender}]: {content}"})
    return formatted


async def get_coach_response(
    messages: list[dict],
) -> AsyncGenerator[str, None]:
    """
    Stream a Groq LLaMA 3.3 70B response for the AI Coach.
    Always uses stream=True — never buffers the full response.
    """
    prompt = build_coach_prompt(messages)
    stream = await _groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=prompt,
        stream=True,
        max_tokens=300,
    )
    async for chunk in stream:
        content: str | None = chunk.choices[0].delta.content
        if content:
            yield content
