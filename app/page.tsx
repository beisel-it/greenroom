import { DiscoverySearch } from '@/components/discovery-search';
import { getCatalogEntities, getDocPages } from '@/lib/content';

export default function HomePage() {
  const entities = getCatalogEntities();
  const docs = getDocPages();
  const systems = entities.filter((e) => e.kind === 'System');
  const components = entities.filter((e) => e.kind === 'Component');
  const apis = entities.filter((e) => e.kind === 'API');

  return (
    <>
      <section className="hero hero-workbench">
        <div className="hero-copy">
          <div className="kicker">TechDocs-lite + Backstage catalog</div>
          <h1>Developer workbench for repo-owned systems, APIs, and docs.</h1>
          <p className="muted">
            Greenroom stays lightweight, but the surface should still feel like a real working environment:
            unified search, ownership context, grouped discovery, and docs-linked entities visible before you type.
          </p>
        </div>
        <div className="hero-metrics" aria-label="Home overview">
          <div className="hero-metric">
            <span className="hero-metric-value">{systems.length}</span>
            <span className="hero-metric-label">systems</span>
          </div>
          <div className="hero-metric">
            <span className="hero-metric-value">{components.length}</span>
            <span className="hero-metric-label">components</span>
          </div>
          <div className="hero-metric">
            <span className="hero-metric-value">{apis.length}</span>
            <span className="hero-metric-label">apis</span>
          </div>
          <div className="hero-metric">
            <span className="hero-metric-value">{docs.length}</span>
            <span className="hero-metric-label">docs</span>
          </div>
        </div>
      </section>

      <section className="grid cols-3 home-signal-grid">
        <div className="card">
          <div className="kicker">Ownership</div>
          <h2>Platform-first</h2>
          <p className="muted">Most current entities roll up under platform-team, so the UI defaults now foreground ownership context instead of hiding it behind detail pages.</p>
        </div>
        <div className="card">
          <div className="kicker">Browse</div>
          <h2>Catalog before search</h2>
          <p className="muted">The default state is useful on its own: live snapshots, docs-linked entities, and repo-owned signals stay visible without requiring a query.</p>
        </div>
        <div className="card">
          <div className="kicker">Docs</div>
          <h2>Narrative in reach</h2>
          <p className="muted">Guides and ADR entry points stay adjacent to systems, components, and APIs so developers can move from facts to context without changing tools.</p>
        </div>
      </section>
      <DiscoverySearch
        entities={entities.map((entity) => ({
          slug: entity.slug,
          title: entity.title,
          summary: entity.summary,
          entityRef: entity.entityRef,
          kind: entity.kind,
          namespace: entity.metadata.namespace ?? 'default',
          owner: 'owner' in entity.spec ? (entity.spec as { owner?: string }).owner : undefined,
          tags: entity.metadata.tags ?? [],
          docsLinks: (entity.metadata.links ?? []).filter((link) => link.url.startsWith('/docs')).length,
          isRepoOwned: entity.slug.includes('greenroom') || entity.title.toLowerCase().includes('greenroom'),
        }))}
        docs={docs.map((doc) => ({
          slug: doc.slug,
          title: doc.title,
          summary: doc.summary,
          body: doc.body,
        }))}
      />
    </>
  );
}
