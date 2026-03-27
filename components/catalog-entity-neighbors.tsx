import Link from 'next/link';
import {
  type CatalogNeighborGroup,
} from '@/lib/catalog-neighbor-groups';

type CatalogEntityNeighborsProps = {
  groups: CatalogNeighborGroup[];
};

export function CatalogEntityNeighbors({ groups }: CatalogEntityNeighborsProps) {
  if (groups.length === 0) {
    return (
      <section className="catalog-explorer-neighbors">
        <div className="catalog-explorer-section-heading">
          <div className="kicker">Neighbor index</div>
          <h3>Related entities</h3>
        </div>
        <p className="muted">
          This entity has no direct catalog neighbors yet.
        </p>
      </section>
    );
  }

  return (
    <section className="catalog-explorer-neighbors">
      <div className="catalog-explorer-section-heading">
        <div className="kicker">Neighbor index</div>
        <h3>Related entities</h3>
        <p className="muted neighbors-intro">
          Filtered relationship groups stay aligned with the graph canvas.
        </p>
      </div>

      <div className="catalog-explorer-neighbor-groups">
        {groups.map((group) => (
          <section key={group.key} className="neighbors-group neighbors-group-compact">
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
    </section>
  );
}
