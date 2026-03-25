# ADR-0002: Mermaid rendering for ADR/entity diagrams

## Status
Proposed

## Context
We want to render Mermaid diagrams in ADR/docs for architecture/entity relationships (Org -> Team -> System -> Component). This keeps diagrams lightweight and vendor-free.

## Decision
- Reuse the existing Mermaid rendering pipeline used by the docs site.
- Ensure ADR pages include code blocks with the Mermaid syntax using the language tag mermaid.
- The Markdown renderer (Markdown.tsx) already maps language-mermaid blocks to the MermaidBlock component; this remains the standard rendering path.

## Consequences
- Mermaid diagrams render as SVGs on ADR docs without extra tooling.
- ADRs can illustrate architectures without leaving the Markdown-first workflow.