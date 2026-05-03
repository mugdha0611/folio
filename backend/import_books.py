"""
Folio Book Import Script
Parses Book list.md and imports all books via Open Library API + Folio backend
"""

import re
import time
import httpx

# --- Emoji to month mapping ---
EMOJI_MONTH = {
    "💀": 1,   # January
    "🥹": 2,   # February
    "😎": 3,   # March
    "😩": 4,   # April
    "🫡": 5,   # May
    "✨": 6,   # June
    "🦕": 7,   # July
    "🌱": 8,   # August
    "🎀": 9,   # September
    "🎃": 10,  # October
    "🌊": 11,  # November
    "❄️": 12,  # December
    "🚮": None, # no judgement read (no month override)
    "🔁": None, # re-read (no month override)
}

FOLIO_API = "http://localhost:8000"


def extract_month_year(text, year):
    """Extract month from emojis in a book line"""
    month = None
    is_reread = "🔁" in text

    for emoji, m in EMOJI_MONTH.items():
        if emoji in text and m is not None:
            # If multiple month emojis, take the last one (end month)
            month = m

    return month, year, is_reread


def clean_title(text):
    """Strip number, emojis, and whitespace to get clean title"""
    # Remove leading number and dot
    text = re.sub(r"^\d+\.\s*", "", text)
    # Remove all emojis
    emoji_pattern = re.compile(
        "["
        u"\U0001F600-\U0001F64F"
        u"\U0001F300-\U0001F5FF"
        u"\U0001F680-\U0001F6FF"
        u"\U0001F1E0-\U0001F1FF"
        u"\U00002702-\U000027B0"
        u"\U000024C2-\U0001F251"
        u"\U0001f926-\U0001f937"
        u"\U00010000-\U0010ffff"
        u"\u2640-\u2642"
        u"\u2600-\u2B55"
        u"\u200d"
        u"\u23cf"
        u"\u23e9"
        u"\u231a"
        u"\ufe0f"
        u"\u3030"
        "]+", flags=re.UNICODE
    )
    text = emoji_pattern.sub("", text)
    return text.strip()


def parse_book_list(md_text):
    """Parse the markdown and return list of book dicts"""
    books = []
    current_year = None

    for line in md_text.splitlines():
        line = line.strip()

        # Detect year
        year_match = re.match(r"^(20\d{2})$", line)
        if year_match:
            current_year = int(year_match.group(1))
            continue

        # Detect book line
        if re.match(r"^\d+\.", line) and current_year:
            title = clean_title(line)
            if not title:
                continue

            month, year, is_reread = extract_month_year(line, current_year)

            books.append({
                "title": title,
                "year": year,
                "end_month": month,
                "is_reread": is_reread,
            })

    return books


def search_open_library(title):
    """Search Open Library for a book and return best match"""
    try:
        url = f"https://openlibrary.org/search.json"
        params = {
            "q": title,
            "limit": 3,
            "fields": "key,title,author_name,cover_i,first_publish_year,subject"
        }
        res = httpx.get(url, params=params, timeout=10)
        data = res.json()
        if data.get("docs"):
            return data["docs"][0]
    except Exception as e:
        print(f"  ⚠ Open Library search failed for '{title}': {e}")
    return None


def import_book(book_data, ol_result):
    """POST book to Folio API"""
    if ol_result:
        book = {
            "title": ol_result.get("title", book_data["title"]),
            "author": ol_result.get("author_name", ["Unknown"])[0],
            "open_library_id": ol_result.get("key"),
            "cover_url": f"https://covers.openlibrary.org/b/id/{ol_result['cover_i']}-L.jpg" if ol_result.get("cover_i") else None,
            "published_year": ol_result.get("first_publish_year"),
            "genre": ol_result.get("subject", [])[:3],
            "description": None,
        }
    else:
        book = {
            "title": book_data["title"],
            "author": "Unknown",
            "open_library_id": None,
            "cover_url": None,
            "published_year": None,
            "genre": [],
            "description": None,
        }

    log = {
        "status": "read",
        "rating": None,
        "start_month": None,
        "start_year": None,
        "end_month": book_data.get("end_month"),
        "end_year": book_data.get("year"),
        "date_confidence": "approx" if book_data.get("end_month") else "unknown",
        "review": None,
        "notes": "Re-read" if book_data.get("is_reread") else None,
    }

    try:
        res = httpx.post(f"{FOLIO_API}/books/", json={"book": book, "log": log}, timeout=10)
        if res.status_code == 200:
            return True
        else:
            print(f"  ✗ API error {res.status_code}: {res.text}")
            return False
    except Exception as e:
        print(f"  ✗ Failed to save: {e}")
        return False


def main():
    md_text = """
--- Mention the books by either giving the file loc or the md version
"""

    books = parse_book_list(md_text)
    print(f"📚 Found {len(books)} books to import\n")

    success = 0
    failed = 0

    for i, book in enumerate(books):
        print(f"[{i+1}/{len(books)}] {book['title']} ({book['year']})")

        ol = search_open_library(book["title"])
        if ol:
            print(f"  ✓ Found on Open Library: {ol.get('title')}")
        else:
            print(f"  ⚠ Not found on Open Library, saving with basic info")

        ok = import_book(book, ol)
        if ok:
            print(f"  ✓ Saved to Folio")
            success += 1
        else:
            failed += 1

        # Be polite to Open Library API
        time.sleep(0.5)

    print(f"\n✅ Import complete: {success} saved, {failed} failed")


if __name__ == "__main__":
    main()