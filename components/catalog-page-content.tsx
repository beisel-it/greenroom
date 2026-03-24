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

type FiltersState = Pick<CatalogFilters, 'owner' | 'tag' | 'kind' | 'namespace' | 'system'>;

export function deriveGroupedCatalog(entities: CatalogEntityWithRelationships[], filters: FiltersState) {
  const filtered = filterCatalogEntities(entities, filters);
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
      />
      <CatalogGroups grouped={grouped} />
    </>
  );
}
