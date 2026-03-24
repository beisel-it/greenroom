import React from 'react';
import { CatalogGroups } from '@/components/catalog-groups';
import { getCatalogContent } from '@/lib/content';

export default function CatalogPage() {
  const { grouped } = getCatalogContent();

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

      <CatalogGroups grouped={grouped} />
    </>
  );
}
