# MVP Cycle 001

Greenroom MVP Cycle 001 starts from the current Next.js catalog-and-docs app and narrows the next shipping target to a minimal drop-in replacement for Spotify Backstage where `catalog-info.yaml` is the primary source of truth.

## Outcome

Ship a fast internal developer portal that can ingest Backstage-style catalog files, resolve the entities and references they describe, and present that data through discovery-first catalog views, TechDocs and MADR pages, relationship panels, relationship graphs, and Mermaid-supported architecture views.

## Scope

In scope:

- `catalog-info.yaml` ingestion, including multi-document YAML and normalized entity references
- Support for the entities and references already present in this repo and common Backstage catalog patterns
- Discovery UX for teams, systems, components, APIs, resources, and docs
- TechDocs-lite and MADR rendering with low-friction markdown authoring
- Relationship traversal, relationship graph views, and Mermaid-backed diagrams
- Strong fixture coverage, regression tests, and basic performance guardrails

Out of scope for this cycle:

- Plugin parity with Backstage
- Database-backed ingestion or indexing
- Workflow engines, scaffolding execution, or infrastructure inventory
- Full enterprise permissions or tenancy features

## ClawTeam Board

Team:

- `greenroom-mvp-cycle-1`

Local state:

- `~/.clawteam/`

Snapshot:

- `20260325T121740-cycle-start`

Active tasks:

1. `9484196c` `Catalog-info ingestion contract`
2. `69d9a99b` `TechDocs and MADR rendering`
3. `20e78cea` `Baseline quality and performance gates`

Blocked follow-up tasks:

1. `54a90614` `Discovery-first catalog experience`
2. `57693dcc` `Relationship graph and Mermaid views`
3. `0bb4a182` `Cycle integration and exit review`

## Working Rules

- Treat `catalog-info.yaml` as the contract, not a side import format.
- Prefer existing Backstage semantics before inventing Greenroom-specific relation types.
- Keep the runtime file-based and fast until real adoption pressure justifies heavier infrastructure.
- Preserve markdown-first documentation and Mermaid authoring without requiring a separate diagram pipeline.
- Only expand scope when a new capability improves discovery or context for developers.

## Exit Criteria

- A repo fixture set proves Greenroom can consume representative `catalog-info.yaml` inputs and surface readable validation failures.
- Catalog pages let a developer discover owners, systems, components, APIs, resources, and attached docs quickly.
- TechDocs and MADR content render cleanly with stable navigation.
- Relationship panels and graph views expose both direct and reverse links without hidden custom DSLs.
- Mermaid diagrams render safely and degrade gracefully on invalid source.
- `npm run test`, `npm run typecheck`, and `npm run build` remain part of the cycle closeout.

## Useful Commands

```bash
clawteam team status greenroom-mvp-cycle-1
clawteam board show greenroom-mvp-cycle-1
clawteam task list greenroom-mvp-cycle-1
clawteam team snapshots greenroom-mvp-cycle-1
```
