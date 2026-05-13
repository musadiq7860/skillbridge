from db.supabase_client import supabase_rest_call

MATCH_THRESHOLD: float = 0.5


async def find_matches(
    query_embedding: list[float],
    exclude_user: str,
    match_count: int = 3,
) -> list[dict]:
    """
    Call the pgvector RPC function to find top matching skills_offered rows
    for a given query embedding. All cosine similarity is computed in SQL.
    """
    data = supabase_rest_call(
        "POST", 
        "rpc/match_skills", 
        {
            "query_embedding": query_embedding,
            "exclude_user": exclude_user,
            "match_count": match_count,
        }
    )
    return data or []


async def create_match_if_qualified(
    teacher_skill: dict,
    learner_skill_id: str,
    learner_id: str,
) -> dict | None:
    """
    Insert a match + chat_session row only when similarity exceeds the threshold.
    Returns the match dict with an added `chat_session_id` field, or None.
    """
    if teacher_skill.get("similarity", 0) <= MATCH_THRESHOLD:
        return None

    match_data = supabase_rest_call(
        "POST",
        "matches",
        {
            "teacher_id": teacher_skill["user_id"],
            "learner_id": learner_id,
            "skill_offered_id": teacher_skill["id"],
            "skill_needed_id": learner_skill_id,
            "score": teacher_skill["similarity"],
            "status": "pending",
        }
    )

    match: dict = match_data[0]

    session_data = supabase_rest_call(
        "POST",
        "chat_sessions",
        {"match_id": match["id"]}
    )

    match["chat_session_id"] = session_data[0]["id"]
    return match
