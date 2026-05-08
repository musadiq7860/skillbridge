import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import skills, matches, chat

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Load the sentence-transformers model once at startup.
    Importing embedder triggers the module-level SentenceTransformer() call.
    """
    logger.info("Loading sentence-transformers model...")
    import services.embedder  # noqa: F401 — side-effect import triggers model load
    logger.info("Model ready. SkillBridge API is live.")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="SkillBridge API",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(skills.router)
app.include_router(matches.router)
app.include_router(chat.router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok"}


# ── Entry point (used by Dockerfile CMD) ─────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=7860, reload=False)
