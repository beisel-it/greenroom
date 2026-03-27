'use client';

import { useState } from 'react';
import type { CatalogEntityWithRelationships } from '@/lib/catalog-core';
import {
  getCatalogEntityMermaidChart,
  getCatalogGraphPresetKeys,
  type CatalogGraphExplorePreset,
} from '@/lib/catalog-graph-explore';
import {
  filterCatalogNeighborGroups,
  getCatalogNeighborGroups,
  type CatalogNeighborGroupKey,
} from '@/lib/catalog-neighbor-groups';
import { CatalogEntityNeighbors } from './catalog-entity-neighbors';
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
  const visibleGroups = filterCatalogNeighborGroups(groups, selectedKeys);
  const chart = getCatalogEntityMermaidChart(entity, selectedKeys);

  return (
    <section className="card catalog-explorer">
      <div className="catalog-explorer-header">
        <div>
          <div className="kicker">Explore</div>
          <h2>Graph and neighbors</h2>
          <p className="muted relationship-diagram-copy catalog-explorer-copy">
            Use the same filters across the graph canvas and neighbor index to focus the entity map without losing context.
          </p>
        </div>
        <div className="catalog-explorer-controls">
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
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="catalog-explorer-empty">
          <div className="catalog-explorer-section-heading">
            <div className="kicker">Explore</div>
            <h3>Related entities</h3>
            <p className="muted">
              This entity has no direct catalog neighbors yet. The workbench stays ready for future ownership,
              containment, API, or dependency links.
            </p>
          </div>
        </div>
      ) : (
        <>
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

      <div className="catalog-explorer-layout">
        <div className="catalog-explorer-canvas">
          <div className="catalog-explorer-section-heading">
            <div className="kicker">Diagram</div>
            <h3>Relationship diagram</h3>
            <p className="muted">
              Wide-screen graph for working through ownership, containment, APIs, and dependencies.
            </p>
          </div>
          {chart ? (
            <MermaidBlock chart={chart} />
          ) : (
            <p className="muted">No graph edges selected. Re-enable a relation group to continue exploring.</p>
          )}
        </div>

        <CatalogEntityNeighbors groups={visibleGroups} />
      </div>
        </>
      )}
    </section>
  );
}
