---
title: Contributing content
summary: Add or update Greenroom catalog entries, docs, templates, and ADRs with plain Markdown.
---

# Contributing content

## Add a catalog entry

1. For file-based example entities, create a Markdown file under `content/catalog/<kind>/`.
2. Add frontmatter fields like `slug`, `kind`, `title`, `summary`, `owner`.
3. Write the entity body in Markdown.

For reusable starting points, use the templates in `content/templates/`:

- `team.md`
- `system.md`
- `component.md`
- `api.md`

## Add a docs page

1. Create a Markdown file under `content/docs/...`.
2. Use folders to define the URL.
3. Use Mermaid fences for diagrams.

## Add an ADR

1. Create a Markdown file under `content/docs/adr/`.
2. Use the next available `000N-...` file name.
3. Follow the ADR template in `content/templates/adr.md`.
4. Keep the decision short, specific, and tied to a concrete change in the repo.

## Greenroom-specific guidance

- Update `content/docs/getting-started/overview.md` when the product model changes materially.
- Prefer ADRs for decisions about rendering, catalog modeling, and authoring workflow rules.
- Keep doc paths stable when possible so catalog annotations and QA references do not drift.
