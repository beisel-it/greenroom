import type { CatalogEntityWithRelationships } from '@/lib/content';
import { getCatalogEntityMermaidChart, getGraphTraversalPath } from '@/lib/catalog-graph';
import { CatalogEntityGraphClient } from './catalog-entity-graph-client';

export function CatalogEntityGraph({ entity }: { entity: CatalogEntityWithRelationships }) {
  const chart = getCatalogEntityMermaidChart(entity);
  const traversalPath = getGraphTraversalPath(entity.slug) ?? [];

  if (!chart) {
    return null;
  }

  return <CatalogEntityGraphClient entity={entity} traversalPath={traversalPath} />;
}
