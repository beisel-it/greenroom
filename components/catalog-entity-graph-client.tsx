'use client';

import { useState } from 'react';
import type { CatalogEntityWithRelationships } from '@/lib/catalog-core';
import {
  allCatalogNeighborGroupKeys,
  getCatalogEntityMermaidChart,
  getCatalogGraphPresetKeys,
  type CatalogGraphExplorePreset,
} from '@/lib/catalog-graph-explore';
import { getCatalogNeighborGroups, type CatalogNeighborGroupKey } from '@/lib/catalog-graph-ui';
import { MermaidBlock } from './mermaid-block';

type TraversalStep = {
  slug: string;
  kind: string;
  title: string;
};

type CatalogEntityGraphClientProps = {
  entity: CatalogEntityWithRelationships;
  traversalPath: TraversalStep[];
};

const graphPresetCopy: Record<CatalogGraphExplorePreset, string> = {
  all: 'Show all edges',
  hierarchy: 'Focus hierarchy path',
};

export function CatalogEntityGraphClient({
  entity,
  traversalPath,
}: CatalogEntityGraphClientProps) {
  const groups = getCatalogNeighborGroups(entity.relations);
  const [selectedKeys, setSelectedKeys] = useState<CatalogNeighborGroupKey[]>(
    groups.map((group) => group.key),
  );
  const [preset, setPreset] = useState<CatalogGraphExplorePreset>('all');
  const chart = getCatalogEntityMermaidChart(entity, selectedKeys);

  return (
    <div className="card relationship-diagram">
      <div className="kicker">Diagram</div>
      <div className="relationship-diagram-header">
        <div>
          <h2>Relationship diagram</h2>
          <p className="muted relationship-diagram-copy">
            Mermaid view generated from the same direct catalog relations shown in the neighbor panels.
          </p>
        </div>
        <div className="relationship-diagram-preset-list" aria-label="Graph exploration presets">
          {(['all', 'hierarchy'] as CatalogGraphExplorePreset[]).map((presetKey) => {
            const active = presetKey === preset;
            return (
              <button
                key={presetKey}
                type="button"
                className={`neighbors-filter ${active ? 'active' : ''}`}
                aria-pressed={active}
                onClick={() => {
                  setPreset(presetKey);
                  setSelectedKeys(getCatalogGraphPresetKeys(presetKey));
                }}
              >
                {graphPresetCopy[presetKey]}
              </button>
            );
          })}
        </div>
      </div>

      {traversalPath.length > 1 ? (
        <div className="relationship-diagram-path">
          <span className="entity-breadcrumb-label">Traversal path</span>
          <div className="relationship-diagram-path-list">
            {traversalPath.map((step) => (
              <span key={step.slug} className="badge">
                {step.title}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="neighbors-filter-list" aria-label="Diagram edge filters">
        {groups.map((group) => {
          const active = selectedKeys.includes(group.key);
          return (
            <button
              key={group.key}
              type="button"
              className={`neighbors-filter ${active ? 'active' : ''}`}
              aria-pressed={active}
              onClick={() => {
                setPreset('all');
                setSelectedKeys((current) =>
                  current.includes(group.key)
                    ? current.filter((key) => key !== group.key)
                    : [...current, group.key],
                );
              }}
            >
              {group.label}
              <span className="neighbors-filter-count">{group.items.length}</span>
            </button>
          );
        })}
      </div>

      {chart ? (
        <MermaidBlock chart={chart} />
      ) : (
        <p className="muted">No graph edges selected. Re-enable a relation group to continue exploring.</p>
      )}
    </div>
  );
}
