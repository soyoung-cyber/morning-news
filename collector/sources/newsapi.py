import os
import requests
from datetime import datetime, timezone, timedelta

QUERIES = {
    'design': '"motion graphics" OR "motion design" OR "AI video" OR "AI animation" OR "After Effects" OR "Runway ML" OR "generative video" OR "brand identity" OR "graphic design" OR "visual effects" OR "Adobe Firefly"',
    'it': 'technology OR "artificial intelligence" OR cybersecurity OR "machine learning"',
    'startup': 'startup OR "Series A" OR "venture capital" OR "Y Combinator" OR "tech company"',
}


def collect_newsapi() -> list[dict]:
    api_key = os.environ.get('NEWSAPI_KEY')
    if not api_key:
        print("    No NEWSAPI_KEY set, skipping")
        return []

    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime('%Y-%m-%d')
    articles = []

    for category, query in QUERIES.items():
        try:
            resp = requests.get(
                'https://newsapi.org/v2/everything',
                params={
                    'q': query,
                    'from': yesterday,
                    'language': 'en',
                    'sortBy': 'popularity',
                    'pageSize': 10,
                    'apiKey': api_key,
                    'domains': 'techcrunch.com,theverge.com,wired.com,arstechnica.com,technologyreview.com,venturebeat.com,fastcompany.com,businessinsider.com,cnbc.com,bloomberg.com,forbes.com,inc.com',
                },
                timeout=10
            )
            resp.raise_for_status()
            data = resp.json()

            for item in data.get('articles', []):
                if item.get('title') in ('[Removed]', None):
                    continue

                articles.append({
                    'title': item['title'][:500],
                    'url': item['url'],
                    'summary': item.get('description', '')[:300] or None,
                    'source': item['source']['name'],
                    'category': category,
                    'image_url': item.get('urlToImage'),
                    'published_at': item.get('publishedAt', datetime.now(timezone.utc).isoformat()),
                })
        except Exception as e:
            print(f"    NewsAPI error ({category}): {e}")

    return articles
