import os
from dotenv import load_dotenv

load_dotenv()

from sources.rss import collect_rss
from sources.hackernews import collect_hn
from sources.reddit import collect_reddit
from sources.youtube import collect_youtube
from sources.newsapi import collect_newsapi
from db import save_articles


DESIGN_KEYWORDS = {
    # Motion & animation — EO 핵심
    'motion', 'animation', 'after effects', 'cinema 4d', 'blender',
    'showreel', 'vfx', 'compositing', 'mograph', 'kinetic',
    'infographic', 'lower third', 'title sequence', 'explainer',
    # AI video & tools
    'ai video', 'ai animation', 'runway', 'sora', 'kling', 'pika',
    'luma', 'generative video', 'text to video', 'video generation',
    # Graphic design & typography
    'graphic', 'typography', 'branding', 'brand identity', 'logo',
    'poster', 'illustration', 'visual design', 'art direction',
    'creative direction', 'font', 'lettering', 'thumbnail',
    # Tools
    'adobe', 'illustrator', 'photoshop', 'premiere', 'davinci',
    'generative art', 'ai art', 'design tool', 'design trend',
    'school of motion', 'plugin',
}


def _is_english(text: str) -> bool:
    """Filter out non-English titles by checking ASCII character ratio."""
    if not text:
        return False
    ascii_count = sum(1 for c in text if ord(c) < 128)
    return ascii_count / len(text) > 0.85


def _is_relevant_design(article: dict) -> bool:
    """For design category, only keep graphic/motion design content."""
    if article.get('category') != 'design':
        return True
    title_lower = article.get('title', '').lower()
    summary_lower = article.get('summary', '') or ''
    summary_lower = summary_lower.lower()
    return any(kw in title_lower or kw in summary_lower for kw in DESIGN_KEYWORDS)


def main():
    print("Starting news collection...\n")

    all_articles = []

    collectors = [
        ("RSS Feeds", collect_rss),
        ("Hacker News", collect_hn),
        ("Reddit", collect_reddit),
        ("YouTube", collect_youtube),
        ("NewsAPI", collect_newsapi),
    ]

    for name, collector in collectors:
        try:
            articles = collector()
            print(f"  {name}: {len(articles)} articles")
            all_articles.extend(articles)
        except Exception as e:
            print(f"  {name}: ERROR — {e}")

    # Filter: English titles only + relevant design content
    all_articles = [
        a for a in all_articles
        if _is_english(a.get('title', '')) and _is_relevant_design(a)
    ]

    # Deduplicate by URL
    seen_urls = set()
    unique_articles = []
    for article in all_articles:
        if article['url'] not in seen_urls:
            seen_urls.add(article['url'])
            unique_articles.append(article)

    print(f"\nTotal unique articles: {len(unique_articles)}")

    saved = save_articles(unique_articles)
    print(f"Saved {saved} new articles to database")


if __name__ == '__main__':
    main()
