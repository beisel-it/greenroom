#!/usr/bin/env python3
import os
import re
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[1]
DOCS_DIR = Path(ROOT, "docs")
SITE_DIR = Path(ROOT, "docs-site", "docs")
NAV_FILE = Path(ROOT, "techdocs-lite", "nav.json")

INLINE_TOKEN_RE = re.compile(r"(`[^`]+`|\[[^\]]+\]\([^)]+\))")


def render_inline(text: str) -> str:
    parts = []
    last = 0

    for match in INLINE_TOKEN_RE.finditer(text):
        start, end = match.span()
        if start > last:
            parts.append(escape(text[last:start]))

        token = match.group(0)
        if token.startswith("`") and token.endswith("`"):
            parts.append(f"<code>{escape(token[1:-1])}</code>")
        else:
            link_match = re.match(r"\[([^\]]+)\]\(([^)]+)\)", token)
            if link_match:
                label, href = link_match.groups()
                parts.append(f"<a href=\"{escape(href, quote=True)}\">{escape(label)}</a>")
            else:
                parts.append(escape(token))

        last = end

    if last < len(text):
        parts.append(escape(text[last:]))

    return "".join(parts)

def md_to_html(md_text: str) -> str:
    out_lines = []
    in_list = False

    def close_list() -> None:
        nonlocal in_list
        if in_list:
            out_lines.append("</ul>")
            in_list = False

    for line in md_text.splitlines():
        line = line.rstrip()
        if line.startswith("# "):
            close_list()
            out_lines.append(f"<h1>{render_inline(line[2:].strip())}</h1>")
        elif line.startswith("## "):
            close_list()
            out_lines.append(f"<h2>{render_inline(line[3:].strip())}</h2>")
        elif line.startswith("- "):
            if not in_list:
                out_lines.append("<ul>")
                in_list = True
            out_lines.append(f"<li>{render_inline(line[2:].strip())}</li>")
        elif line.strip() == "":
            close_list()
            # skip multiple blanks
            if not out_lines or out_lines[-1] != "<br>":
                out_lines.append("<br>")
        else:
            close_list()
            out_lines.append(f"<p>{render_inline(line)}</p>")
    close_list()
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
            path = Path("docs") / Path(doc.get("path", "")).with_suffix(".html")
            title = doc.get("title", doc.get("path", ""))
            entries.append((path.as_posix(), title))
    html_items = "".join([f"<li><a href=\"{escape(p)}\">{escape(t)}</a></li>" for p, t in entries])
    idx = f"<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>TechDocs-lite – Docs</title></head><body><h1>Docs</h1><ul>{html_items}</ul></body></html>"
    SITE_DIR.parent.mkdir(parents=True, exist_ok=True)
    (SITE_DIR.parent).mkdir(parents=True, exist_ok=True)
    (SITE_DIR.parent / "index.html").write_text(idx, encoding="utf-8")

if __name__ == "__main__":
    render_all()
    render_index()
