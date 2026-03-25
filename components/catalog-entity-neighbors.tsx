'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CatalogEntityWithRelationships } from '@/lib/content';
import {
  filterCatalogNeighborGroups,
  getCatalogNeighborGroups,
  type CatalogNeighborGroupKey,
} from '@/lib/catalog-neighbor-groups';

type CatalogEntityNeighborsProps = {
  entity: CatalogEntityWithRelationships;
};

export function CatalogEntityNeighbors({ entity }: CatalogEntityNeighborsProps) {
  const groups = getCatalogNeighborGroups(entity.relations);
  const [selectedKeys, setSelectedKeys] = useState<CatalogNeighborGroupKey[]>(
    groups.map((group) => group.key),
  );

  const visibleGroups = filterCatalogNeighborGroups(groups, selectedKeys);

  if (groups.length === 0) {
    return (
      <div className="card">
        <div className="kicker">Neighbors</div>
        <p className="muted" style={{ marginTop: 12 }}>
          This entity has no direct catalog neighbors yet.
        </p>
      </div>
    );
  }

  return (
    <div className="card neighbors-panel">
      <div className="neighbors-header">
        <div>
          <div className="kicker">Neighbors</div>
          <p className="muted neighbors-intro">
            Direct relationships grouped from the catalog graph.
          </p>
        </div>
        <div className="neighbors-filter-list" aria-label="Neighbor relation filters">
          {groups.map((group) => {
            const active = selectedKeys.includes(group.key);
            return (
              <button
                key={group.key}
                type="button"
                className={`neighbors-filter ${active ? 'active' : ''}`}
                aria-pressed={active}
                onClick={() =>
                  setSelectedKeys((current) =>
                    current.includes(group.key)
                      ? current.filter((key) => key !== group.key)
                      : [...current, group.key],
                  )
                }
              >
                {group.label}
                <span className="neighbors-filter-count">{group.items.length}</span>
              </button>
            );
          })}
        </div>
      </div>

      {visibleGroups.length === 0 ? (
        <p className="muted" style={{ marginTop: 12 }}>
          No relation groups selected.
        </p>
      ) : (
        <div className="neighbors-group-grid">
          {visibleGroups.map((group) => (
            <section key={group.key} className="neighbors-group">
              <div className="neighbors-group-header">
                <h2>{group.label}</h2>
                <span className="badge">{group.items.length}</span>
              </div>
              <div className="list" style={{ marginTop: 12 }}>
                {group.items.map((item) => (
                  <Link
                    key={`${group.key}:${item.relationLabel}:${item.entity.entityRef}`}
                    href={`/catalog/${item.entity.slug}`}
                    className="entity-link"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <strong>{item.entity.title}</strong>
                      <span className="badge">{item.entity.kind}</span>
                    </div>
                    <p className="muted">{item.relationLabel}</p>
                    <p className="muted">{item.entity.entityRef}</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
