import React from 'react';
import Link from 'next/link';
import {
  CatalogEntity,
  CatalogGroupedEntities,
  CatalogKind,
  catalogKindOrder,
} from '@/lib/content';

const kindCopy: Record<CatalogKind, { heading: string; description: string; empty: string }> = {
  org: {
    heading: 'Organizations',
    description: 'Top-level orgs that own teams and systems.',
    empty: 'No organizations yet.',
  },
  team: {
    heading: 'Teams',
    description: 'Delivery groups with ownership over systems and components.',
    empty: 'No teams yet.',
  },
  system: {
    heading: 'Systems',
    description: 'Products, domains, or services operated by teams.',
    empty: 'No systems yet.',
  },
  component: {
    heading: 'Components',
    description: 'Deployables, jobs, packages, or websites under a system.',
    empty: 'No components yet.',
  },
};

function EntityCard({ entity }: { entity: CatalogEntity }) {
  return (
    <Link key={entity.slug} href={`/catalog/${entity.slug}`} className="entity-link">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <strong>{entity.title}</strong>
        <span className="badge">{entity.kind}</span>
      </div>
      <p className="muted">{entity.summary}</p>
    </Link>
  );
}

function GroupSection({ kind, entities }: { kind: CatalogKind; entities: CatalogEntity[] }) {
  const copy = kindCopy[kind];
  const hasEntities = entities.length > 0;

  return (
    <section className="panel" aria-label={`${copy.heading} group`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
        <div>
          <div className="kicker">{copy.heading}</div>
          <p className="muted" style={{ marginTop: 8 }}>{copy.description}</p>
        </div>
        <span className="badge">{kind}</span>
      </div>

      <div className="list" style={{ marginTop: 16 }}>
        {hasEntities ? entities.map((entity) => <EntityCard key={entity.slug} entity={entity} />) : (
          <div className="card" role="status">
            <p className="muted" style={{ margin: 0 }}>{copy.empty}</p>
          </div>
        )}
      </div>
    </section>
  );
}

export function CatalogGroups({ grouped }: { grouped: CatalogGroupedEntities }) {
  return (
    <div className="grid cols-2">
      {catalogKindOrder.map((kind) => (
        <GroupSection key={kind} kind={kind} entities={grouped[kind] ?? []} />
      ))}
    </div>
  );
}
