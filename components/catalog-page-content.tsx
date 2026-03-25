"use client";

import React from 'react';
import { CatalogFilterControls } from '@/components/catalog-filter-controls';
import { CatalogGroups } from '@/components/catalog-groups';
import {
  CatalogEntityWithRelationships,
  CatalogFacets,
  CatalogFilters,
  filterCatalogEntities,
  groupCatalogEntities,
} from '@/lib/catalog-core';
import Link from 'next/link';

type FiltersState = Pick<CatalogFilters, 'query' | 'owner' | 'tag' | 'kind' | 'namespace' | 'system'>;

export function deriveGroupedCatalog(entities: CatalogEntityWithRelationships[], filters: FiltersState) {
  const filtered = filterCatalogEntities(entities, filters);
  return groupCatalogEntities(filtered);
}

function deriveDiscoverySummary(entities: CatalogEntityWithRelationships[]) {
  const owners = new Set<string>();
  const docsLinks = new Set<string>();
  const systems = new Set<string>();

  entities.forEach((entity) => {
    const owner = (entity.spec as { owner?: string }).owner;
    if (owner) owners.add(owner);
    if (entity.kind === 'System') systems.add(entity.entityRef);
    (entity.metadata.links ?? []).forEach((link) => docsLinks.add(link.url));
  });

  return {
    entityCount: entities.length,
    ownerCount: owners.size,
    systemCount: systems.size,
    docsCount: docsLinks.size,
  };
}

type CatalogPageContentProps = {
  entities: CatalogEntityWithRelationships[];
  facets: CatalogFacets;
};

export function CatalogPageContent({ entities, facets }: CatalogPageContentProps) {
  const [filters, setFilters] = React.useState<FiltersState>({});

  const filteredEntities = React.useMemo(() => filterCatalogEntities(entities, filters), [entities, filters]);
  const grouped = React.useMemo(() => groupCatalogEntities(filteredEntities), [filteredEntities]);
  const discoverySummary = React.useMemo(() => deriveDiscoverySummary(entities), [entities]);

  return (
    <>
      <section className="panel catalog-discovery-panel" aria-label="Catalog discovery overview">
        <div className="catalog-discovery-copy">
          <div className="kicker">Discovery</div>
          <h2 style={{ marginBottom: 8 }}>Find the right owner, system, API, or doc entry point fast.</h2>
          <p className="muted" style={{ margin: 0 }}>
            Start with search, narrow by facets, then jump into entity details or the docs index.
          </p>
        </div>
        <div className="catalog-discovery-metrics">
          <div className="card">
            <strong>{discoverySummary.entityCount}</strong>
            <div className="muted">entities</div>
          </div>
          <div className="card">
            <strong>{discoverySummary.ownerCount}</strong>
            <div className="muted">owners</div>
          </div>
          <div className="card">
            <strong>{discoverySummary.systemCount}</strong>
            <div className="muted">systems</div>
          </div>
          <div className="card">
            <strong>{discoverySummary.docsCount}</strong>
            <div className="muted">linked references</div>
          </div>
        </div>
        <div className="catalog-discovery-actions">
          <Link href="/docs" className="entity-link">
            <strong>Open docs index</strong>
            <p className="muted" style={{ marginBottom: 0 }}>Browse implementation and ADR context alongside the catalog.</p>
          </Link>
        </div>
      </section>

      <CatalogFilterControls
        facets={facets}
        filters={filters}
        resultCount={filteredEntities.length}
        totalCount={entities.length}
        onQueryChange={(query) => setFilters((prev) => ({ ...prev, query }))}
        onOwnerChange={(owner) => setFilters((prev) => ({ ...prev, owner }))}
        onTagChange={(tag) => setFilters((prev) => ({ ...prev, tag }))}
        onKindChange={(kind) => setFilters((prev) => ({ ...prev, kind: kind as CatalogFilters['kind'] }))}
        onNamespaceChange={(namespace) => setFilters((prev) => ({ ...prev, namespace }))}
        onSystemChange={(system) => setFilters((prev) => ({ ...prev, system }))}
        onReset={() => setFilters({})}
      />
      <CatalogGroups grouped={grouped} />
    </>
  );
}
