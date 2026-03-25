import React from 'react';
import { CatalogPageContent } from '@/components/catalog-page-content';
import { getCatalogContent } from '@/lib/content';

export default function CatalogPage() {
  const { entities, facets } = getCatalogContent();

  return (
    <>
      <section className="hero">
        <div className="kicker">Catalog</div>
        <h1>Backstage-native catalog entities</h1>
        <p className="muted" style={{ maxWidth: 720 }}>
          Explore domains, systems, components, APIs, resources, and locations. Each card links to a detail page
          with ownership, relationships, and documentation context.
        </p>
      </section>

      <CatalogPageContent entities={entities} facets={facets} />
    </>
  );
}
