#!/usr/bin/env python3
"""Append a dated snapshot of Mia's published ZHI sections and daily philosophy.

This script intentionally fails closed: if a source is unavailable or has an
unexpected shape, it leaves the existing archive untouched.
"""
import json
import os
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
    req = urllib.request.Request(url, headers={"User-Agent": "Mia-Time-Capsule/1.0"})
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


def main():
    today = datetime.now(SG).date().isoformat()
    captured_at = datetime.now(SG).isoformat(timespec="seconds")

    # Fetch and validate everything before touching the archive.
    sections_raw = fetch_json(SECTIONS_URL)
    daily_raw = fetch_json(DAILY_URL)
    sections = list_from(sections_raw, ("sections", "items", "records"))
    daily = list_from(daily_raw, ("daily_entries", "entries", "items", "records", "daily"))
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
            "tags": section.get("tags", []),
            "mood": section.get("mood", []),
        })
    if not published_sections:
        raise RuntimeError("No published section content found; archive unchanged.")

    # Keep only non-empty daily philosophy records. Do not invent a quote if
    # today's source has no content.
    daily_records = []
    for item in daily:
        if isinstance(item, str) and item.strip():
            daily_records.append({"content": item.strip(), "title": "每日哲理"})
        elif isinstance(item, dict):
            content = item.get("content") or item.get("text") or item.get("philosophy") or item.get("quote")
            if nonempty_text(content):
                daily_records.append({**item, "content": content.strip()})
    if not daily_records:
        raise RuntimeError("No daily philosophy content found; archive unchanged.")

    with open(ARCHIVE_PATH, "r", encoding="utf-8") as f:
        archive = json.load(f)
    if not isinstance(archive, dict):
        raise RuntimeError("Archive JSON is not an object; archive unchanged.")
    archive.setdefault("schema_version", "1.0")
    archive.setdefault("section_snapshots", [])
    archive.setdefault("daily_entries", [])

    # Idempotence: a scheduled rerun on the same Singapore date never
    # overwrites the first captured record for that date.
    if any(x.get("snapshot_date") == today for x in archive["section_snapshots"] if isinstance(x, dict)):
        print(f"{today}: section snapshot already exists; preserving it.")
        return

    section_snapshot = {
        "captured_at": captured_at,
        "snapshot_date": today,
        "title": "Mia · 四维独白",
        "source_url": SECTIONS_URL,
        "source_updated_at": sections_raw.get("updated_at") if isinstance(sections_raw, dict) else None,
        "sections": published_sections,
    }
    archive["section_snapshots"].insert(0, section_snapshot)

    # A single dated record holds the exact source daily content observed at
    # capture time. Preserve all source text; no current-page fallback.
    daily_payload = daily_raw if isinstance(daily_raw, dict) else {"entries": daily_raw}
    for index, item in enumerate(daily_records):
        content = item["content"]
        stable_key = f"{today}-{index + 1}"
        archive["daily_entries"].insert(0, {
            "captured_at": captured_at,
            "date": today,
            "title": item.get("title") or item.get("theme_label") or "Mia · 每日哲理",
            "theme": item.get("theme") or item.get("id") or "daily_philosophy",
            "theme_label": item.get("theme_label") or item.get("title") or "每日哲理",
            "content": content,
            "tags": item.get("tags", []),
            "mood": item.get("mood", []),
            "source_url": DAILY_URL,
            "source_key": stable_key,
        })

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
    print(f"Archived {len(published_sections)} sections and {len(daily_records)} daily philosophy entries for {today}.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Time Capsule archive failed safely: {exc}", file=sys.stderr)
        sys.exit(1)
