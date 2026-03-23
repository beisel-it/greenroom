# Greenroom

Lean Backstage-style catalog + docs app.

## Product shape

Greenroom intentionally starts small:

- **Core model:** Org -> Team -> System -> Component
- **Docs:** Markdown-first TechDocs-lite
- **Diagrams:** Mermaid in Markdown fences
- **Stack:** Next.js App Router + TypeScript + file-based content

## Why not full Backstage?

Because the first job is clarity, not platform sprawl. Greenroom should prove that teams can find ownership, system context, and practical docs before anything heavier is added.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Content layout

```text
content/
  catalog/
    teams/
    systems/
    components/
  docs/
    getting-started/
```

## Near-term roadmap

See `docs/roadmap/feature-dev-stories.md` and Antfarm backlog entries.
