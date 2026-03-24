export type CatalogKind = 'org' | 'team' | 'system' | 'component';

export type CatalogEntity = {
  slug: string;
  kind: CatalogKind;
  title: string;
  summary: string;
  owner?: string;
  system?: string;
  team?: string;
  tags?: string[];
  path: string;
  body: string;
};

export type CatalogFacets = {
  owners: string[];
  teams: string[];
  tags: string[];
};

export type CatalogGroupedEntities = Record<CatalogKind, CatalogEntity[]>;

export type CatalogFilters = {
  owner?: string;
  team?: string;
  tag?: string;
  tags?: string[];
};

export const catalogKindOrder: CatalogKind[] = ['org', 'team', 'system', 'component'];

function normalizeTags(filters: CatalogFilters) {
  const incoming = filters.tags ?? (filters.tag ? [filters.tag] : []);
  return Array.from(new Set(incoming.filter(Boolean)));
}

export function groupCatalogEntities(
  entities: CatalogEntity[],
  kindOrder: CatalogKind[] = catalogKindOrder,
): CatalogGroupedEntities {
  const initial = kindOrder.reduce((acc, kind) => {
    acc[kind] = [];
    return acc;
  }, {} as CatalogGroupedEntities);

  return entities.reduce((acc, entity) => {
    acc[entity.kind]?.push(entity);
    return acc;
  }, { ...initial });
}

export function filterCatalogEntities(
  entities: CatalogEntity[],
  filters: CatalogFilters = {},
): CatalogEntity[] {
  const requestedTags = normalizeTags(filters);

  return entities.filter((entity) => {
    const matchesOwner = filters.owner ? entity.owner === filters.owner : true;
    const matchesTeam = filters.team ? entity.team === filters.team : true;

    const entityTags = entity.tags ?? [];
    const matchesTags =
      requestedTags.length === 0 || requestedTags.every((tag) => entityTags.includes(tag));

    return matchesOwner && matchesTeam && matchesTags;
  });
}
