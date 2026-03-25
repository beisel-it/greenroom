#!/usr/bin/env python3
"""
MADR-friendly ADR discovery/rendering/indexing/Linkage tool for Greenroom ADRs.
- Scans docs/adr/*.md
- Extracts ADR id/title/status and related ADRs
- Generates/docs/adr/INDEX.md with a compact MADR-style index
- Creates/updates docs/adr/README-ADR.md with usage
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]  # workspace/greenroom
ADR_DIR = ROOT / 'docs' / 'adr'
INDEX_PATH = ADR_DIR / 'INDEX.md'
README_PATH = ADR_DIR / 'README-ADR.md'

# Parse ADR header from first markdown line: "# ADR-0001: Title"
adr_pattern = re.compile(r'^#\s*ADR-(?P<num>\d+):\s*(?P<title>.+)$')

# Scan ADR files
adr_entries = []
for md in sorted(ADR_DIR.glob('*.md')):
    if md.name == 'INDEX.md' or md.name == 'README-ADR.md' or md.name.startswith('.'):  # skip generated index
        continue
    text = md.read_text(encoding='utf-8', errors='ignore').splitlines()
    if not text:
        continue
    m = None
    first = text[0].strip()
    m = adr_pattern.match(first)
    if not m:
        # Try to derive id from filename if header missing
        m2 = re.match(r'(\d{4})-(.+)\.md', md.name)
        if m2:
            num = m2.group(1)
            title = m2.group(2).replace('-', ' ')
            m = type('O', (), {'group': lambda k: {'num': num, 'title': title}[k]})()
        else:
            continue
        adr_id = num
        title = title
    else:
        adr_id = m.group('num')
        title = m.group('title')
    # Look for sections: Status, Linked ADRs, etc.
    status = None
    linked = []
    for i, line in enumerate(text):
        if line.strip().lower() == '## status' and i+1 < len(text):
            status = text[i+1].strip()
        if line.strip().lower().startswith('related adr') or line.strip().lower().startswith('linked adr'):
            # Parse a line like: "Related ADRs: 0002, 0003" or on multiple lines
            parts = line.split(':', 1)
            if len(parts) == 2:
                items = [p.strip() for p in parts[1].split(',') if p.strip()]
                linked.extend(items)
    adr_entries.append({
        'id': adr_id,
        'title': title,
        'path': md.relative_to(ROOT).as_posix(),
        'status': status or 'Unknown',
        'linked': linked,
    })

# Generate INDEX.md content
lines = []
lines.append('# ADR Index (MADR-friendly)')
lines.append('')
lines.append('This index lists all ADRs in docs/adr. Use the file names as stable references and link to the full ADR documents.')
lines.append('')
lines.append('| ADR | Title | Status | Linked ADRs |')
lines.append('|---|---|---|---|')
for e in adr_entries:
    link = f"[{e['path'].split('/')[-1]}]({e['path']})"
    linked = ', '.join(e['linked']) if e['linked'] else ''
    lines.append(f"| ADR-{e['id']} | {e['title']} | {e['status']} | {linked} |")

INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
INDEX_PATH.write_text('\n'.join(lines) + '\n', encoding='utf-8')

# Write a small README with usage if not exists
readme = [
    '# ADRs in Greenroom',
    '',
    'Use this folder to store MADR-style ADRs. Run adr_discovery.py to refresh INDEX.md.',
]
if not README_PATH.exists():
    README_PATH.write_text('\n'.join(readme) + '\n', encoding='utf-8')

print('ADR discovery complete. Found', len(adr_entries), 'ADR(s).')
