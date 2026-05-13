from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from db.supabase_client import supabase_rest_call
from services.embedder import encode_text
from services.matcher import find_matches, create_match_if_qualified

router = APIRouter(prefix="/api/v1/skills", tags=["skills"])


# ── Request / Response models ────────────────────────────────────────────────

class SkillOfferRequest(BaseModel):
    user_id: str
    title: str
    description: str = ""


class SkillNeedRequest(BaseModel):
    user_id: str
    title: str
    description: str = ""


class SkillResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: str
    match: dict | None = None


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/offer", response_model=SkillResponse, status_code=201)
async def post_skill_offer(payload: SkillOfferRequest) -> SkillResponse:
    """
    Encode the offered skill and store it with its embedding vector.
    This makes it discoverable by future pgvector similarity searches.
    """
    try:
        embedding: list[float] = encode_text(payload.title, payload.description)

        data = supabase_rest_call("POST", "skills_offered", {
            "user_id": payload.user_id,
            "title": payload.title,
            "description": payload.description,
            "embedding": embedding,
        })
        
        if not data:
            raise HTTPException(status_code=500, detail="Failed to store skill offer: No data returned")
        row: dict = data[0]
        return SkillResponse(
            id=row["id"],
            user_id=row["user_id"],
            title=row["title"],
            description=row["description"] or "",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error in offer: {str(e)}")


@router.post("/need", response_model=SkillResponse, status_code=201)
async def post_skill_need(payload: SkillNeedRequest) -> SkillResponse:
    """
    Encode the needed skill, store it, then immediately run the ML matching loop:
    1. pgvector cosine search against skills_offered
    2. If best match score > 0.5 → create match + chat session
    3. Return the new skill row plus match info (if any) so the frontend
       can redirect the user directly to their chat room.
    """
    try:
        embedding: list[float] = encode_text(payload.title, payload.description)

        data = supabase_rest_call("POST", "skills_needed", {
            "user_id": payload.user_id,
            "title": payload.title,
            "description": payload.description,
            "embedding": embedding,
        })
        
        if not data:
            raise HTTPException(status_code=500, detail="Failed to store skill need: No data returned")
        row: dict = data[0]

        # ── ML matching loop ─────────────────────────────────────────────────────
        matches: list[dict] = await find_matches(
            query_embedding=embedding,
            exclude_user=payload.user_id,
            match_count=3,
        )

        best_match: dict | None = None
        if matches:
            best_match = await create_match_if_qualified(
                teacher_skill=matches[0],
                learner_skill_id=row["id"],
                learner_id=payload.user_id,
            )

        return SkillResponse(
            id=row["id"],
            user_id=row["user_id"],
            title=row["title"],
            description=row["description"] or "",
            match=best_match,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error in need: {str(e)}")
