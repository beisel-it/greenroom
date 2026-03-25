#!/usr/bin/env python3
import os
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # techdocs-lite/.. -> repo root of greenroom
DOCS_DIR = Path(ROOT, "docs")
NAV_OUT = Path(ROOT, "techdocs-lite", "nav.json")
HTML_OUT_DIR = Path(ROOT, "docs-site", "docs")

def title_from_md(md_path: Path) -> str:
    try:
        with md_path.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("# "):
                    return line[2:].strip()
                if line.startswith("## "):
                    return line[3:].strip()
    except Exception:
        pass
    return md_path.stem

def scan_docs():
    docs = []
    if not DOCS_DIR.exists():
        return docs
    for root, dirs, files in os.walk(DOCS_DIR):
        for f in files:
            if f.endswith(".md"):
                p = Path(root, f)
                rel = p.relative_to(DOCS_DIR)
                docs.append({
                    "id": str(rel.parent / p.name).replace("\\", "/"),
                    "path": str(rel).replace("\\", "/"),
                    "title": title_from_md(p)
                })
    return docs

def write_nav(docs):
    data = {"docs": docs}
    NAV_OUT.parent.mkdir(parents=True, exist_ok=True)
    with NAV_OUT.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"WROTE NAV: {NAV_OUT}")

if __name__ == "__main__":
    docs = scan_docs()
    write_nav(docs)
