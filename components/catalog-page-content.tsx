"use client";

import React from 'react';
import { CatalogFilterControls } from '@/components/catalog-filter-controls';
import { CatalogGroups } from '@/components/catalog-groups';
import {
  CatalogEntityWithRelationships,
  CatalogFacets,
  CatalogFilters,
  catalogKindOrder,
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

function deriveKindCounts(entities: CatalogEntityWithRelationships[]) {
  return catalogKindOrder.map((kind) => ({
    kind,
    count: entities.filter((entity) => entity.kind === kind).length,
  }));
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
  const kindCounts = React.useMemo(() => deriveKindCounts(filteredEntities), [filteredEntities]);

  return (
    <>
      <section className="panel catalog-discovery-panel" aria-label="Catalog discovery overview">
        <div className="catalog-discovery-copy">
          <div className="kicker">Discovery</div>
          <h2 style={{ marginBottom: 8 }}>Find the right owner, system, API, or doc entry point fast.</h2>
          <p className="muted" style={{ margin: 0 }}>
            The default state stays useful before filtering: grouped kinds, docs-linked entities, and ownership signals
            stay visible on wide screens.
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
          <Link href="/" className="entity-link">
            <strong>Return to unified search</strong>
            <p className="muted" style={{ marginBottom: 0 }}>Move back into the home workbench when you need cross-surface search.</p>
          </Link>
        </div>
      </section>

      <section
        className="panel catalog-context-panel"
        aria-label="Docs and catalog context"
        style={{ marginBottom: 16 }}
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

      <div className="catalog-workbench">
        <aside className="catalog-workbench-rail">
          <CatalogFilterControls
            facets={facets}
            filters={filters}
            resultCount={filteredEntities.length}
            totalCount={entities.length}
            docsLinkedCount={docsPresence.docsLinkedEntities}
            kindCounts={kindCounts}
            onQueryChange={(query) => setFilters((prev) => ({ ...prev, query }))}
            onOwnerChange={(owner) => setFilters((prev) => ({ ...prev, owner }))}
            onTagChange={(tag) => setFilters((prev) => ({ ...prev, tag }))}
            onKindChange={(kind) => setFilters((prev) => ({ ...prev, kind: kind as CatalogFilters['kind'] }))}
            onNamespaceChange={(namespace) => setFilters((prev) => ({ ...prev, namespace }))}
            onSystemChange={(system) => setFilters((prev) => ({ ...prev, system }))}
            onReset={() => setFilters({})}
          />
        </aside>

        <div className="catalog-workbench-main">
          <section className="panel catalog-group-summary" aria-label="Catalog group summary">
            <div>
              <div className="kicker">Browse</div>
              <h2 style={{ margin: '8px 0' }}>Grouped discovery stays dense and scan-friendly.</h2>
              <p className="muted" style={{ margin: 0 }}>
                Card summaries now expose ownership, domain, system, namespace, docs links, and repo-owned signals
                before you open a detail page.
              </p>
            </div>
            <div className="catalog-summary-inline">
              <span className="badge">{filteredEntities.length} visible</span>
              <span className="badge">{docsPresence.docsLinkedEntities} docs-linked</span>
              <span className="badge">{docsPresence.adrLinkedEntities} adr-linked</span>
            </div>
          </section>

          <CatalogGroups grouped={grouped} />
        </div>
      </div>
    </>
  );
}
