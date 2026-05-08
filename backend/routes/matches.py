from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from db.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/v1/matches", tags=["matches"])


# ── Response model ───────────────────────────────────────────────────────────

class MatchResponse(BaseModel):
    id: str
    score: float
    status: str
    skill_offered_title: str
    skill_needed_title: str
    other_user_name: str
    other_user_id: str
    chat_session_id: str
    created_at: str


# ── Endpoint ─────────────────────────────────────────────────────────────────

@router.get("/{user_id}", response_model=list[MatchResponse])
async def get_matches(user_id: str) -> list[MatchResponse]:
    """
    Return all pending/accepted matches where the user is either teacher or
    learner. Joins with profiles, skills, and chat_sessions so the frontend
    has everything it needs to render the match card and navigate to the chat.
    """
    client = get_supabase_client()

    result = (
        client.table("matches")
        .select(
            "id, score, status, created_at, "
            "teacher_id, learner_id, "
            "skills_offered(title), "
            "skills_needed(title), "
            "chat_sessions(id)"
        )
        .or_(f"teacher_id.eq.{user_id},learner_id.eq.{user_id}")
        .neq("status", "rejected")
        .order("created_at", desc=True)
        .execute()
    )

    if not result.data:
        return []

    matches: list[MatchResponse] = []
    for row in result.data:
        # Determine which side the requesting user is on
        is_teacher: bool = row["teacher_id"] == user_id
        other_user_id: str = row["learner_id"] if is_teacher else row["teacher_id"]

        # Fetch the other user's profile name
        profile_result = (
            client.table("profiles")
            .select("name")
            .eq("id", other_user_id)
            .single()
            .execute()
        )
        other_name: str = (
            profile_result.data["name"] if profile_result.data else "Unknown"
        )

        # chat_sessions is a list (one-to-many relation) — take the first
        chat_sessions = row.get("chat_sessions") or []
        if not chat_sessions:
            continue
        chat_session_id: str = chat_sessions[0]["id"]

        matches.append(
            MatchResponse(
                id=row["id"],
                score=row["score"],
                status=row["status"],
                skill_offered_title=row["skills_offered"]["title"],
                skill_needed_title=row["skills_needed"]["title"],
                other_user_name=other_name,
                other_user_id=other_user_id,
                chat_session_id=chat_session_id,
                created_at=row["created_at"],
            )
        )

    return matches
