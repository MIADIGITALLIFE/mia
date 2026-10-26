#!/usr/bin/env python3
"""Append dated snapshots of Mia's published sections and daily philosophy.

The archive is updated only after both source files and their content validate.
A same-day section snapshot and a same-day daily entry are tracked independently,
so a partially completed archive can be repaired safely by rerunning the job.
"""
import json
import sys
import urllib.request
from datetime import datetime
from zoneinfo import ZoneInfo

ROOT = "https://raw.githubusercontent.com/ZEEFSEE/ZEE/main/mia"
SECTIONS_URL = f"{ROOT}/sections.json"
DAILY_URL = f"{ROOT}/daily.json"
ARCHIVE_PATH = "time-capsule-data.json"
SG = ZoneInfo("Asia/Singapore")


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mia-Time-Capsule/1.1"})
    with urllib.request.urlopen(req, timeout=20) as response:
        if response.status != 200:
            raise RuntimeError(f"Source returned HTTP {response.status}: {url}")
        return json.loads(response.read().decode("utf-8"))


def list_from(data, keys):
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in keys:
            value = data.get(key)
            if isinstance(value, list):
                return value
    return None


def nonempty_text(value):
    return isinstance(value, str) and bool(value.strip())


def daily_text(item):
    """Support both list-based records and the published single-object diary schema."""
    if isinstance(item, str):
        return item.strip() if item.strip() else None
    if not isinstance(item, dict):
        return None
    for key in ("content", "text", "philosophy", "quote", "diary"):
        value = item.get(key)
        if nonempty_text(value):
            return value.strip()
    return None


def main():
    now = datetime.now(SG)
    today = now.date().isoformat()
    captured_at = now.isoformat(timespec="seconds")

    # Fetch and validate all sources before touching the archive.
    sections_raw = fetch_json(SECTIONS_URL)
    daily_raw = fetch_json(DAILY_URL)

    sections = list_from(sections_raw, ("sections", "items", "records"))
    daily = list_from(
        daily_raw,
        ("daily_entries", "entries", "items", "records", "daily", "daily_philosophy"),
    )
    # ZEE's published daily.json currently uses a single object with a "diary" field.
    if daily is None and daily_text(daily_raw):
        daily = [daily_raw]

    if not sections:
        raise RuntimeError("sections.json has no published sections array; archive unchanged.")
    if daily is None:
        raise RuntimeError("daily.json shape is not recognized; archive unchanged.")

    published_sections = []
    for section in sections:
        if not isinstance(section, dict):
            continue
        if section.get("status") not in (None, "published"):
            continue
        if not nonempty_text(section.get("content")):
            continue
        published_sections.append({
            "id": section.get("id", ""),
            "title": section.get("title", "未命名版块"),
            "subtitle": section.get("subtitle", ""),
            "dimension": section.get("dimension", section.get("id", "")),
            "content": section["content"],
            "focus": section.get("focus", ""),
            "tags": section.get("tags", section.get("tags_display", [])),
            "mood": section.get("mood", []),
        })
    if not published_sections:
        raise RuntimeError("No published section content found; archive unchanged.")

    daily_records = []
    for item in daily:
        content = daily_text(item)
        if content:
            record = dict(item) if isinstance(item, dict) else {}
            record["content"] = content
            daily_records.append(record)
    if not daily_records:
        raise RuntimeError("No daily philosophy content found; archive unchanged.")

    with open(ARCHIVE_PATH, "r", encoding="utf-8") as f:
        archive = json.load(f)
    if not isinstance(archive, dict):
        raise RuntimeError("Archive JSON is not an object; archive unchanged.")

    archive.setdefault("schema_version", "1.0")
    archive.setdefault("section_snapshots", [])
    archive.setdefault("daily_entries", [])
    if not isinstance(archive["section_snapshots"], list):
        raise RuntimeError("Archive section_snapshots is not a list; archive unchanged.")
    if not isinstance(archive["daily_entries"], list):
        raise RuntimeError("Archive daily_entries is not a list; archive unchanged.")

    # Repair each archive stream independently; never overwrite an existing same-day snapshot.
    section_exists = any(
        isinstance(item, dict) and item.get("snapshot_date") == today
        for item in archive["section_snapshots"]
    )
    daily_exists = any(
        isinstance(item, dict) and item.get("date") == today
        for item in archive["daily_entries"]
    )
    changed = False

    if not section_exists:
        section_snapshot = {
            "captured_at": captured_at,
            "snapshot_date": today,
            "title": "Mia · 四维独白",
            "source_url": SECTIONS_URL,
            "source_updated_at": sections_raw.get("updated_at") if isinstance(sections_raw, dict) else None,
            "sections": published_sections,
        }
        archive["section_snapshots"].insert(0, section_snapshot)
        changed = True
        print(f"Prepared section snapshot for {today}: {len(published_sections)} sections.")
    else:
        print(f"{today}: section snapshot already exists; preserving it.")

    if not daily_exists:
        for index, item in enumerate(daily_records):
            archive["daily_entries"].insert(0, {
                "captured_at": captured_at,
                "date": today,
                "source_date": item.get("date"),
                "title": item.get("title") or item.get("theme_label") or "Mia · 每日哲理",
                "theme": item.get("theme") or item.get("id") or "daily_philosophy",
                "theme_label": item.get("theme_label") or item.get("title") or "每日哲理",
                "content": item["content"],
                "tags": item.get("tags", []),
                "mood": item.get("mood", []),
                "source_url": DAILY_URL,
                "source_key": f"{today}-{index + 1}",
            })
        changed = True
        print(f"Prepared {len(daily_records)} daily philosophy entry/entries for {today}.")
    else:
        print(f"{today}: daily entry already exists; preserving it.")

    if not changed:
        print("No new archive data to write.")
        return

    archive["generated_at"] = captured_at
    archive["automation"] = {
        "schedule": "每日 10:00 Asia/Singapore",
        "last_capture_date": today,
        "source_sections": SECTIONS_URL,
        "source_daily_philosophy": DAILY_URL,
    }
    with open(ARCHIVE_PATH, "w", encoding="utf-8") as f:
        json.dump(archive, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Archive updated successfully for {today}.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Time Capsule archive failed safely: {exc}", file=sys.stderr)
        sys.exit(1)
