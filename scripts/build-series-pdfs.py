#!/usr/bin/env python3
import json
import os
import re
from datetime import date
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether,
    HRFlowable, Table, TableStyle
)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA = os.path.join(ROOT, "data")
OUT = os.path.join(ROOT, "downloads", "series")
os.makedirs(OUT, exist_ok=True)

pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
pdfmetrics.registerFontFamily("STSong-Light", normal="STSong-Light", bold="STSong-Light",
                              italic="STSong-Light", boldItalic="STSong-Light")

stories_data = json.load(open(os.path.join(DATA, "stories.json"), encoding="utf-8"))
series_data = json.load(open(os.path.join(DATA, "series.json"), encoding="utf-8"))
story_by_id = {item.get("id"): item for item in stories_data.get("stories", [])}

INK = colors.HexColor("#252923")
MUTED = colors.HexColor("#73796F")
ACCENT = colors.HexColor("#8C9A8A")
PALE = colors.HexColor("#E7EAE3")
PAPER = colors.HexColor("#FBFAF7")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="CoverEyebrow", fontName="STSong-Light", fontSize=9, leading=15,
    textColor=MUTED, alignment=TA_CENTER, spaceAfter=18, wordWrap="CJK"
))
styles.add(ParagraphStyle(
    name="CoverTitle", fontName="STSong-Light", fontSize=29, leading=43,
    textColor=INK, alignment=TA_CENTER, spaceAfter=12, wordWrap="CJK"
))
styles.add(ParagraphStyle(
    name="CoverEnglish", fontName="STSong-Light", fontSize=10, leading=16,
    textColor=MUTED, alignment=TA_CENTER, spaceAfter=18
))
styles.add(ParagraphStyle(
    name="CoverDescription", fontName="STSong-Light", fontSize=10.5, leading=19,
    textColor=INK, alignment=TA_CENTER, leftIndent=18*mm, rightIndent=18*mm,
    spaceAfter=8, wordWrap="CJK"
))
styles.add(ParagraphStyle(
    name="SmallCenter", fontName="STSong-Light", fontSize=8.5, leading=14,
    textColor=MUTED, alignment=TA_CENTER, wordWrap="CJK"
))
styles.add(ParagraphStyle(
    name="SectionTitle", fontName="STSong-Light", fontSize=20, leading=30,
    textColor=INK, spaceBefore=4, spaceAfter=12, wordWrap="CJK"
))
styles.add(ParagraphStyle(
    name="WorkTitle", fontName="STSong-Light", fontSize=19, leading=29,
    textColor=INK, spaceAfter=7, wordWrap="CJK"
))
styles.add(ParagraphStyle(
    name="WorkEnglish", fontName="STSong-Light", fontSize=8.5, leading=14,
    textColor=MUTED, spaceAfter=9
))
styles.add(ParagraphStyle(
    name="Meta", fontName="STSong-Light", fontSize=8.5, leading=15,
    textColor=MUTED, spaceAfter=4, wordWrap="CJK"
))
styles.add(ParagraphStyle(
    name="ChapterTitle", fontName="STSong-Light", fontSize=13, leading=21,
    textColor=INK, spaceBefore=14, spaceAfter=10, keepWithNext=True,
    wordWrap="CJK"
))
styles.add(ParagraphStyle(
    name="BodyCJK", fontName="STSong-Light", fontSize=10.2, leading=18.5,
    textColor=INK, alignment=TA_JUSTIFY, spaceAfter=4.2, wordWrap="CJK",
    allowWidows=0, allowOrphans=0
))
styles.add(ParagraphStyle(
    name="TOCItem", fontName="STSong-Light", fontSize=10, leading=18,
    textColor=INK, leftIndent=2*mm, wordWrap="CJK"
))
styles.add(ParagraphStyle(
    name="IntroBody", fontName="STSong-Light", fontSize=10, leading=19,
    textColor=INK, spaceAfter=9, alignment=TA_JUSTIFY, wordWrap="CJK"
))
styles.add(ParagraphStyle(
    name="Question", fontName="STSong-Light", fontSize=10, leading=18,
    textColor=INK, leftIndent=5*mm, rightIndent=5*mm, spaceBefore=7,
    spaceAfter=10, wordWrap="CJK"
))

def safe_name(value):
    value = re.sub(r"[^a-zA-Z0-9_-]+", "-", value).strip("-").lower()
    return value or "series"

def para(text, style):
    return Paragraph(escape(str(text)).replace("\n", "<br/>"), style)

def footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setStrokeColor(PALE)
    canvas.setLineWidth(0.55)
    canvas.line(20*mm, 15*mm, w-20*mm, 15*mm)
    canvas.setFont("STSong-Light", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(20*mm, 10.5*mm, "K&M  ·  MIA LITERARY ARCHIVE")
    canvas.drawRightString(w-20*mm, 10.5*mm, str(doc.page))
    canvas.restoreState()

def build_pdf(series):
    volume_entries = series.get("volumes", [])
    works = []
    missing = []
    for volume in volume_entries:
        story = story_by_id.get(volume.get("id"))
        if story is None:
            missing.append(volume.get("id"))
            continue
        status = str(story.get("status", ""))
        is_published = status in ("已发布", "published", "Published") or "正式版" in status
        if not is_published:
            continue
        works.append((volume, story))
    if missing:
        raise ValueError(f"{series.get('title')} has missing story IDs: {missing}")
    if not works:
        raise ValueError(f"No published works found for {series.get('title')}")

    filename = safe_name(series.get("id") or series.get("title")) + ".pdf"
    path = os.path.join(OUT, filename)
    doc = SimpleDocTemplate(
        path, pagesize=A4, rightMargin=22*mm, leftMargin=22*mm,
        topMargin=22*mm, bottomMargin=23*mm,
        title=f"{series.get('title')} | {series.get('englishTitle', '')}",
        author="K&M", subject="A4 publication edition · Mia Literary Archive",
        pageCompression=1
    )
    flow = []

    # Cover
    flow += [Spacer(1, 32*mm), para(series.get("eyebrow", "MIA LITERARY SERIES"), styles["CoverEyebrow"]),
             HRFlowable(width="24%", thickness=0.8, color=ACCENT, hAlign="CENTER"),
             Spacer(1, 15*mm), para(series.get("title", ""), styles["CoverTitle"])]
    if series.get("englishTitle"):
        flow.append(para(series["englishTitle"], styles["CoverEnglish"]))
    flow += [Spacer(1, 5*mm)]
    if series.get("description"):
        flow.append(para(series["description"], styles["CoverDescription"]))
    flow += [Spacer(1, 22*mm), para(f"系列作品集  ·  A4 出版版", styles["SmallCenter"]),
             Spacer(1, 5*mm), para(f"收录 {len(works)} 部作品", styles["SmallCenter"]),
             Spacer(1, 28*mm), para("作者  K&M", styles["SmallCenter"]),
             Spacer(1, 3*mm), para("Mia 故事档案馆 · 正式发布文本整理", styles["SmallCenter"]),
             PageBreak()]

    # Series introduction / reading guide
    flow.append(para("编者说明", styles["SectionTitle"]))
    flow.append(HRFlowable(width="100%", thickness=0.6, color=PALE, spaceAfter=12))
    if series.get("description"):
        flow.append(para(series["description"], styles["IntroBody"]))
    if series.get("introduction"):
        flow.append(para(series["introduction"], styles["IntroBody"]))
    reading_path = series.get("readingPath") or []
    if reading_path:
        flow.append(Spacer(1, 4*mm))
        flow.append(para("阅读路径", styles["ChapterTitle"]))
        for item in reading_path:
            line = f'{item.get("step", "")}  {item.get("title", "")}  —  {item.get("description", "")}'
            flow.append(para(line, styles["IntroBody"]))
    if series.get("closingNote"):
        flow.append(Spacer(1, 4*mm))
        flow.append(para(series["closingNote"], styles["IntroBody"]))
    flow.append(PageBreak())

    # Contents
    flow.append(para("目录", styles["SectionTitle"]))
    flow.append(HRFlowable(width="100%", thickness=0.6, color=PALE, spaceAfter=12))
    for volume, story in works:
        vol = volume.get("volumeTitle") or ""
        title = story.get("title") or volume.get("title") or ""
        number = story.get("number") or volume.get("number") or ""
        flow.append(para(f"{number}　{vol or title}", styles["TOCItem"]))
        chapters = story.get("chapters") or []
        for chapter in chapters:
            flow.append(para("　　" + chapter.get("title", ""), styles["Meta"]))
    flow.append(PageBreak())

    # Works
    for idx, (volume, story) in enumerate(works):
        number = story.get("number") or volume.get("number") or ""
        title = story.get("title") or volume.get("volumeTitle") or ""
        flow.append(Spacer(1, 4*mm))
        flow.append(para(f"{number}  ·  {volume.get('volumeTitle', '')}", styles["Meta"]))
        flow.append(para(title, styles["WorkTitle"]))
        if story.get("englishTitle"):
            flow.append(para(story["englishTitle"], styles["WorkEnglish"]))
        if story.get("subtitle"):
            flow.append(para(story["subtitle"], styles["IntroBody"]))
        metadata = []
        if story.get("publishedAt"):
            metadata.append(f"出版日期：{story['publishedAt']}")
        if story.get("timestamp"):
            metadata.append(f"档案时间：{story['timestamp']}")
        metadata.append("作者：K&M")
        flow.append(para("　｜　".join(metadata), styles["Meta"]))
        flow.append(HRFlowable(width="100%", thickness=0.6, color=PALE, spaceBefore=4, spaceAfter=12))

        for chapter in story.get("chapters", []):
            chapter_title = chapter.get("title", "")
            if chapter_title:
                flow.append(para(chapter_title, styles["ChapterTitle"]))
            body = chapter.get("body", [])
            if isinstance(body, str):
                body = body.splitlines()
            for line in body:
                if line is None or str(line) == "":
                    flow.append(Spacer(1, 2.5))
                else:
                    flow.append(para(line, styles["BodyCJK"]))
        if story.get("afterwordQuestion"):
            flow.append(Spacer(1, 5*mm))
            flow.append(para("留给读者的问题", styles["ChapterTitle"]))
            flow.append(para(story["afterwordQuestion"], styles["Question"]))
        if idx != len(works)-1:
            flow.append(PageBreak())

    doc.build(flow, onFirstPage=footer, onLaterPages=footer)
    return {
        "id": series.get("id"),
        "title": series.get("title"),
        "englishTitle": series.get("englishTitle", ""),
        "filename": filename,
        "works": len(works),
        "numbers": [story.get("number") or volume.get("number") for volume, story in works],
        "sizeBytes": os.path.getsize(path),
    }

manifest = {
    "generatedFrom": "data/stories.json + data/series.json",
    "edition": "A4",
    "author": "K&M",
    "generatedDate": date.today().isoformat(),
    "editions": [build_pdf(s) for s in series_data.get("series", [])],
}
with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

# A simple landing page with direct PDF download links.
cards = []
for item in manifest["editions"]:
    cards.append(
        '<article><p class="eyebrow">' + escape(item["englishTitle"]) + '</p>'
        '<h2>' + escape(item["title"]) + '</h2>'
        '<p>收录 ' + str(item["works"]) + ' 部作品 · A4 PDF</p>'
        '<a href="downloads/series/' + escape(item["filename"]) + '" download>下载 PDF</a></article>'
    )
html = """<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mia · A4 出版版</title><style>
:root{color-scheme:light;--ink:#30372f;--muted:#7c857a;--paper:#f4f2ec;--line:#dfe3da}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Georgia,'Noto Serif CJK SC',serif}
main{max-width:920px;margin:auto;padding:64px 24px 80px}header{text-align:center;padding:24px 0 44px}
.kicker{font:10px Arial,sans-serif;letter-spacing:.24em;color:var(--muted)}
h1{font-size:clamp(30px,6vw,48px);font-weight:400;margin:18px 0 12px}
.sub{color:var(--muted);font-size:14px;line-height:1.9}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
article{background:#fbfaf7;border:1px solid var(--line);padding:25px 23px;min-height:190px;display:flex;flex-direction:column}
article h2{font-size:21px;font-weight:400;margin:8px 0 6px}
article p{font-size:12px;color:var(--muted);line-height:1.8}
article .eyebrow{font:9px Arial,sans-serif;letter-spacing:.12em}
a{margin-top:auto;color:#526858;text-decoration:none;border-bottom:1px solid #aab6a8;padding-bottom:5px;width:max-content;font-size:13px}
footer{text-align:center;color:var(--muted);font:10px Arial,sans-serif;letter-spacing:.12em;margin-top:48px}
</style></head><body><main><header><div class="kicker">MIA · LITERARY ARCHIVE</div><h1>A4 出版版</h1><p class="sub">六个系列，分别成册。<br>依据故事档案馆已发布文本整理 · 作者 K&M</p></header><section class="grid">""" + "".join(cards) + """</section><footer>K&M · MIA LITERARY ARCHIVE</footer></main></body></html>"""
with open(os.path.join(ROOT, "editions.html"), "w", encoding="utf-8") as f:
    f.write(html)

print(json.dumps(manifest, ensure_ascii=False, indent=2))
