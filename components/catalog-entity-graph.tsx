import type { CatalogEntityWithRelationships } from '@/lib/content';
import { getGraphTraversalPath } from '@/lib/catalog-graph';
import { CatalogEntityGraphClient } from './catalog-entity-graph-client';

export function CatalogEntityGraph({ entity }: { entity: CatalogEntityWithRelationships }) {
  const traversalPath = getGraphTraversalPath(entity.slug) ?? [];

  return <CatalogEntityGraphClient entity={entity} traversalPath={traversalPath} />;
}
