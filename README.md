# Greenroom

Lean Backstage-style catalog and docs app for small teams that want ownership, system context, and practical documentation without the weight of a full platform.

## ✨ What it is

Greenroom keeps the model intentionally small:

- **Core model:** Org → Team → System → Component
- **Docs:** Markdown-first TechDocs-lite pages
- **Diagrams:** Mermaid in Markdown fences
- **Stack:** Next.js App Router + TypeScript + file-based content

The goal is simple: prove that teams can find the right owner, understand system context, and read useful docs before adding more platform machinery.

## 📸 UI snapshots

<p>
  <img src="docs/assets/readme/home.png" alt="Greenroom home page with catalog and docs overview" width="900" />
</p>

<p>
  <img src="docs/assets/readme/catalog-entity.png" alt="Greenroom component detail page for Greenroom Web" width="900" />
</p>

<p>
  <img src="docs/assets/readme/docs-page.png" alt="Greenroom documentation page rendered from Markdown" width="900" />
</p>

## 🧭 Current shape

- Catalog home with quick counts and entry points into content
- Entity pages for orgs, teams, systems, and components
- Markdown docs rendered inside the app
- Content stored in-repo for low-friction editing

## 🛠️ Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
If port 3000 is already in use, Next.js will automatically pick the next available port.

## 📁 Content layout

```text
content/
  catalog/
    orgs/
    teams/
    systems/
    components/
  docs/
    getting-started/
  templates/
```

## 🚀 Useful scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run test
```

## 🗺️ Near-term roadmap

See `docs/roadmap/feature-dev-stories.md` and the Antfarm backlog entries for planned work.
