# ADR-0003: Greenroom documents itself through its own docs model

## Status
Accepted

## Context
Greenroom is meant to prove that a lean catalog-and-docs workflow is usable without heavy platform machinery. If the project itself is described somewhere else, the MVP does not fully exercise its own authoring path.

## Decision
- Keep Greenroom's project guidance in `content/docs`.
- Keep implementation decisions for the project in `content/docs/adr`.
- Point the repo-owned `Greenroom Web` catalog entity at the in-app docs and ADR pages so the project can be explored through the same catalog contract it exposes.

## Consequences
- The repository becomes a dogfood example for catalog ownership, docs navigation, and ADR authoring.
- Docs and ADR regressions become easier to spot because the project depends on those surfaces itself.
- Contributors need to keep project docs current as catalog or rendering behavior changes.
