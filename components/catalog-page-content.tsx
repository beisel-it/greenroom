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

function deriveDocsPresence(entities: CatalogEntityWithRelationships[]) {
  const docsLinkedEntities = entities.filter((entity) =>
    (entity.metadata.links ?? []).some((link) => link.url.startsWith('/docs')),
  ).length;
  const adrLinkedEntities = entities.filter((entity) =>
    (entity.metadata.links ?? []).some((link) => link.url.includes('/docs/adr/')),
  ).length;

  return { docsLinkedEntities, adrLinkedEntities };
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
  const docsPresence = React.useMemo(() => deriveDocsPresence(entities), [entities]);

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

      <section
        className="panel"
        aria-label="Docs and catalog context"
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(180px, .5fr) minmax(260px, .8fr)',
          marginBottom: 16,
        }}
      >
        <div>
          <div className="kicker">Docs + Catalog</div>
          <h2 style={{ margin: '8px 0' }}>Use the catalog for facts. Use docs for narrative.</h2>
          <p className="muted" style={{ margin: 0 }}>
            Ownership, system placement, APIs, and dependencies live in the catalog. Guides and ADRs explain why the model looks the way it does and how teams should work inside it.
          </p>
        </div>
        <div className="grid" style={{ gap: 12 }}>
          <div className="card">
            <strong>{docsPresence.docsLinkedEntities}</strong>
            <div className="muted">entities with docs links</div>
          </div>
          <div className="card">
            <strong>{docsPresence.adrLinkedEntities}</strong>
            <div className="muted">entities with ADR context</div>
          </div>
        </div>
        <div className="grid" style={{ gap: 12 }}>
          <Link href="/docs/getting-started/overview" className="entity-link">
            <strong>Read the overview</strong>
            <p className="muted" style={{ marginBottom: 0 }}>
              Start with the product narrative, then pivot into entity metadata.
            </p>
          </Link>
          <Link href="/docs/adr/0003-greenroom-self-documentation" className="entity-link">
            <strong>Open current docs ADR</strong>
            <p className="muted" style={{ marginBottom: 0 }}>
              See how Greenroom documents itself through the same model it exposes.
            </p>
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
