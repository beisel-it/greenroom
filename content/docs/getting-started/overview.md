---
title: Overview
summary: Greenroom is a deliberately lean internal catalog and docs portal that documents itself through the same model it exposes.
---

# Overview

Greenroom is designed around four entity levels:

- **Org**
- **Team**
- **System**
- **Component**

The goal is to make software ownership and technical documentation discoverable without taking on the operational cost of Backstage.

## Greenroom documents itself

The repository now describes Greenroom through its own catalog and docs model:

- the repo-owned `Greenroom Web` component is part of the same ingested catalog contract as other sample entities
- product and contributor guidance lives in `content/docs`
- implementation decisions live as ADR pages under `content/docs/adr`

That dogfooding keeps the MVP honest: the project should be understandable through the same docs and ownership flows it offers to other teams.

## What is intentionally missing

- plugin ecosystem
- software templates
- Kubernetes views
- scorecards
- complex permissions

Those can come later if the simple model proves useful.
