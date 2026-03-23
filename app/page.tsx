import Link from 'next/link';
import { getCatalogEntities, getDocPages } from '@/lib/content';

export default function HomePage() {
  const entities = getCatalogEntities();
  const docs = getDocPages();
  const systems = entities.filter((e) => e.kind === 'system');
  const components = entities.filter((e) => e.kind === 'component');

  return (
    <>
      <section className="hero">
        <div className="kicker">TechDocs-lite + service catalog</div>
        <h1>Lean internal developer portal for org → team → system → component.</h1>
        <p className="muted">
          Greenroom keeps the model intentionally small: markdown-first catalog entries, docs beside entities,
          and Mermaid diagrams without the weight of full Backstage.
        </p>
      </section>

      <section className="grid cols-3" style={{ marginBottom: 24 }}>
        <div className="card"><div className="kicker">Systems</div><h2>{systems.length}</h2><p className="muted">High-level services and products.</p></div>
        <div className="card"><div className="kicker">Components</div><h2>{components.length}</h2><p className="muted">Deployables, jobs, packages, websites.</p></div>
        <div className="card"><div className="kicker">Docs</div><h2>{docs.length}</h2><p className="muted">Markdown pages rendered in-app.</p></div>
      </section>

      <section className="grid cols-2">
        <div className="panel">
          <div className="kicker">Catalog snapshot</div>
          <div className="list" style={{ marginTop: 16 }}>
            {entities.slice(0, 6).map((entity) => (
              <Link key={entity.slug} href={`/catalog/${entity.slug}`} className="entity-link">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <strong>{entity.title}</strong>
                  <span className="badge">{entity.kind}</span>
                </div>
                <p className="muted">{entity.summary}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="kicker">Docs snapshot</div>
          <div className="list" style={{ marginTop: 16 }}>
            {docs.slice(0, 6).map((doc) => (
              <Link key={doc.slug} href={`/docs/${doc.slug}`} className="entity-link">
                <strong>{doc.title}</strong>
                <p className="muted">{doc.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
