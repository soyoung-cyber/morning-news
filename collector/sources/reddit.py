import requests
from datetime import datetime, timezone

SUBREDDITS = {
    'design': [
        'graphic_design',   # Graphic design trends
        'identitydesign',   # Brand identity
        'typography',       # Typography
        'motiondesign',     # Motion graphics
        'AfterEffects',     # Motion production
        'Cinema4D',         # 3D motion production
        'blender',          # 3D / motion
        'aivideo',          # AI-generated motion/video
    ],
    'it': ['technology', 'programming', 'webdev', 'MachineLearning', 'artificial'],
    'startup': ['startups', 'entrepreneur', 'SideProject', 'YCombinator'],
}

HEADERS = {'User-Agent': 'MorningBriefApp/1.0 (personal news aggregator)'}


def collect_reddit() -> list[dict]:
    articles = []

    for category, subreddits in SUBREDDITS.items():
        for subreddit in subreddits:
            try:
                url = f'https://www.reddit.com/r/{subreddit}/top.json?t=day&limit=5'
                resp = requests.get(url, headers=HEADERS, timeout=10)
                resp.raise_for_status()
                data = resp.json()

                for post in data['data']['children']:
                    p = post['data']

                    if p.get('score', 0) < 20:
                        continue

                    # Use external URL if available, otherwise link to Reddit post
                    link = p.get('url', '')
                    if not link or p.get('is_self') or 'reddit.com' in link:
                        link = f"https://reddit.com{p['permalink']}"

                    thumbnail = p.get('thumbnail', '')
                    image_url = thumbnail if thumbnail.startswith('http') else None

                    summary = p.get('selftext', '')[:300] or f"r/{subreddit} · {p.get('score', 0)} upvotes"

                    articles.append({
                        'title': p['title'][:500],
                        'url': link,
                        'summary': summary,
                        'source': f"r/{subreddit}",
                        'category': category,
                        'image_url': image_url,
                        'published_at': datetime.fromtimestamp(p['created_utc'], tz=timezone.utc).isoformat(),
                    })
            except Exception as e:
                print(f"    Reddit error (r/{subreddit}): {e}")

    return articles
