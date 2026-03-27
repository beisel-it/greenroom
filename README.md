# 🟢 Greenroom

Modern internal developer portal focused on Backstage-compatible `catalog-info.yaml` ingestion, fast discovery, TechDocs, MADR, relationships, relationship graphs, and Mermaid-first documentation.

<p>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" />
  <img alt="React" src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white" />
  <img alt="Vitest" src="https://img.shields.io/badge/Tested%20with-Vitest-6e9f18?logo=vitest&logoColor=white" />
  <img alt="Backstage catalog" src="https://img.shields.io/badge/Catalog-Backstage%20compatible-0a7ea4" />
</p>

## TL;DR

Greenroom is a modern, file-first IDP that treats `catalog-info.yaml` as the primary contract and ships a fast discovery UX, TechDocs-style docs, MADR-friendly content, Mermaid rendering, and relationship graphs without the operational weight of a full Backstage deployment.

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

Catalog landing page with discovery-oriented entry points into entities and docs.

### Catalog Entity

<p>
  <img src="docs/assets/readme/catalog-entity.png" alt="Greenroom repo-owned catalog entity page with documentation links" width="900" />
</p>

Entity detail surface with ownership, graph traversal, relationships, Mermaid diagrams, and broken-reference visibility.

### Docs View

<p>
  <img src="docs/assets/readme/docs-page.png" alt="Greenroom documentation page rendered from Markdown with docs navigation" width="900" />
</p>

Markdown-first docs shell with TechDocs-style reading flow and adjacent navigation.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 🧱 What You Get

| Area | Included in the MVP |
| --- | --- |
| Catalog | Backstage-style entity loading from `catalog-info.yaml`, normalized refs, slugged routes |
| Discovery | Kind grouping, owner/tag/query filtering, catalog landing page, detail navigation |
| Docs | Markdown docs, TechDocs-lite navigation, previous/next links |
| Architecture | Mermaid blocks, relationship graph traversal, entity graph views |
| Governance | ADR/MADR-friendly docs structure, repo-native authoring flow |
| Quality | Vitest coverage, TypeScript checks, fast local feedback loop |

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

`GET /api/catalog/entities/relations/:kind/:namespace/:name`

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
- relationship diagram controls with graph-local edge filters plus a hierarchy-focused exploration preset
- kind-specific panels for systems, components, APIs, resources, and providers/consumers
- broken-reference warnings when sample or real catalog content is inconsistent

## 🛠️ Local Development

Useful scripts:

```bash
npm run dev
npm run build
npm run typecheck
npm run test
```

Useful entry points:

- app shell: [app/page.tsx](/home/florian/.openclaw/workspace/greenroom/app/page.tsx)
- catalog index: [app/catalog/page.tsx](/home/florian/.openclaw/workspace/greenroom/app/catalog/page.tsx)
- catalog entity page: [app/catalog/[...slug]/page.tsx](/home/florian/.openclaw/workspace/greenroom/app/catalog/[...slug]/page.tsx)
- docs shell: [app/docs/[...slug]/page.tsx](/home/florian/.openclaw/workspace/greenroom/app/docs/[...slug]/page.tsx)

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

Key content and roadmap docs:

- MVP cycle: [docs/roadmap/mvp-cycle-001.md](/home/florian/.openclaw/workspace/greenroom/docs/roadmap/mvp-cycle-001.md)
- feature stories: [docs/roadmap/feature-dev-stories.md](/home/florian/.openclaw/workspace/greenroom/docs/roadmap/feature-dev-stories.md)
- ADR index: [docs/adr/INDEX.md](/home/florian/.openclaw/workspace/greenroom/docs/adr/INDEX.md)

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

Likely next increments:

- cross-catalog search across docs and entities
- richer relationship graph exploration and focused edge filtering
- stronger spec-link rendering for OpenAPI and AsyncAPI assets
- contributor templates for teams, systems, APIs, and ADRs

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
