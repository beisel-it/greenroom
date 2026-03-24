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

type FiltersState = Pick<CatalogFilters, 'owner' | 'tag' | 'kind' | 'namespace' | 'system' | 'domain'>;

export function deriveGroupedCatalog(entities: CatalogEntityWithRelationships[], filters: Partial<FiltersState>) {
  const filtered = filterCatalogEntities(entities, filters as CatalogFilters);
  return groupCatalogEntities(filtered);
}

type CatalogPageContentProps = {
  entities: CatalogEntityWithRelationships[];
  facets: CatalogFacets;
};

export function CatalogPageContent({ entities, facets }: CatalogPageContentProps) {
  const [filters, setFilters] = React.useState<FiltersState>({});

  const grouped = React.useMemo(() => deriveGroupedCatalog(entities, filters), [entities, filters]);

  return (
    <>
      <CatalogFilterControls
        facets={facets}
        filters={filters}
        onOwnerChange={(owner) => setFilters((prev) => ({ ...prev, owner }))}
        onTagChange={(tag) => setFilters((prev) => ({ ...prev, tag }))}
        onKindChange={(kind) => setFilters((prev) => ({ ...prev, kind: kind as CatalogFilters['kind'] }))}
        onNamespaceChange={(namespace) => setFilters((prev) => ({ ...prev, namespace }))}
        onSystemChange={(system) => setFilters((prev) => ({ ...prev, system }))}
        onDomainChange={(domain) => setFilters((prev) => ({ ...prev, domain }))}
      />
      <CatalogGroups grouped={grouped} />
    </>
  );
}
