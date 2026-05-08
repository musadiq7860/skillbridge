from fastapi import APIRouter
from fastapi.responses import Response
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from services.ai_coach import get_coach_response

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


# ── Request model ────────────────────────────────────────────────────────────

class MessageItem(BaseModel):
    sender_id: str
    content: str


class CoachRequest(BaseModel):
    session_id: str
    messages: list[MessageItem]
    message_count: int


# ── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/coach")
async def coach(payload: CoachRequest) -> Response:
    """
    Stream the AI Coach response via Server-Sent Events.
    Only fires when message_count is divisible by 4 (every 4th message).
    Returns 204 No Content when the coach is not due to speak.
    """
    if payload.message_count % 4 != 0 or payload.message_count == 0:
        return Response(status_code=204)

    messages_dicts: list[dict] = [
        {"sender_id": m.sender_id, "content": m.content}
        for m in payload.messages
    ]

    async def event_generator():
        async for chunk in get_coach_response(messages_dicts):
            yield {"data": chunk}
        # Signal stream completion to the client
        yield {"data": "[DONE]"}

    return EventSourceResponse(event_generator())
