# ADR-0001: Keep Greenroom intentionally lean

## Status
Accepted

## Decision
Greenroom will start as a markdown-first internal catalog and docs app with the entity model `Org -> Team -> System -> Component`.

## Consequences
- optimize for authoring simplicity over deep integrations
- prefer file-based content before introducing a database
- support Mermaid diagrams early because architecture diagrams matter
- delay plugins, templates with execution, and infrastructure inventory until basic adoption exists
