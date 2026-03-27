import type { EntityReference, EntityRelationships } from './catalog-core';

export type CatalogNeighborGroupKey =
  | 'ownership'
  | 'part-of'
  | 'depends-on'
  | 'api'
  | 'system-domain';

export type CatalogNeighborGroupItem = {
  entity: EntityReference;
  relationLabel: string;
};

export type CatalogNeighborGroup = {
  key: CatalogNeighborGroupKey;
  label: string;
  items: CatalogNeighborGroupItem[];
};

const catalogNeighborGroupLabels: Record<CatalogNeighborGroupKey, string> = {
  ownership: 'Ownership',
  'part-of': 'Part Of',
  'depends-on': 'Depends On',
  api: 'Provides / Consumes API',
  'system-domain': 'System / Domain',
};

function addGroupItems(
  items: CatalogNeighborGroupItem[],
  relationLabel: string,
  entities: EntityReference[],
) {
  entities.forEach((entity) => {
    if (
      items.some(
        (item) =>
          item.entity.entityRef === entity.entityRef && item.relationLabel === relationLabel,
      )
    ) {
      return;
    }

    items.push({ entity, relationLabel });
  });
}

export function getCatalogNeighborGroups(
  neighbors: EntityRelationships,
): CatalogNeighborGroup[] {
  const groups: Array<{ key: CatalogNeighborGroupKey; items: CatalogNeighborGroupItem[] }> = [
    { key: 'ownership', items: [] },
    { key: 'part-of', items: [] },
    { key: 'depends-on', items: [] },
    { key: 'api', items: [] },
    { key: 'system-domain', items: [] },
  ];

  const ownership = groups.find((group) => group.key === 'ownership')!;
  const partOf = groups.find((group) => group.key === 'part-of')!;
  const dependsOn = groups.find((group) => group.key === 'depends-on')!;
  const api = groups.find((group) => group.key === 'api')!;
  const systemDomain = groups.find((group) => group.key === 'system-domain')!;

  if (neighbors.owner) {
    addGroupItems(ownership.items, 'Owned by', [neighbors.owner]);
  }

  if (neighbors.parentDomain) {
    addGroupItems(partOf.items, 'Subdomain of', [neighbors.parentDomain]);
  }
  addGroupItems(partOf.items, 'Subdomains', neighbors.subdomains);

  if (neighbors.parentComponent) {
    addGroupItems(partOf.items, 'Subcomponent of', [neighbors.parentComponent]);
  }
  addGroupItems(partOf.items, 'Subcomponents', neighbors.subcomponents);

  addGroupItems(dependsOn.items, 'Depends on', neighbors.dependsOn);
  addGroupItems(dependsOn.items, 'Used by', neighbors.dependents);

  addGroupItems(api.items, 'Provides API', neighbors.providesApis);
  addGroupItems(api.items, 'Consumes API', neighbors.consumesApis);
  addGroupItems(api.items, 'Provided by components', neighbors.providingComponents);
  addGroupItems(api.items, 'Consumed by components', neighbors.consumingComponents);

  if (neighbors.domain) {
    addGroupItems(systemDomain.items, 'Domain', [neighbors.domain]);
  }
  addGroupItems(systemDomain.items, 'Systems', neighbors.systemsInDomain);

  if (neighbors.system) {
    addGroupItems(systemDomain.items, 'System', [neighbors.system]);
  }
  addGroupItems(systemDomain.items, 'Components', neighbors.componentsInSystem);
  addGroupItems(systemDomain.items, 'APIs', neighbors.apisInSystem);
  addGroupItems(systemDomain.items, 'Resources', neighbors.resourcesInSystem);

  return groups
    .filter((group) => group.items.length > 0)
    .map((group) => ({
      key: group.key,
      label: catalogNeighborGroupLabels[group.key],
      items: group.items,
    }));
}

export function filterCatalogNeighborGroups(
  groups: CatalogNeighborGroup[],
  selectedKeys: CatalogNeighborGroupKey[],
) {
  const selected = new Set(selectedKeys);
  return groups.filter((group) => selected.has(group.key));
}
