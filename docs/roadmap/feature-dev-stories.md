# Greenroom feature-dev seed stories

These stories translate the research into right-sized Antfarm work.

## US-001 — Catalog schema + validation
- Add a shared TypeScript schema for `org`, `team`, `system`, `component` markdown frontmatter.
- Add runtime validation when loading content and fail clearly on invalid metadata.
- Acceptance criteria:
  - Loading catalog content validates required fields per kind.
  - Invalid frontmatter surfaces a readable error in development.
  - Tests for catalog schema validation pass.
  - Typecheck passes.

## US-002 — Catalog index and facet filters
- Build a catalog landing page grouped by kind with filters for owner/team/tags.
- Keep UI intentionally simple and fast.
- Acceptance criteria:
  - Catalog page lists all entities grouped by kind.
  - Filters for owner, team, and tag update the visible entities.
  - Tests for catalog filtering pass.
  - Typecheck passes.

## US-003 — Entity relationship panels
- Add relationship sections so team pages link to systems and system pages link to components.
- Derive relationships from markdown metadata only.
- Acceptance criteria:
  - Team entities show linked systems.
  - System entities show linked components.
  - Broken references render a visible warning state.
  - Tests for entity relationships pass.
  - Typecheck passes.

## US-004 — Docs navigation shell
- Add sidebar navigation, previous/next links, and docs index generation from the docs tree.
- Preserve markdown-first authoring.
- Acceptance criteria:
  - Docs pages render a sidebar generated from `content/docs`.
  - Previous/next links work for nested docs pages.
  - Tests for docs navigation pass.
  - Typecheck passes.

## US-005 — Mermaid-safe rendering pipeline
- Improve diagram rendering with better loading, dark-mode-safe styling, and graceful fallback.
- Support multiple Mermaid blocks on one page.
- Acceptance criteria:
  - Multiple Mermaid fences render on a single page.
  - Invalid Mermaid source falls back without crashing the page.
  - Tests for Mermaid rendering behavior pass.
  - Typecheck passes.

## US-006 — Search across entities and docs
- Add a local search index for titles, summaries, and markdown headings.
- Search should cover both catalog entities and docs pages.
- Acceptance criteria:
  - Search returns mixed results from catalog and docs.
  - Results include title, type, and path.
  - Tests for search indexing and lookup pass.
  - Typecheck passes.

## US-007 — Seed org-level content and contributor templates
- Add the first org entity plus reusable markdown templates for new teams, systems, and components.
- Keep authoring conventions explicit.
- Acceptance criteria:
  - An org entity exists and links cleanly into the existing model.
  - Template files exist for team, system, and component entities.
  - Tests for seed content loading pass.
  - Typecheck passes.
