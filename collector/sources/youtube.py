import os
from datetime import datetime, timezone, timedelta
from googleapiclient.discovery import build

# General topic searches
SEARCHES = {
    'design': [
        # Kinetic typography & text motion — EO 핵심 작업
        'kinetic typography After Effects',
        'text animation After Effects tutorial',
        'typography motion design',
        # Infographic motion — EO 핵심 작업
        'infographic motion After Effects',
        'data visualization motion graphics',
        # Product/fundraising video style
        'product launch video motion graphics',
        'startup pitch video motion design',
        # After Effects tools & plugins
        'After Effects new plugin 2026',
        'After Effects new features update',
        # AI tools for motion
        'AI motion graphics tool 2026',
        'Runway ML new feature demo',
        'AI video generation new tool',
        # YouTube thumbnail trends
        'YouTube thumbnail design trend 2026',
        # Motion reference & showreels
        'motion graphics showreel 2026',
        'motion design breakdown process',
    ],
    'it': [
        'AI product launch 2026',
        'new AI tool demo',
        'AI startup product demo',
    ],
    'startup': [
        'Y Combinator demo day 2026',
        'tech startup product launch',
        'a16z portfolio company demo',
    ],
}

# Company-specific video searches — product demos, launches, funding announcements
COMPANY_SEARCHES = [
    # Design tools
    # AI video & motion tools
    {'query': 'Runway AI video new feature demo',             'category': 'design',  'company': 'Runway'},
    {'query': 'Pika AI video generation new',                 'category': 'design',  'company': 'Pika'},
    {'query': 'Luma AI video dream machine new',              'category': 'design',  'company': 'Luma AI'},
    {'query': 'Adobe After Effects new features update',      'category': 'design',  'company': 'Adobe'},
    {'query': 'Adobe Firefly video generation demo',          'category': 'design',  'company': 'Adobe'},
    {'query': 'DaVinci Resolve new features',                 'category': 'design',  'company': 'Blackmagic'},
    # AI & tech tools
    {'query': 'OpenAI Sora video generation new',             'category': 'it',      'company': 'OpenAI'},
    {'query': 'Anthropic Claude new feature demo',            'category': 'it',      'company': 'Anthropic'},
    {'query': 'Cursor AI coding new feature',                 'category': 'it',      'company': 'Cursor'},
    {'query': 'Vercel new product launch demo',               'category': 'it',      'company': 'Vercel'},
    {'query': 'Perplexity AI new feature update',             'category': 'it',      'company': 'Perplexity'},
    {'query': 'Replit new feature demo',                      'category': 'it',      'company': 'Replit'},
    # Startups
    {'query': 'Lovable app demo product',                     'category': 'startup', 'company': 'Lovable'},
    {'query': 'Linear app new update demo',                   'category': 'startup', 'company': 'Linear'},
    {'query': 'startup demo day Y Combinator 2026',           'category': 'startup', 'company': 'YC'},
    {'query': 'a16z portfolio company launch 2026',           'category': 'startup', 'company': 'a16z'},
    # AI / IT
    {'query': 'OpenAI product demo launch',            'category': 'it',      'company': 'OpenAI'},
    {'query': 'Anthropic Claude new feature',          'category': 'it',      'company': 'Anthropic'},
    {'query': 'Cursor AI coding demo',                 'category': 'it',      'company': 'Cursor'},
    {'query': 'Vercel new product launch',             'category': 'it',      'company': 'Vercel'},
    {'query': 'Perplexity AI new feature',             'category': 'it',      'company': 'Perplexity'},
    # Startups — product demos & funding
    {'query': 'Lovable app demo product',              'category': 'startup', 'company': 'Lovable'},
    {'query': 'Linear app new update demo',            'category': 'startup', 'company': 'Linear'},
    {'query': 'Notion new feature 2025',               'category': 'startup', 'company': 'Notion'},
    {'query': 'Loom new feature video',                'category': 'startup', 'company': 'Loom'},
    {'query': 'startup demo day Y Combinator 2025',    'category': 'startup', 'company': 'YC'},
    {'query': 'a16z portfolio company launch 2025',    'category': 'startup', 'company': 'a16z'},
]


def collect_youtube() -> list[dict]:
    api_key = os.environ.get('YOUTUBE_API_KEY')
    if not api_key:
        print("    No YOUTUBE_API_KEY set, skipping")
        return []

    youtube = build('youtube', 'v3', developerKey=api_key)
    articles = []

    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime('%Y-%m-%dT%H:%M:%SZ')
    week_ago  = (datetime.now(timezone.utc) - timedelta(days=7)).strftime('%Y-%m-%dT%H:%M:%SZ')

    # General topic searches (last 24h)
    for category, queries in SEARCHES.items():
        for query in queries:
            try:
                result = youtube.search().list(
                    q=query,
                    part='snippet',
                    type='video',
                    maxResults=3,
                    order='relevance',
                    publishedAfter=yesterday,
                    regionCode='US',
                    relevanceLanguage='en',
                ).execute()
                for item in result.get('items', []):
                    snippet = item['snippet']
                    video_id = item['id']['videoId']
                    articles.append({
                        'title': snippet['title'][:500],
                        'url': f"https://www.youtube.com/watch?v={video_id}",
                        'summary': snippet.get('description', '')[:300] or None,
                        'source': f"YouTube · {snippet['channelTitle']}",
                        'category': category,
                        'image_url': snippet['thumbnails']['medium']['url'],
                        'published_at': snippet['publishedAt'],
                    })
            except Exception as e:
                print(f"    YouTube error ({query}): {e}")

    # Company-specific searches (last 7 days — to catch recent launches)
    for item in COMPANY_SEARCHES:
        try:
            result = youtube.search().list(
                q=item['query'],
                part='snippet',
                type='video',
                maxResults=2,
                order='date',          # Most recent first
                publishedAfter=week_ago,
                regionCode='US',
                relevanceLanguage='en',
            ).execute()
            for r in result.get('items', []):
                snippet = r['snippet']
                video_id = r['id']['videoId']
                articles.append({
                    'title': snippet['title'][:500],
                    'url': f"https://www.youtube.com/watch?v={video_id}",
                    'summary': snippet.get('description', '')[:300] or None,
                    'source': f"YouTube · {snippet['channelTitle']}",
                    'category': item['category'],
                    'image_url': snippet['thumbnails']['medium']['url'],
                    'published_at': snippet['publishedAt'],
                    'company': item['company'],   # extra tag (ignored by DB, just for filtering)
                })
        except Exception as e:
            print(f"    YouTube company error ({item['company']}): {e}")

    return articles
