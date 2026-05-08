from sentence_transformers import SentenceTransformer

# Loaded once at module import time — never reloaded per request
model: SentenceTransformer = SentenceTransformer("all-MiniLM-L6-v2")


def encode_text(title: str, description: str = "") -> list[float]:
    """Encode a skill title + description into a 384-dim normalized vector."""
    text: str = f"{title} {description}".strip()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()
