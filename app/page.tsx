import { DiscoverySearch } from '@/components/discovery-search';
import { getCatalogEntities, getDocPages } from '@/lib/content';

export default function HomePage() {
  const entities = getCatalogEntities();
  const docs = getDocPages();
  const systems = entities.filter((e) => e.kind === 'System');
  const components = entities.filter((e) => e.kind === 'Component');

  return (
    <>
      <section className="hero">
        <div className="kicker">TechDocs-lite + Backstage catalog</div>
        <h1>Lean internal developer portal for domains → systems → components.</h1>
        <p className="muted">
          Greenroom keeps the model intentionally small: Backstage-native catalog entities, docs beside metadata,
          and Mermaid diagrams without the weight of full Backstage.
        </p>
      </section>

      <section className="grid cols-3" style={{ marginBottom: 24 }}>
        <div className="card"><div className="kicker">Systems</div><h2>{systems.length}</h2><p className="muted">High-level services and products.</p></div>
        <div className="card"><div className="kicker">Components</div><h2>{components.length}</h2><p className="muted">Deployables, jobs, packages, websites.</p></div>
        <div className="card"><div className="kicker">Docs</div><h2>{docs.length}</h2><p className="muted">Markdown pages rendered in-app.</p></div>
      </section>

      <DiscoverySearch
        entities={entities.map((entity) => ({
          slug: entity.slug,
          title: entity.title,
          summary: entity.summary,
          entityRef: entity.entityRef,
          kind: entity.kind,
          owner: 'owner' in entity.spec ? (entity.spec as { owner?: string }).owner : undefined,
          tags: entity.metadata.tags ?? [],
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
