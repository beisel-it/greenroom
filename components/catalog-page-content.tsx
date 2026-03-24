"use client";

import React from 'react';
import { CatalogFilterControls } from '@/components/catalog-filter-controls';
import { CatalogGroups } from '@/components/catalog-groups';
import {
  CatalogEntity,
  CatalogFacets,
  CatalogFilters,
  filterCatalogEntities,
  groupCatalogEntities,
} from '@/lib/catalog-shared';

type FiltersState = Pick<CatalogFilters, 'owner' | 'team' | 'tag'>;

export function deriveGroupedCatalog(entities: CatalogEntity[], filters: FiltersState) {
  const filtered = filterCatalogEntities(entities, filters);
  return groupCatalogEntities(filtered);
}

type CatalogPageContentProps = {
  entities: CatalogEntity[];
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
        onTeamChange={(team) => setFilters((prev) => ({ ...prev, team }))}
        onTagChange={(tag) => setFilters((prev) => ({ ...prev, tag }))}
      />
      <CatalogGroups grouped={grouped} />
    </>
  );
}
