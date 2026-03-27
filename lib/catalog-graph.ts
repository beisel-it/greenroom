import { attachCatalogRelationships } from './catalog-core';
import type {
  BrokenReference,
  CatalogEntityWithRelationships,
  EntityReference,
} from './catalog-core';
import { loadCatalogEntitiesFromYaml } from './catalog-loader';
import type { CatalogEntityNeighbors } from './catalog-neighbor-groups';
export {
  filterCatalogNeighborGroups,
  getCatalogNeighborGroups,
  type CatalogEntityNeighbors,
  type CatalogNeighborGroup,
  type CatalogNeighborGroupItem,
  type CatalogNeighborGroupKey,
} from './catalog-neighbor-groups';

export type CatalogEntityRelationsResponse = {
  entity: EntityReference;
  neighbors: import('./catalog-neighbor-groups').CatalogEntityNeighbors;
  brokenReferences: BrokenReference[];
};

export type CatalogDiagramEntity = Pick<
  CatalogEntityWithRelationships,
  'entityRef' | 'slug' | 'kind' | 'title' | 'relations'
>;
function toEntityReference(entity: CatalogEntityWithRelationships): EntityReference {
  return {
    entityRef: entity.entityRef,
    slug: entity.slug,
    kind: entity.kind,
    name: entity.metadata.name,
    namespace: entity.metadata.namespace ?? 'default',
    title: entity.title,
  };
}

export function getCatalogEntityRelations(
  slug: string,
  entitiesOverride?: CatalogEntityWithRelationships[],
): CatalogEntityRelationsResponse | null {
  const entities = entitiesOverride ?? attachCatalogRelationships(loadCatalogEntitiesFromYaml());
  const entity = entities.find((entry) => entry.slug === slug);

  if (!entity) {
    return null;
  }

  return {
    entity: toEntityReference(entity),
    neighbors: entity.relations,
    brokenReferences: entity.brokenReferences,
  };
}

function getTraversalParent(neighbors: CatalogEntityNeighbors) {
  return (
    neighbors.parentComponent ??
    neighbors.system ??
    neighbors.parentDomain ??
    neighbors.domain ??
    null
  );
}

export type TraversalStep = { slug: string; kind: string; title: string };

export function getGraphTraversalPath(
  startSlug: string,
  entitiesOverride?: CatalogEntityWithRelationships[],
  maxDepth: number = 3,
): TraversalStep[] | null {
  if (maxDepth < 1) {
    return [];
  }

  const path: TraversalStep[] = [];
  const visited = new Set<string>();
  let current = getCatalogEntityRelations(startSlug, entitiesOverride);

  while (current && !visited.has(current.entity.entityRef) && path.length < maxDepth) {
    visited.add(current.entity.entityRef);
    path.unshift({
      slug: current.entity.slug,
      kind: current.entity.kind,
      title: current.entity.title,
    });

    const parent = getTraversalParent(current.neighbors);
    current = parent ? getCatalogEntityRelations(parent.slug, entitiesOverride) : null;
  }

  return path;
}

export {
  allCatalogNeighborGroupKeys,
  getCatalogEntityMermaidChart,
  getCatalogGraphPresetKeys,
  hierarchyCatalogNeighborGroupKeys,
  type CatalogGraphExplorePreset,
} from './catalog-graph-explore';
