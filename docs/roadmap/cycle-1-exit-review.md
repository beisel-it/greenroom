# Greenroom cycle 1 exit review handoff

## Scope owned by docs-madr

This stream covered TechDocs-lite and MADR-friendly ADR rendering for the MVP cycle.

## What shipped this cycle

Delivered:

- `scripts/adr_discovery.py` scans `docs/adr/*.md` and regenerates [`docs/adr/INDEX.md`](docs/adr/INDEX.md) plus [`docs/adr/README-ADR.md`](docs/adr/README-ADR.md).
- `techdocs-lite/ingest.py` scans the repository `docs/` tree and writes a lightweight navigation manifest to [`techdocs-lite/nav.json`](techdocs-lite/nav.json).
- `techdocs-lite/render.py` renders Markdown from `docs/` into static HTML under [`docs-site/docs`](docs-site/docs) and writes a simple index page at [`docs-site/index.html`](docs-site/index.html).
- The repository includes seeded MADR content in [`docs/adr`](docs/adr) and generated static output for the current docs set.
- The main repository README now points maintainers to the docs/ADR helper commands and to this handoff note for exit review context.

## Important implementation boundary

Greenroom currently has two separate documentation surfaces:

- The in-app docs experience at `/docs` reads Markdown from `content/docs` through the Next.js content helpers in [`lib/content.ts`](lib/content.ts).
- The TechDocs-lite and MADR export path reads Markdown from the repository-level `docs/` folder and emits static HTML into `docs-site/`.

That split is intentional for this cycle handoff. Exit review should treat TechDocs-lite/MADR as a lightweight parallel export path, not as the source for the in-app `/docs` route.

## Explicitly in scope for cycle 1

- Lightweight ADR discovery and index generation for `docs/adr`.
- Static HTML rendering for the repository `docs/` tree.
- Checked-in generated artifacts so reviewers can inspect output without running a build pipeline.
- Seed ADR content proving the MADR flow works end to end.

## Explicitly out of scope for cycle 1

- Unifying `content/docs` and `docs/` into one authoring source.
- Integrating the static `docs-site/` output into the Next.js runtime or routing.
- CI automation or npm scripts for `adr_discovery.py`, `techdocs-lite/ingest.py`, or `techdocs-lite/render.py`.
- Full TechDocs parity: search, theming, plugins, metadata standards, or MkDocs compatibility.
- Rich Markdown rendering in the static export beyond the current simple heading/paragraph conversion.

## Known documentation gaps

- There is no single top-level architecture note explaining why `content/docs` and `docs/` currently coexist, so that boundary has to be inferred from code and scripts unless this handoff is consulted.
- The helper scripts are runnable from the repository root, but they are not yet wrapped in `package.json` scripts or CI checks.
- The checked-in static output under `docs-site/` is easy to review, but there is no freshness signal showing whether it is in sync with the latest Markdown sources.
- The static renderer currently supports only a narrow Markdown subset, so reviewers should not assume parity with the richer in-app Markdown rendering path.

## Follow-up recommendations

- Decide on a single documentation source of truth before adding more docs features. The current split is workable for MVP review, but it will create drift if both trees keep growing.
- Add lightweight automation for regeneration, either as npm scripts or CI validation, before relying on `docs-site/` as a review artifact in later cycles.
- Add a short maintainer note describing when to place content in `content/docs` versus `docs/` until the source-of-truth decision is made.
- If TechDocs-lite remains in scope, improve the static renderer incrementally instead of broadening content usage first; otherwise reviewers will overestimate what the export path supports.

## Operator notes

Regenerate the docs-madr outputs manually:

```bash
python3 scripts/adr_discovery.py
python3 techdocs-lite/ingest.py
python3 techdocs-lite/render.py
```

If a future cycle wants one docs system instead of two, the first decision should be whether `content/docs` becomes the single source of truth or whether the app should start consuming the `docs/` tree directly.
