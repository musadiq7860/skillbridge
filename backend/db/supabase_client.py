import os
import httpx
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY: str = os.environ["SUPABASE_SERVICE_KEY"]

def supabase_rest_call(method: str, endpoint: str, json_data: dict = None) -> list | dict:
    """
    Directly call Supabase REST API using httpx.
    Bypasses the buggy supabase-py client entirely.
    """
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    # Disable proxies explicitly to avoid HF Space proxy issues
    with httpx.Client(proxies=None) as client:
        response = client.request(method, url, headers=headers, json=json_data)
        response.raise_for_status()
        return response.json()

_client: Client | None = None

def get_supabase_client() -> Client:
    """Return a cached Supabase client using the service role key."""
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _client

