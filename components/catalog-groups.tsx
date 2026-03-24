import React from 'react';
import Link from 'next/link';
import {
  CatalogEntityWithRelationships,
  CatalogGroupedEntities,
  CatalogKind,
  catalogKindOrder,
} from '@/lib/catalog-core';

const kindCopy: Record<CatalogKind, { heading: string; description: string; empty: string }> = {
  Domain: {
    heading: 'Domains',
    description: 'Backstage domains that group systems by product area and ownership.',
    empty: 'No domains yet.',
  },
  System: {
    heading: 'Systems',
    description: 'Systems owned by teams and linked to domains, components, APIs, and resources.',
    empty: 'No systems yet.',
  },
  Component: {
    heading: 'Components',
    description: 'Backstage components such as services, websites, or libraries within systems.',
    empty: 'No components yet.',
  },
  API: {
    heading: 'APIs',
    description: 'APIs provided or consumed by components, organized under systems.',
    empty: 'No APIs yet.',
  },
  Resource: {
    heading: 'Resources',
    description: 'Operational dependencies like databases, queues, or external assets.',
    empty: 'No resources yet.',
  },
  Location: {
    heading: 'Locations',
    description: 'Catalog descriptors that load or reference additional Backstage entities.',
    empty: 'No locations yet.',
  },
};

function EntityCard({ entity }: { entity: CatalogEntityWithRelationships }) {
  const summary = entity.metadata.description ?? entity.summary ?? 'View entity details';

  return (
    <Link key={entity.slug} href={`/catalog/${entity.slug}`} className="entity-link">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div>
          <strong>{entity.title}</strong>
          <div className="muted" style={{ marginTop: 4 }}>{entity.entityRef}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="badge">{entity.kind}</span>
        </div>
      </div>
      <p className="muted">{summary}</p>
    </Link>
  );
}

function GroupSection({ kind, entities }: { kind: CatalogKind; entities: CatalogEntityWithRelationships[] }) {
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
