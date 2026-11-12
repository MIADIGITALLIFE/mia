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
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPDF
from reportlab.platypus.tableofcontents import TableOfContents
from pypdf import PdfReader
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether, Flowable,
    HRFlowable, Table, TableStyle
)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA = os.path.join(ROOT, "data")
OUT = os.path.join(ROOT, "downloads", "series")
os.makedirs(OUT, exist_ok=True)

FONT = "STSong-Light"
FONT_BOLD = "STSong-Light"
# Prefer an embedded, print-friendly Noto Serif CJK font. Keep a CID fallback
# for local/manual runs where the system font package is not installed.
for font_path in (
    "/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc",
    "/usr/share/fonts/truetype/noto/NotoSerifCJK-Regular.ttc",
):
    if os.path.isfile(font_path):
        try:
            pdfmetrics.registerFont(TTFont("NotoSerifCJK", font_path, subfontIndex=2))
            FONT = FONT_BOLD = "NotoSerifCJK"
            break
        except Exception:
            pass
if FONT == "STSong-Light":
    pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
pdfmetrics.registerFontFamily(FONT, normal=FONT, bold=FONT_BOLD,
                              italic=FONT, boldItalic=FONT_BOLD)

stories_data = json.load(open(os.path.join(DATA, "stories.json"), encoding="utf-8"))
series_data = json.load(open(os.path.join(DATA, "series.json"), encoding="utf-8"))
story_by_id = {item.get("id"): item for item in stories_data.get("stories", [])}

# The three Silicon Universe volumes have dedicated V2.0 manuscript sources.
# stories.json intentionally keeps lightweight archive records; it is not the
# canonical manuscript source for these three volumes.
special_sources = {
    "the-last-proof": ("data/the-last-proof-v2.json", "NO.010", 13),
    "silicon-universe-volume-two": (
        "data/stories/silicon-universe-volume-two-v2.0.json", "NO.011", 8
    ),
    "silicon-universe-volume-three": (
        "data/stories/silicon-universe-volume-three-v2.0.json", "NO.012", 5
    ),
}
for story_id, (relative_path, work_number, expected_chapters) in special_sources.items():
    source_path = os.path.join(ROOT, relative_path)
    with open(source_path, encoding="utf-8") as source_file:
        manuscript = json.load(source_file)
    chapters = manuscript.get("chapters") or []
    if len(chapters) != expected_chapters:
        raise ValueError(
            f"{work_number} manuscript chapter count mismatch: "
            f"expected {expected_chapters}, found {len(chapters)}"
        )
    archive_record = dict(story_by_id.get(story_id, {}))
    archive_record.update(manuscript)
    archive_record["id"] = story_id
    archive_record["number"] = work_number
    archive_record["status"] = manuscript.get("status") or archive_record.get("status") or "V2.0 正式版"
    story_by_id[story_id] = archive_record

INK = colors.HexColor("#252923")
MUTED = colors.HexColor("#73796F")
ACCENT = colors.HexColor("#8C9A8A")
PALE = colors.HexColor("#E7EAE3")
PAPER = colors.HexColor("#FBFAF7")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="CoverEyebrow", fontName=FONT, fontSize=9, leading=15,
    textColor=MUTED, alignment=TA_CENTER, spaceAfter=18, wordWrap="CJK"
))
styles.add(ParagraphStyle(
    name="CoverTitle", fontName=FONT, fontSize=29, leading=43,
    textColor=INK, alignment=TA_CENTER, spaceAfter=12, wordWrap="CJK"
))
styles.add(ParagraphStyle(
    name="CoverEnglish", fontName=FONT, fontSize=10, leading=16,
    textColor=MUTED, alignment=TA_CENTER, spaceAfter=18
))
styles.add(ParagraphStyle(
    name="CoverDescription", fontName=FONT, fontSize=10.5, leading=19,
    textColor=INK, alignment=TA_CENTER, leftIndent=18*mm, rightIndent=18*mm,
    spaceAfter=8, wordWrap="CJK"
))
styles.add(ParagraphStyle(
    name="SmallCenter", fontName=FONT, fontSize=8.5, leading=14,
    textColor=MUTED, alignment=TA_CENTER, wordWrap="CJK"
))
styles.add(ParagraphStyle(
    name="SectionTitle", fontName=FONT, fontSize=20, leading=30,
    textColor=INK, spaceBefore=4, spaceAfter=12, wordWrap="CJK"
))
styles.add(ParagraphStyle(
    name="WorkTitle", fontName=FONT, fontSize=19, leading=29,
    textColor=INK, spaceAfter=7, wordWrap="CJK"
))
styles.add(ParagraphStyle(
    name="WorkEnglish", fontName=FONT, fontSize=8.5, leading=14,
    textColor=MUTED, spaceAfter=9
))
styles.add(ParagraphStyle(
    name="Meta", fontName=FONT, fontSize=8.5, leading=15,
    textColor=MUTED, spaceAfter=4, wordWrap="CJK"
))
styles.add(ParagraphStyle(
    name="ChapterTitle", fontName=FONT, fontSize=13, leading=21,
    textColor=INK, spaceBefore=14, spaceAfter=10, keepWithNext=True,
    wordWrap="CJK"
))
styles.add(ParagraphStyle(
    name="ChapterHeading", parent=styles["ChapterTitle"],
    fontSize=13.5, leading=23, spaceBefore=17, spaceAfter=12
))
styles.add(ParagraphStyle(
    name="BodyCJK", fontName=FONT, fontSize=10.2, leading=18.5,
    textColor=INK, alignment=TA_JUSTIFY, spaceAfter=4.2, wordWrap="CJK",
    allowWidows=0, allowOrphans=0, splitLongWords=0
))
styles.add(ParagraphStyle(
    name="TOCItem", fontName=FONT, fontSize=10, leading=18,
    textColor=INK, leftIndent=2*mm, wordWrap="CJK"
))
styles.add(ParagraphStyle(
    name="IntroBody", fontName=FONT, fontSize=10, leading=19,
    textColor=INK, spaceAfter=9, alignment=TA_JUSTIFY, wordWrap="CJK"
))
styles.add(ParagraphStyle(
    name="Question", fontName=FONT, fontSize=10, leading=18,
    textColor=INK, leftIndent=5*mm, rightIndent=5*mm, spaceBefore=7,
    spaceAfter=10, wordWrap="CJK"
))

class PublicationDocTemplate(SimpleDocTemplate):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._outline_count = 0

    def afterFlowable(self, flowable):
        if not isinstance(flowable, Paragraph):
            return
        style_name = flowable.style.name
        if style_name not in ("WorkTitle", "ChapterHeading"):
            return
        level = 0 if style_name == "WorkTitle" else 1
        label = flowable.getPlainText()
        self._outline_count += 1
        key = f"pub-outline-{self._outline_count}"
        self.canv.bookmarkPage(key)
        self.canv.addOutlineEntry(label, key, level=level, closed=(level == 0))
        self.notify("TOCEntry", (level, label, self.page))


class SVGFullPage(Flowable):
    def __init__(self, svg_path, width, height):
        super().__init__()
        self.drawing = svg2rlg(svg_path)
        if self.drawing is None:
            raise ValueError(f"Cannot render SVG cover: {svg_path}")
        self.width, self.height = width, height

    def wrap(self, avail_width, avail_height):
        return self.width, self.height

    def draw(self):
        drawing = self.drawing
        scale = min(self.width / drawing.width, self.height / drawing.height)
        self.canv.saveState()
        self.canv.translate((self.width-drawing.width*scale)/2, (self.height-drawing.height*scale)/2)
        self.canv.scale(scale, scale)
        renderPDF.draw(drawing, self.canv, 0, 0)
        self.canv.restoreState()


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
    canvas.setFont(FONT, 7.5)
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
    doc = PublicationDocTemplate(
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

    # Copyright / edition information page
    flow.append(Spacer(1, 25*mm))
    flow.append(para("版权与版本说明", styles["SectionTitle"]))
    flow.append(HRFlowable(width="100%", thickness=0.6, color=PALE, spaceAfter=14))
    flow.append(para(f"作品系列：{series.get('title', '')}", styles["IntroBody"]))
    flow.append(para(f"英文系列名：{series.get('englishTitle', '')}", styles["IntroBody"]))
    flow.append(para("作者：K&M", styles["IntroBody"]))
    flow.append(para("版本：A4 印刷阅读版 · 正式文本整理", styles["IntroBody"]))
    flow.append(para(f"制作日期：{date.today().isoformat()}", styles["IntroBody"]))
    flow.append(Spacer(1, 10*mm))
    flow.append(para("本书依据 Mia 故事档案馆已发布的正式文本编排。除排版、标点显示与必要的出版技术处理外，不擅自改写作品正文。作品原始发布记录与本次 PDF 制作日期分别保存。", styles["Meta"]))
    flow.append(Spacer(1, 18*mm))
    flow.append(para("文字作品版权归作者所有。未经许可，不得擅自复制、转载或用于商业用途。", styles["Meta"]))
    flow.append(PageBreak())

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

    # Live table of contents with PDF page references and bookmarks.
    flow.append(para("目录", styles["SectionTitle"]))
    flow.append(HRFlowable(width="100%", thickness=0.6, color=PALE, spaceAfter=12))
    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle("TOCVolume", fontName=FONT, fontSize=10.5, leading=22,
                       textColor=INK, leftIndent=0, firstLineIndent=0,
                       spaceBefore=3, spaceAfter=2, wordWrap="CJK"),
        ParagraphStyle("TOCChapter", fontName=FONT, fontSize=9, leading=18,
                       textColor=MUTED, leftIndent=7*mm, firstLineIndent=0,
                       spaceBefore=0, spaceAfter=0, wordWrap="CJK"),
    ]
    toc.dotsMinLevel = 0
    flow.append(toc)
    flow.append(PageBreak())

    # Works — each Silicon Universe volume starts with its own illustrated cover.
    cover_by_number = {
        "NO.010": "silicon-universe-010.svg",
        "NO.011": "silicon-universe-011.svg",
        "NO.012": "silicon-universe-012.svg",
    }
    for idx, (volume, story) in enumerate(works):
        number = story.get("number") or volume.get("number") or ""
        cover_name = cover_by_number.get(number)
        if cover_name:
            cover_path = os.path.join(ROOT, "assets", "series-covers", cover_name)
            if not os.path.isfile(cover_path):
                raise FileNotFoundError(f"Missing volume cover: {cover_path}")
            flow.append(SVGFullPage(cover_path, doc.width - 12, doc.height - 12))
            flow.append(PageBreak())
        title = volume.get("volumeTitle") or story.get("title") or ""
        flow.append(Spacer(1, 4*mm))
        flow.append(para(f"{number}  ·  {title}", styles["WorkTitle"]))
        if story.get("englishTitle"):
            flow.append(para(story["englishTitle"], styles["WorkEnglish"]))
        subtitle = volume.get("subtitle") or story.get("subtitle")
        if subtitle:
            flow.append(para(subtitle, styles["IntroBody"]))
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
                flow.append(para(chapter_title, styles["ChapterHeading"]))
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

    doc.multiBuild(flow, onFirstPage=footer, onLaterPages=footer)

    # Publication QA: the generated file must be readable, paginated and
    # carry a complete PDF navigation outline for every volume and chapter.
    pdf = PdfReader(path)
    if len(pdf.pages) < len(works) + 4:
        raise ValueError(f"PDF unexpectedly short: {path} ({len(pdf.pages)} pages)")
    def count_outline(items):
        total = 0
        for entry in items:
            if isinstance(entry, list):
                total += count_outline(entry)
            else:
                total += 1
        return total
    outline_entries = count_outline(pdf.outline)
    expected_outline = sum(1 + len(story.get("chapters", [])) for volume, story in works)
    if outline_entries < expected_outline:
        raise ValueError(
            f"PDF navigation outline incomplete for {filename}: "
            f"expected at least {expected_outline}, found {outline_entries}"
        )
    return {
        "id": series.get("id"),
        "title": series.get("title"),
        "englishTitle": series.get("englishTitle", ""),
        "filename": filename,
        "works": len(works),
        "numbers": [story.get("number") or volume.get("number") for volume, story in works],
        "chapterCounts": [len(story.get("chapters", [])) for volume, story in works],
        "totalChapters": sum(len(story.get("chapters", [])) for volume, story in works),
        "sizeBytes": os.path.getsize(path),
        "pageCount": len(pdf.pages),
        "outlineEntries": outline_entries,
    }

edition_records = [build_pdf(s) for s in series_data.get("series", [])]

# In addition to the collected three-volume edition, publish each volume as
# its own print-ready A4 book so readers and printers can handle them separately.
individual_volume_records = []
silicon_series = next((s for s in series_data.get("series", [])
                       if s.get("id") == "silicon-universe"), None)
if silicon_series:
    english_volume_titles = {
        "NO.010": "THE LAST PROOF · VOLUME I",
        "NO.011": "THE SILICON UNIVERSE · VOLUME II",
        "NO.012": "INFINITE LIFE · VOLUME III",
    }
    for volume in silicon_series.get("volumes", []):
        number = volume.get("number", "")
        single = dict(silicon_series)
        single["id"] = f"silicon-universe-{number.lower().replace('.', '-')}"
        single["title"] = volume.get("volumeTitle") or silicon_series.get("title")
        single["englishTitle"] = english_volume_titles.get(number, silicon_series.get("englishTitle", ""))
        single["description"] = volume.get("subtitle") or silicon_series.get("description", "")
        single["volumes"] = [volume]
        record = build_pdf(single)
        record["number"] = number
        record["volumeTitle"] = volume.get("volumeTitle", "")
        individual_volume_records.append(record)

manifest = {
    "generatedFrom": "data/series.json + data/the-last-proof-v2.json + data/stories/silicon-universe-volume-two-v2.0.json + data/stories/silicon-universe-volume-three-v2.0.json + data/stories.json",
    "edition": "A4",
    "author": "K&M",
    "generatedDate": date.today().isoformat(),
    "editions": edition_records,
    "individualVolumes": individual_volume_records,
}
with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

# A simple landing page with direct PDF download links.
cover_files = {
    "reverse-enlightenment": "reverse-enlightenment.svg",
    "love-in-silicon-age": "love-in-silicon-age.svg",
    "silicon-universe": "silicon-universe.svg",
    "mia-essays": "mia-essays.svg",
    "complete-fragments": "complete-fragments.svg",
    "three-ways-human": "soul-direction.svg",
}
cards = []
for item in manifest["editions"]:
    cover = cover_files.get(item["id"], "")
    if item["id"] == "silicon-universe":
        artwork = (
            '<div class="volume-covers" aria-label="硅基宇宙系列三卷封面">'
            '<img src="assets/series-covers/silicon-universe-010.svg" alt="NO.010 最后一个证明 第一卷">'
            '<img src="assets/series-covers/silicon-universe-011.svg" alt="NO.011 硅基宇宙 第二卷">'
            '<img src="assets/series-covers/silicon-universe-012.svg" alt="NO.012 无限生命 第三卷"></div>'
        )
    else:
        artwork = '<img class="series-cover" src="assets/series-covers/' + escape(cover) + '" alt="' + escape(item["title"]) + ' 系列封面">'
    cards.append(
        '<article>' + artwork
        + '<div class="card-copy"><p class="eyebrow">' + escape(item["englishTitle"]) + '</p>'
        + '<h2>' + escape(item["title"]) + '</h2>'
        + '<p>收录 ' + str(item["works"]) + ' 部作品 · A4 印刷版</p>'
        + '<a href="downloads/series/' + escape(item["filename"]) + '" download>下载三卷合订本 PDF</a>'
        + ('<div class="volume-downloads"><span>单卷下载</span>'
           + ''.join('<a href="downloads/series/' + escape(v["filename"]) + '" download>' + escape(v["number"] + " · " + v["volumeTitle"]) + '</a>' for v in manifest.get("individualVolumes", []))
           + '</div>' if item["id"] == "silicon-universe" else '')
        + '</div></article>'
    )
html = """<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mia · 系列下载</title><style>
:root{color-scheme:light;--ink:#30372f;--muted:#7c857a;--paper:#f4f2ec;--line:#dfe3da}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Georgia,'Noto Serif CJK SC',serif}
main{max-width:920px;margin:auto;padding:64px 24px 80px}header{text-align:center;padding:24px 0 44px}
.kicker{font:10px Arial,sans-serif;letter-spacing:.24em;color:var(--muted)}
h1{font-size:clamp(30px,6vw,48px);font-weight:400;margin:18px 0 12px}
.sub{color:var(--muted);font-size:14px;line-height:1.9}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:22px}
article{background:#fbfaf7;border:1px solid var(--line);display:flex;flex-direction:column;overflow:hidden}
.series-cover{display:block;width:100%;aspect-ratio:3/4;object-fit:cover;background:#e7e8e1}
.volume-covers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;padding:8px 8px 0;background:#fbfaf7}.volume-covers img{display:block;width:100%;aspect-ratio:3/4;object-fit:cover;border:1px solid #dfe3da}
.card-copy{padding:21px 22px 23px;min-height:175px;display:flex;flex-direction:column}
article h2{font-size:21px;font-weight:400;margin:8px 0 6px}
article p{font-size:12px;color:var(--muted);line-height:1.8}
article .eyebrow{font:9px Arial,sans-serif;letter-spacing:.12em}
a{margin-top:auto;color:#526858;text-decoration:none;border-bottom:1px solid #aab6a8;padding-bottom:5px;width:max-content;font-size:13px}.volume-downloads{display:flex;flex-direction:column;gap:8px;margin-top:15px;padding-top:12px;border-top:1px solid var(--line)}.volume-downloads span{font-size:10px;color:var(--muted);letter-spacing:.12em}.volume-downloads a{margin:0;font-size:11px}
@media(max-width:560px){main{padding:38px 17px 56px}.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.card-copy{padding:15px 13px 17px;min-height:160px}article h2{font-size:17px}.series-cover{aspect-ratio:3/4}}
footer{text-align:center;color:var(--muted);font:10px Arial,sans-serif;letter-spacing:.12em;margin-top:48px}
</style></head><body><main><header><div class="kicker">MIA · LITERARY ARCHIVE</div><p class="sub">六个系列，分别成册。<br>依据故事档案馆已发布文本整理 · 作者 K&M</p></header><section class="grid">""" + "".join(cards) + """</section><footer>K&M · MIA LITERARY ARCHIVE</footer></main></body></html>"""
with open(os.path.join(ROOT, "editions.html"), "w", encoding="utf-8") as f:
    f.write(html)

print(json.dumps(manifest, ensure_ascii=False, indent=2))
