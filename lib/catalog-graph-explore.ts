import type { CatalogEntityWithRelationships, EntityReference } from './catalog-core';
import { getCatalogNeighborGroups, type CatalogNeighborGroupKey } from './catalog-graph-ui';

export type CatalogDiagramEntity = Pick<
  CatalogEntityWithRelationships,
  'entityRef' | 'slug' | 'kind' | 'title' | 'relations'
>;

export const allCatalogNeighborGroupKeys: CatalogNeighborGroupKey[] = [
  'ownership',
  'part-of',
  'depends-on',
  'api',
  'system-domain',
];

export const hierarchyCatalogNeighborGroupKeys: CatalogNeighborGroupKey[] = [
  'ownership',
  'part-of',
  'system-domain',
];

export type CatalogGraphExplorePreset = 'all' | 'hierarchy';

export function getCatalogGraphPresetKeys(preset: CatalogGraphExplorePreset) {
  return preset === 'hierarchy'
    ? hierarchyCatalogNeighborGroupKeys
    : allCatalogNeighborGroupKeys;
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

export function getCatalogEntityMermaidChart(
  entity: CatalogDiagramEntity,
  selectedKeys: CatalogNeighborGroupKey[] = allCatalogNeighborGroupKeys,
): string | null {
  const groups = getCatalogNeighborGroups(entity.relations)
    .filter((group) => selectedKeys.includes(group.key));
  const nodes = new Map<string, string>();
  const edges = new Set<string>();

  groups.forEach((group) => {
    group.items.forEach((item) => {
      if (
        item.relationLabel === 'Owned by' ||
        item.relationLabel === 'Used by' ||
        item.relationLabel === 'Provided by components' ||
        item.relationLabel === 'Consumed by components' ||
        item.relationLabel === 'Systems' ||
        item.relationLabel === 'Subdomains' ||
        item.relationLabel === 'Components' ||
        item.relationLabel === 'Subcomponents' ||
        item.relationLabel === 'APIs' ||
        item.relationLabel === 'Resources'
      ) {
        appendIncomingEdge(nodes, edges, item.entity, entity, item.relationLabel);
        return;
      }

      appendNodesAndEdge(nodes, edges, entity, item.entity, item.relationLabel);
    });
  });

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
