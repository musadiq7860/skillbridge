njnjnj;;.;.;;.;.# SkillBridge

🌐 **Live Demo:** [https://skillbridge9.vercel.app/](https://skillbridge9.vercel.app/)
 n n n n n n n n n n n n n 
A full-stack community web app where users post skills they can teach or want to learn. An ML embedding model matches teachers with learners in real-time using semantic similarity (pgvector cosine search). When matched, both users enter a live chat room where an AI Coach (Groq LLaMA 3.3 70B) observes and jumps in every 4th message to clarify, give examples, or suggest free resources.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 App Router + TypeScript + Tailwind CSS |
| Backend | FastAPI + Python 3.11 |
| Database | Supabase (PostgreSQL + pgvector + Realtime) |
| Auth | Supabase Auth (email/password) |
| ML Model | sentence-transformers `all-MiniLM-L6-v2` (384-dim) |
| LLM | Groq API `llama-3.3-70b-versatile` |
| Automation | n8n (daily digest emails + weekly skill gap reports) |
| Deployment | Vercel (frontend) + HuggingFace Spaces (backend) |

## Project Structure

```
skillbridge/
├── frontend/          # Next.js 14 App Router
│   ├── app/
│   ├── components/
│   └── lib/
├── backend/           # FastAPI
│   ├── routes/
│   ├── services/
│   └── db/
```

## How It Works

1. User posts a skill they need → FastAPI embeds the text into a 384-dim vector
2. pgvector cosine similarity runs against all offered skills in Supabase
3. If best match score > 0.5 → a match is created and both users are notified via Supabase Realtime
4. Users open a live chat session — every 4th message, the AI Coach streams a response via SSE
5. n8n automation sends daily digest emails of unmatched needs and weekly skill gap reports

## Local Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
cp .env.example .env        # fill in your keys
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in your keys
npm run dev
```

## Environment Variables

### `backend/.env`
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
GROQ_API_KEY=
```

### `frontend/.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```


