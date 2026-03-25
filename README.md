# 🟢 Greenroom

Modern internal developer portal focused on Backstage-compatible `catalog-info.yaml` ingestion, fast discovery, TechDocs, MADR, relationships, relationship graphs, and Mermaid-first documentation.

## ✨ Why Greenroom

Greenroom is a lean, file-first alternative to a heavier Backstage installation:

- `catalog-info.yaml` is the contract, not a side import path
- discovery stays fast and local with in-repo content
- TechDocs and MADR stay markdown-first
- relationship traversal uses familiar Backstage semantics
- Mermaid diagrams render directly inside the product

The current target is a minimal drop-in replacement for Spotify Backstage for teams that want a modern 2026 UX without the operational weight of a larger plugin platform.

## 🧭 Current Focus

- Backstage-style catalog ingestion with normalized entity references
- catalog pages for domains, systems, components, APIs, resources, and locations
- relationship panels, graph traversal, and graph-oriented entity navigation
- TechDocs-lite docs with sidebar navigation and previous/next flows
- MADR/ADR-friendly authoring
- Mermaid diagrams with graceful fallback behavior

## 🖼️ Screenshots

### Home

<p>
  <img src="docs/assets/readme/home.png" alt="Greenroom home page with catalog and docs overview" width="900" />
</p>

### Catalog Entity

<p>
  <img src="docs/assets/readme/catalog-entity.png" alt="Greenroom catalog entity page showing relationships and ownership context" width="900" />
</p>

### Docs View

<p>
  <img src="docs/assets/readme/docs-page.png" alt="Greenroom documentation page rendered from Markdown with docs navigation" width="900" />
</p>

## 🏗️ Product Shape

Greenroom keeps the core model intentionally small:

- `Org -> Team -> System -> Component`
- plus Backstage-native `Domain`, `API`, `Resource`, and `Location` support already present in this repo

Core building blocks:

- Next.js App Router
- TypeScript
- file-based content
- markdown docs
- Mermaid blocks in markdown fences

## 🔎 Discovery And Graphs

Greenroom already exposes catalog relationships without inventing a custom DSL.

`GET /api/catalog/entities/:kind/:namespace/:name/relations`

The current graph surface includes:

- ownership via `spec.owner`
- containment via `spec.domain`, `spec.system`, `spec.subdomainOf`, `spec.subcomponentOf`
- API edges via `spec.providesApis`, `spec.consumesApis`
- dependency edges via `spec.dependsOn`, `spec.dependencyOf`
- reverse neighbor collections for domains, systems, components, APIs, resources, providers, consumers, and dependents
- broken reference reporting for unresolved catalog refs

Catalog detail pages currently expose:

- breadcrumbs for graph traversal
- grouped neighbor cards and relation filters
- kind-specific panels for systems, components, APIs, resources, and providers/consumers
- broken-reference warnings when sample or real catalog content is inconsistent

## 🛠️ Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful scripts:

```bash
npm run dev
npm run build
npm run typecheck
npm run test
```

## 📁 Content Layout

```text
content/
  catalog/
    orgs/
    teams/
    systems/
    apis/
    docs/
  docs/
  templates/
```

## 🗺️ Roadmap

Near-term feature stories from [docs/roadmap/feature-dev-stories.md](/home/florian/.openclaw/workspace/greenroom/docs/roadmap/feature-dev-stories.md):

- `US-001` Catalog schema and validation
- `US-002` Catalog index and facet filters
- `US-003` Entity relationship panels
- `US-004` Docs navigation shell
- `US-005` Mermaid-safe rendering pipeline
- `US-006` Search across entities and docs
- `US-007` Seed org-level content and contributor templates

Active MVP framing from [docs/roadmap/mvp-cycle-001.md](/home/florian/.openclaw/workspace/greenroom/docs/roadmap/mvp-cycle-001.md):

- discovery-first catalog experience
- TechDocs and MADR as first-class content
- relationship graph and Mermaid-backed architecture views
- strong tests and fast local iteration

## 🚧 Explicit Non-Goals For This Cycle

- full Backstage plugin parity
- database-backed ingestion or search infrastructure
- scaffolder execution and workflow engines
- infrastructure inventory and enterprise tenancy layers

## 🤝 Authoring Model

Greenroom favors low-friction repo-native authoring:

- edit markdown
- edit `catalog-info.yaml`
- commit changes
- preview locally

That keeps adoption simple while still supporting ownership, system context, architecture notes, and diagrams in one place.
