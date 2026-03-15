import re
import requests
import feedparser
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; MorningBriefBot/1.0)'}

RSS_FEEDS = {
    'design': [
        # Motion graphics & production
        # Motion graphics — EO 작업 직접 관련
        ('Motionographer', 'https://motionographer.com/feed/'),
        ('Motion Array Blog', 'https://motionarray.com/learn/feed/'),
        ('School of Motion', 'https://www.schoolofmotion.com/blog/rss.xml'),
        # Graphic design & visual culture
        ("It's Nice That", 'https://www.itsnicethat.com/rss'),
        ('Print Magazine', 'https://www.printmag.com/feed/'),
        ('Creative Bloq', 'https://www.creativebloq.com/rss'),
        # Design tools & AI
        ('Adobe Blog', 'https://blog.adobe.com/en/feed'),
        ('Muzli Design', 'https://muz.li/feed/'),
    ],
    'it': [
        ('TechCrunch', 'https://techcrunch.com/feed/'),
        ('The Verge', 'https://www.theverge.com/rss/index.xml'),
        ('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index'),
        ('Wired', 'https://www.wired.com/feed/rss'),
        ('MIT Technology Review', 'https://www.technologyreview.com/feed/'),
        ('VentureBeat', 'https://venturebeat.com/feed/'),
    ],
    'startup': [
        ('TechCrunch Startups', 'https://techcrunch.com/category/startups/feed/'),
        ('Product Hunt', 'https://www.producthunt.com/feed'),
        ('First Round Review', 'https://review.firstround.com/rss.xml'),
        ('Y Combinator Blog', 'https://www.ycombinator.com/blog/rss'),
        # VC firm blogs — funding news
        ('a16z', 'https://a16z.com/feed/'),
        ('Sequoia Capital', 'https://www.sequoiacap.com/articles/feed/'),
        ('NFX', 'https://www.nfx.com/feed/'),
        ('Lenny\'s Newsletter', 'https://www.lennysnewsletter.com/feed'),
    ],
}


def _parse_date(entry) -> str:
    for field in ['published', 'updated']:
        val = getattr(entry, field, None)
        if val:
            try:
                return parsedate_to_datetime(val).isoformat()
            except Exception:
                pass
    return datetime.now(timezone.utc).isoformat()


def _get_image(entry) -> str | None:
    if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
        return entry.media_thumbnail[0].get('url')
    if hasattr(entry, 'media_content') and entry.media_content:
        url = entry.media_content[0].get('url', '')
        if url.startswith('http'):
            return url
    return None


def collect_rss() -> list[dict]:
    articles = []

    for category, feeds in RSS_FEEDS.items():
        for source_name, url in feeds:
            try:
                resp = requests.get(url, headers=HEADERS, timeout=10)
                feed = feedparser.parse(resp.content)
                for entry in feed.entries[:10]:
                    summary = ''
                    if hasattr(entry, 'summary'):
                        summary = re.sub(r'<[^>]+>', '', entry.summary)[:300].strip()

                    articles.append({
                        'title': entry.title[:500],
                        'url': entry.link,
                        'summary': summary or None,
                        'source': source_name,
                        'category': category,
                        'image_url': _get_image(entry),
                        'published_at': _parse_date(entry),
                    })
            except Exception as e:
                print(f"    RSS error ({source_name}): {e}")

    return articles
