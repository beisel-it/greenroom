Foundation: Backstage-native catalog (minimal)

Goal
- Provide a minimal, stable foundation surface for a Backstage-like catalog that other streams can build on.
- Expose a simple catalog content endpoint and reuse existing catalog loader logic.

What exists
- A Next.js API route at /api/foundation/catalog that returns the current catalog content using the shared content loader.
- The endpoint reuses the existing lib/content.ts getCatalogContent() to keep data shape consistent with the UI.

How to use
- Start the app in dev or prod as usual; request: GET /api/foundation/catalog
- The payload matches the CatalogContent type used by the UI:
  - entities, facets, grouped, relationships

Extending the foundation
- To add more API surfaces for the foundation, create more foundation API routes under app/api/foundation.
- Keep changes scoped to foundation and avoid breaking changes to existing catalog UI.

Notes for the team
- This surface is intentionally small and stable to enable other MVP streams to evolve the catalog features.
