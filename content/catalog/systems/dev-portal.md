---
slug: dev-portal
kind: system
title: Developer Portal
summary: Internal portal system that surfaces teams, systems, components, and docs.
owner: Platform Team
team: Platform Team
tags: [system, portal]
---

# Developer Portal

Greenroom starts as a narrow internal portal, not a platform kitchen sink.

```mermaid
flowchart TD
  org[Org] --> team[Team]
  team --> system[System]
  system --> component[Component]
  component --> docs[Markdown Docs]
```

## Scope rules

1. Catalog entities live in Markdown frontmatter.
2. Docs are first-class pages, not generated API references.
3. Mermaid should work out of the box for architecture diagrams.
