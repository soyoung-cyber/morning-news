import os
from supabase import create_client, Client


def get_client() -> Client:
    url = os.environ['SUPABASE_URL']
    key = os.environ['SUPABASE_KEY']
    return create_client(url, key)


def save_articles(articles: list[dict]) -> int:
    if not articles:
        return 0

    client = get_client()
    saved = 0

    for article in articles:
        try:
            client.table('articles').upsert(
                article,
                on_conflict='url'
            ).execute()
            saved += 1
        except Exception as e:
            print(f"  Failed to save '{article.get('title', '?')[:50]}': {e}")

    return saved
