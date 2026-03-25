import type { CatalogEntityWithRelationships } from '@/lib/content';
import { getCatalogEntityMermaidChart } from '@/lib/catalog-graph';
import { MermaidBlock } from './mermaid-block';

export function CatalogEntityGraph({ entity }: { entity: CatalogEntityWithRelationships }) {
  const chart = getCatalogEntityMermaidChart(entity);

  if (!chart) {
    return null;
  }

  return (
    <div className="card relationship-diagram">
      <div className="kicker">Diagram</div>
      <h2>Relationship diagram</h2>
      <p className="muted relationship-diagram-copy">
        Mermaid view generated from the same direct catalog relations shown in the neighbor panels.
      </p>
      <MermaidBlock chart={chart} />
    </div>
  );
}
