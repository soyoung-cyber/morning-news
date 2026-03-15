import requests
from datetime import datetime, timezone

HN_API = 'https://hacker-news.firebaseio.com/v0'

DESIGN_WORDS = {'graphic design', 'motion graphics', 'motion design', 'typography', 'branding', 'brand identity', 'illustrator', 'after effects', 'cinema 4d', 'blender', 'visual design', 'generative art', 'ai art', 'adobe'}
STARTUP_WORDS = {'startup', 'funding', 'raise', 'raised', 'vc', 'series a', 'series b', 'seed', 'launch', 'launched', 'yc', 'y combinator'}


def _categorize(title: str) -> str:
    t = title.lower()
    if any(w in t for w in DESIGN_WORDS):
        return 'design'
    if any(w in t for w in STARTUP_WORDS):
        return 'startup'
    return 'it'


def collect_hn() -> list[dict]:
    articles = []

    resp = requests.get(f'{HN_API}/topstories.json', timeout=10)
    resp.raise_for_status()
    story_ids = resp.json()[:60]

    for story_id in story_ids:
        try:
            story = requests.get(f'{HN_API}/item/{story_id}.json', timeout=5).json()

            if not story or story.get('type') != 'story':
                continue
            if not story.get('url'):
                continue
            if story.get('score', 0) < 50:
                continue

            articles.append({
                'title': story['title'][:500],
                'url': story['url'],
                'summary': f"{story.get('score', 0)} points · {story.get('descendants', 0)} comments on Hacker News",
                'source': 'Hacker News',
                'category': _categorize(story['title']),
                'image_url': None,
                'published_at': datetime.fromtimestamp(story['time'], tz=timezone.utc).isoformat(),
            })
        except Exception:
            pass

    return articles
