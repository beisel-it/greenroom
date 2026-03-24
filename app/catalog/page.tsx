import React from 'react';
import { CatalogPageContent } from '@/components/catalog-page-content';
import { getCatalogContent } from '@/lib/content';

export default function CatalogPage() {
  const { entities, facets } = getCatalogContent();

  return (
    <>
      <section className="hero">
        <div className="kicker">Catalog</div>
        <h1>Browse catalog entities by kind.</h1>
        <p className="muted" style={{ maxWidth: 720 }}>
          Explore organizations, teams, systems, and components at a glance. Each card links to a detail page
          with ownership, relationships, and documentation.
        </p>
      </section>

      <CatalogPageContent entities={entities} facets={facets} />
    </>
  );
}
