import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Hugging Face Spaces inject proxy env vars which break older supabase-py clients
for key in ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"]:
    os.environ.pop(key, None)

SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY: str = os.environ["SUPABASE_SERVICE_KEY"]

_client: Client | None = None


def get_supabase_client() -> Client:
    """Return a cached Supabase client using the service role key."""
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _client
