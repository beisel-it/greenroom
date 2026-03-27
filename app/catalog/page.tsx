import React from 'react';
import { CatalogPageContent } from '@/components/catalog-page-content';
import { getCatalogContent } from '@/lib/content';

export default function CatalogPage() {
  const { entities, facets } = getCatalogContent();

  return (
    <>
      <section className="hero hero-workbench">
        <div className="hero-copy">
          <div className="kicker">Catalog</div>
          <h1>Backstage-native catalog entities</h1>
          <p className="muted" style={{ maxWidth: 720 }}>
            Use the catalog like a workstation, not a splash page. Filter by ownership, system, namespace, and kind
            while grouped entity browsing stays dense enough for real desktop scanning.
          </p>
        </div>
        <div className="card hero-sidekick">
          <div className="kicker">Desktop-first</div>
          <p className="muted" style={{ margin: '10px 0 0' }}>
            Persistent filters, grouped kinds, and docs-linked context stay visible together so browsing still works
            before search.
          </p>
        </div>
      </section>

      <CatalogPageContent entities={entities} facets={facets} />
    </>
  );
}
