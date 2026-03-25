#!/usr/bin/env python3
import os
import re
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[1]
DOCS_DIR = Path(ROOT, "docs")
SITE_DIR = Path(ROOT, "docs-site", "docs")
NAV_FILE = Path(ROOT, "techdocs-lite", "nav.json")

def md_to_html(md_text: str) -> str:
    out_lines = []
    for line in md_text.splitlines():
        line = line.rstrip()
        if line.startswith("# "):
            out_lines.append(f"<h1>{escape(line[2:].strip())}</h1>")
        elif line.startswith("## "):
            out_lines.append(f"<h2>{escape(line[3:].strip())}</h2>")
        elif line.strip() == "":
            # skip multiple blanks
            if not out_lines or out_lines[-1] != "<br>":
                out_lines.append("<br>")
        else:
            out_lines.append(f"<p>{escape(line)}</p>")
    return "\n".join(out_lines)

def render_file(md_path: Path, html_path: Path, title: str) -> None:
    md_text = md_path.read_text(encoding="utf-8")
    body = md_to_html(md_text)
    html = f"<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>{escape(title)}</title></head><body>" + body + "</body></html>"
    html_path.parent.mkdir(parents=True, exist_ok=True)
    html_path.write_text(html, encoding="utf-8")

def render_all():
    if not DOCS_DIR.exists():
        print("No docs dir found")
        return
    if NAV_FILE.exists():
        pass
    for root, dirs, files in os.walk(DOCS_DIR):
        for f in files:
            if f.endswith(".md"):
                md_path = Path(root, f)
                rel = md_path.relative_to(DOCS_DIR)
                out_rel = rel.with_suffix(".html")
                html_path = SITE_DIR / out_rel
                # derive title
                title = html_title_from_md(md_path)
                render_file(md_path, html_path, title)

def html_title_from_md(md_path: Path) -> str:
    try:
        with md_path.open("r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("# "):
                    return line[2:].strip()
                if line.startswith("## "):
                    return line[3:].strip()
    except Exception:
        pass
    return md_path.stem

def render_index():
    # Build a simple index.html listing docs
    entries = []
    if NAV_FILE.exists():
        import json
        data = json.loads(NAV_FILE.read_text(encoding="utf-8"))
        for doc in data.get("docs", []):
            path = Path(doc.get("path", "")).with_suffix(".html").as_posix()
            title = doc.get("title", doc.get("path", ""))
            entries.append((path, title))
    html_items = "".join([f"<li><a href=\"{escape(p)}\">{escape(t)}</a></li>" for p, t in entries])
    idx = f"<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>TechDocs-lite – Docs</title></head><body><h1>Docs</h1><ul>{html_items}</ul></body></html>"
    SITE_DIR.parent.mkdir(parents=True, exist_ok=True)
    (SITE_DIR.parent).mkdir(parents=True, exist_ok=True)
    (SITE_DIR.parent / "index.html").write_text(idx, encoding="utf-8")

if __name__ == "__main__":
    render_all()
    render_index()
