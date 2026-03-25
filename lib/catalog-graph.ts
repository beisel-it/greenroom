import { attachCatalogRelationships } from './catalog-core';
import type {
  BrokenReference,
  CatalogEntityWithRelationships,
  EntityReference,
  EntityRelationships,
} from './catalog-core';
import { loadCatalogEntitiesFromYaml } from './catalog-loader';

export type CatalogEntityNeighbors = EntityRelationships;

export type CatalogEntityRelationsResponse = {
  entity: EntityReference;
  neighbors: CatalogEntityNeighbors;
  brokenReferences: BrokenReference[];
};

export type CatalogDiagramEntity = Pick<
  CatalogEntityWithRelationships,
  'entityRef' | 'slug' | 'kind' | 'title' | 'relations'
>;

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
  neighbors: CatalogEntityNeighbors,
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

function escapeMermaidLabel(value: string) {
  return value.replace(/"/g, "'").replace(/\n+/g, ' ').trim();
}

function toMermaidNodeId(entityRef: string) {
  return `node_${entityRef.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase()}`;
}

function toMermaidNode(entity: EntityReference | CatalogDiagramEntity, accent: 'focus' | 'default') {
  const id = toMermaidNodeId(entity.entityRef);
  const label = escapeMermaidLabel(`${entity.title}\\n${entity.kind}`);
  return `${id}["${label}"]:::${accent}`;
}

function appendNodesAndEdge(
  nodes: Map<string, string>,
  edges: Set<string>,
  source: EntityReference | CatalogDiagramEntity,
  target: EntityReference,
  relationLabel: string,
) {
  nodes.set(source.entityRef, toMermaidNode(source, 'focus'));
  nodes.set(target.entityRef, toMermaidNode(target, 'default'));
  edges.add(
    `${toMermaidNodeId(source.entityRef)} -->|${escapeMermaidLabel(relationLabel)}| ${toMermaidNodeId(target.entityRef)}`,
  );
}

function appendIncomingEdge(
  nodes: Map<string, string>,
  edges: Set<string>,
  source: EntityReference,
  target: EntityReference | CatalogDiagramEntity,
  relationLabel: string,
) {
  nodes.set(source.entityRef, toMermaidNode(source, 'default'));
  nodes.set(target.entityRef, toMermaidNode(target, 'focus'));
  edges.add(
    `${toMermaidNodeId(source.entityRef)} -->|${escapeMermaidLabel(relationLabel)}| ${toMermaidNodeId(target.entityRef)}`,
  );
}

export function getCatalogEntityMermaidChart(entity: CatalogDiagramEntity): string | null {
  const { relations } = entity;
  const nodes = new Map<string, string>();
  const edges = new Set<string>();

  if (relations.owner) {
    appendIncomingEdge(nodes, edges, relations.owner, entity, 'owns');
  }

  if (relations.domain) {
    appendNodesAndEdge(nodes, edges, entity, relations.domain, 'in domain');
  }

  if (relations.parentDomain) {
    appendNodesAndEdge(nodes, edges, entity, relations.parentDomain, 'subdomain of');
  }

  if (relations.system) {
    appendNodesAndEdge(nodes, edges, entity, relations.system, 'part of system');
  }

  if (relations.parentComponent) {
    appendNodesAndEdge(nodes, edges, entity, relations.parentComponent, 'subcomponent of');
  }

  relations.providesApis.forEach((ref) => appendNodesAndEdge(nodes, edges, entity, ref, 'provides API'));
  relations.consumesApis.forEach((ref) => appendNodesAndEdge(nodes, edges, entity, ref, 'consumes API'));
  relations.dependsOn.forEach((ref) => appendNodesAndEdge(nodes, edges, entity, ref, 'depends on'));
  relations.systemsInDomain.forEach((ref) => appendIncomingEdge(nodes, edges, ref, entity, 'in domain'));
  relations.subdomains.forEach((ref) => appendIncomingEdge(nodes, edges, ref, entity, 'subdomain of'));
  relations.componentsInSystem.forEach((ref) => appendIncomingEdge(nodes, edges, ref, entity, 'part of system'));
  relations.subcomponents.forEach((ref) => appendIncomingEdge(nodes, edges, ref, entity, 'subcomponent of'));
  relations.apisInSystem.forEach((ref) => appendIncomingEdge(nodes, edges, ref, entity, 'api in system'));
  relations.resourcesInSystem.forEach((ref) => appendIncomingEdge(nodes, edges, ref, entity, 'resource in system'));
  relations.providingComponents.forEach((ref) => appendIncomingEdge(nodes, edges, ref, entity, 'provides API'));
  relations.consumingComponents.forEach((ref) => appendIncomingEdge(nodes, edges, ref, entity, 'consumes API'));
  relations.dependents.forEach((ref) => appendIncomingEdge(nodes, edges, ref, entity, 'depends on'));

  if (edges.size === 0) {
    return null;
  }

  return [
    'flowchart LR',
    ...nodes.values(),
    ...edges.values(),
    'classDef focus fill:#0f766e,stroke:#134e4a,color:#f8fafc,stroke-width:2px;',
    'classDef default fill:#f8fafc,stroke:#94a3b8,color:#0f172a;',
  ].join('\n');
}
