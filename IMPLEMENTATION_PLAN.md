# SkillBridge — Implementation Plan

## Tech Stack
- **Frontend:** Next.js 14 App Router + TypeScript + Tailwind CSS → Vercel
- **Backend:** FastAPI + Python 3.11 → HuggingFace Spaces (Docker, port 7860)
- **Database:** Supabase (PostgreSQL + pgvector + Realtime WebSockets)
- **Auth:** Supabase Auth (email/password)
- **ML:** sentence-transformers `all-MiniLM-L6-v2` (384-dim embeddings)
- **LLM:** Groq API `llama-3.3-70b-versatile`
- **Automation:** n8n on Railway

---

## Folder Structure
```
skillbridge/
├── .github/
│   └── copilot-instructions.md
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── chat/[sessionId]/page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── SkillCard.tsx
│   │   ├── MatchNotification.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── AiCoachBubble.tsx
│   │   └── SkillForm.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── api.ts
│   └── .env.local
├── backend/
│   ├── main.py
│   ├── routes/
│   │   ├── skills.py
│   │   ├── matches.py
│   │   └── chat.py
│   ├── services/
│   │   ├── embedder.py
│   │   ├── matcher.py
│   │   └── ai_coach.py
│   ├── db/
│   │   └── supabase_client.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env
└── README.md
```

---

## Supabase Schema
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  name TEXT,
  avatar_url TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE skills_offered (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  embedding vector(384),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE skills_needed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  embedding vector(384),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id),
  learner_id UUID REFERENCES profiles(id),
  skill_offered_id UUID REFERENCES skills_offered(id),
  skill_needed_id UUID REFERENCES skills_needed(id),
  score FLOAT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id),
  sender_id TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- For n8n weekly report (Step 27)
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION match_skills(
  query_embedding vector(384),
  exclude_user UUID,
  match_count INT DEFAULT 3
)
RETURNS TABLE(id UUID, user_id UUID, title TEXT, description TEXT, similarity FLOAT)
AS $$
  SELECT id, user_id, title, description,
    1 - (embedding <=> query_embedding) AS similarity
  FROM skills_offered
  WHERE user_id != exclude_user AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql STABLE;
```

---

## Environment Variables

### `frontend/.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### `backend/.env`
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
GROQ_API_KEY=
```

---

## Key Rules
- All Python functions must have type hints
- All async — no blocking calls anywhere
- sentence-transformers model loaded ONCE at startup into app state, never per request
- Groq always uses stream=True — never wait for full response
- Supabase backend calls use service role key, frontend uses anon key
- pgvector similarity done in SQL via RPC — never in Python
- Only create a match if similarity score > 0.5
- AI Coach triggers every 4th message only
- Supabase Realtime subscriptions always cleaned up on component unmount
- CORS in FastAPI must allow Vercel URL + localhost:3000
- Dockerfile must expose port 7860 (HuggingFace Spaces requirement)
- Next.js uses App Router only — no Pages Router
- "use client" only when hooks or interactivity needed

---

## Build Order

### Phase 1 — Backend Foundation
| Step | File | Status |
|------|------|--------|
| 1 | `backend/.env` + `backend/db/supabase_client.py` | ✅ Done |
| 2 | `backend/services/embedder.py` | ✅ Done |
| 3 | `backend/services/matcher.py` | ✅ Done |
| 4 | `backend/services/ai_coach.py` | ✅ Done |
| 5 | `backend/routes/skills.py` | ✅ Done |
| 6 | `backend/routes/matches.py` | ✅ Done |
| 7 | `backend/routes/chat.py` | ✅ Done |
| 8 | `backend/main.py` | ✅ Done |
| 9 | `backend/Dockerfile` | ✅ Done |

### Phase 2 — Frontend Foundation
| Step | File | Status |
|------|------|--------|
| 10 | `frontend/lib/supabase.ts` | ⬜ Not started |
| 11 | `frontend/lib/api.ts` | ⬜ Not started |
| 12 | `frontend/app/layout.tsx` | ⬜ Not started |
| 13 | `frontend/app/(auth)/register/page.tsx` | ⬜ Not started |
| 14 | `frontend/app/(auth)/login/page.tsx` | ⬜ Not started |

### Phase 3 — Core Features
| Step | File | Status |
|------|------|--------|
| 15 | `frontend/components/SkillForm.tsx` | ⬜ Not started |
| 16 | `frontend/app/profile/page.tsx` | ⬜ Not started |
| 17 | `frontend/components/SkillCard.tsx` | ⬜ Not started |
| 18 | `frontend/components/MatchNotification.tsx` | ⬜ Not started |
| 19 | `frontend/app/dashboard/page.tsx` | ⬜ Not started |

### Phase 4 — Chat + AI Coach
| Step | File | Status |
|------|------|--------|
| 20 | `frontend/components/AiCoachBubble.tsx` | ⬜ Not started |
| 21 | `frontend/components/ChatWindow.tsx` | ⬜ Not started |
| 22 | `frontend/app/chat/[sessionId]/page.tsx` | ⬜ Not started |

### Phase 5 — Deployment
| Step | Action | Status |
|------|--------|--------|
| 23 | Deploy backend → HuggingFace Spaces | ⬜ Not started |
| 24 | Deploy frontend → Vercel | ⬜ Not started |
| 25 | Update all env vars with production URLs | ⬜ Not started |

### Phase 6 — n8n Automation
| Step | Workflow | Status |
|------|----------|--------|
| 26 | Daily digest email | ⬜ Not started |
| 27 | Weekly skill gap report | ⬜ Not started |

---

## Detailed Step Notes

### Step 1 — `backend/db/supabase_client.py`
- Singleton Supabase client using service role key
- `get_supabase_client() -> Client` returns cached instance
- Loads `.env` via `python-dotenv`; raises immediately if vars missing

### Step 2 — `backend/services/embedder.py`
- `model = SentenceTransformer("all-MiniLM-L6-v2")` at module level (loaded once)
- `encode_text(title, description) -> list[float]` — concatenates then encodes
- Returns `list[float]` (JSON-serializable, pgvector-compatible)

### Step 3 — `backend/services/matcher.py`
- `find_matches(embedding, exclude_user, count) -> list[dict]` — calls `match_skills` RPC
- `create_match_if_qualified(teacher_skill, learner_skill_id, learner_id) -> dict | None`
  - Returns `None` if similarity ≤ 0.5
  - Inserts into `matches` then immediately creates `chat_sessions` row

### Step 4 — `backend/services/ai_coach.py`
- `AsyncGroq` client at module level
- `build_coach_prompt(messages) -> list[dict]` — formats history for Groq
- `get_coach_response(messages) -> AsyncGenerator[str, None]` — streams with `stream=True`
- System prompt positions AI as observer who clarifies, gives examples, suggests free resources

### Step 5 — `backend/routes/skills.py`
- `POST /api/v1/skills/offer` — embed + store in `skills_offered`
- `POST /api/v1/skills/need` — embed + store → run matcher → if match > 0.5, create match + chat session → return in response
- Pydantic models: `SkillOfferRequest`, `SkillNeedRequest`, `SkillResponse`

### Step 6 — `backend/routes/matches.py`
- `GET /api/v1/matches/{user_id}` — returns all matches (teacher or learner)
- Joins with profiles + skill titles + chat_session_id
- Filter: `status != 'rejected'`

### Step 7 — `backend/routes/chat.py`
- `POST /api/v1/chat/coach` — SSE endpoint using `sse-starlette`
- Body: `{session_id, messages[], message_count}`
- Returns 204 if `message_count % 4 != 0`
- Streams Groq response as SSE events otherwise

### Step 8 — `backend/main.py`
- Mounts all routers
- CORS: Vercel URL + `localhost:3000`
- Startup event: imports embedder to trigger model load
- Health check: `GET /health`
- `uvicorn` on `0.0.0.0:7860`

### Step 9 — `backend/Dockerfile`
- Base: `python:3.11-slim`
- `EXPOSE 7860`
- `.env` NOT copied — set as HF Spaces secrets

### Steps 10–14 — Frontend Foundation
- Two Supabase clients: browser (`createBrowserClient`) + server (`createServerClient`)
- Typed fetch helpers in `api.ts` including SSE stream reader
- Auth token attached to all backend requests
- Register: `signUp()` + insert into `profiles`
- Login: `signInWithPassword()` + redirect to `/dashboard`

### Steps 15–19 — Core Features
- `SkillForm`: reusable, `type: "offer"|"need"`, calls backend on submit
- `MatchNotification`: Supabase Realtime on `matches` table, cleaned up on unmount
- `dashboard`: public skill feed + live notifications

### Steps 20–22 — Chat
- `AiCoachBubble`: distinct styling, streaming cursor animation
- `ChatWindow`: Realtime messages + SSE coach stream every 4th message
- Message insert goes directly to Supabase (not backend)
- Chat page validates user is match participant (security check)

### Steps 23–25 — Deployment
- HF Spaces: Docker SDK, port 7860, env vars as Spaces secrets
- Vercel: connect GitHub, set env vars, add production URL to Supabase auth + backend CORS

### Steps 26–27 — n8n
- Daily digest: Cron → query unmatched needs → Groq → Gmail
- Weekly report: Cron → query all skills → Groq analysis → insert into `reports` → Gmail
- Both skip if no data (IF node guard)
