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
  const owner = (entity.spec as { owner?: string }).owner;
  const docsLinks = (entity.metadata.links ?? []).filter((link) => link.url.startsWith('/docs'));
  const docsLink = docsLinks[0];
  const relatedSystem = entity.kind === 'System' ? entity.title : entity.relations.system?.title;
  const relatedDomain = entity.kind === 'Domain' ? entity.title : entity.relations.domain?.title;
  const namespace = entity.metadata.namespace ?? 'default';
  const lifecycle = 'lifecycle' in entity.spec ? (entity.spec as { lifecycle?: string }).lifecycle : undefined;
  const isRepoOwned = entity.slug.includes('greenroom') || entity.title.toLowerCase().includes('greenroom');

  return (
    <Link key={entity.slug} href={`/catalog/${entity.slug}`} className="entity-link entity-link-compact">
      <div className="entity-link-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <strong>{entity.title}</strong>
          <div className="muted" style={{ marginTop: 4 }}>{entity.entityRef}</div>
        </div>
        <span className="badge">{entity.kind}</span>
      </div>
      <p className="muted">{summary}</p>
      <div className="catalog-card-meta">
        {owner ? <span className="badge">Owner: {owner}</span> : null}
        {relatedDomain ? <span className="badge">Domain: {relatedDomain}</span> : null}
        {relatedSystem ? <span className="badge">System: {relatedSystem}</span> : null}
        <span className="badge">Namespace: {namespace}</span>
        {lifecycle ? <span className="badge">Lifecycle: {lifecycle}</span> : null}
        {docsLink ? <span className="badge">Reference: {docsLink.title ?? 'Linked doc'}</span> : null}
        {docsLinks.length > 1 ? <span className="badge">{docsLinks.length} docs links</span> : null}
        {isRepoOwned ? <span className="badge">Repo-owned</span> : null}
      </div>
    </Link>
  );
}

function GroupSection({ kind, entities }: { kind: CatalogKind; entities: CatalogEntityWithRelationships[] }) {
  const copy = kindCopy[kind];
  const hasEntities = entities.length > 0;

  return (
    <section id={`catalog-group-${kind.toLowerCase()}`} className="panel catalog-group-panel" aria-label={`${copy.heading} group`}>
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
    <div className="catalog-groups-grid">
      {catalogKindOrder.map((kind) => (
        <GroupSection key={kind} kind={kind} entities={grouped[kind] ?? []} />
      ))}
    </div>
  );
}
