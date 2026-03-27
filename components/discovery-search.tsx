"use client";

import Link from 'next/link';
import React from 'react';

type SearchCatalogEntity = {
  slug: string;
  title: string;
  summary: string;
  entityRef: string;
  kind: string;
  namespace: string;
  owner?: string;
  tags: string[];
  docsLinks: number;
  isRepoOwned: boolean;
};

type SearchDocPage = {
  slug: string;
  title: string;
  summary: string;
  body: string;
};

type DiscoverySearchProps = {
  entities: SearchCatalogEntity[];
  docs: SearchDocPage[];
};

type DiscoverySearchResult = {
  catalogResults: SearchCatalogEntity[];
  docResults: SearchDocPage[];
};

const MAX_RESULTS_PER_GROUP = 6;
const MAX_SIGNAL_ITEMS = 4;

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function includesQuery(fields: Array<string | undefined>, normalizedQuery: string) {
  return fields
    .filter((field): field is string => Boolean(field))
    .some((field) => normalizeText(field).includes(normalizedQuery));
}

export function deriveDiscoverySearchResults(
  entities: SearchCatalogEntity[],
  docs: SearchDocPage[],
  query: string,
): DiscoverySearchResult {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return {
      catalogResults: entities.slice(0, MAX_RESULTS_PER_GROUP),
      docResults: docs.slice(0, MAX_RESULTS_PER_GROUP),
    };
  }

  return {
    catalogResults: entities
      .filter((entity) => includesQuery([
        entity.title,
        entity.summary,
        entity.entityRef,
        entity.kind,
        entity.owner,
        ...entity.tags,
      ], normalizedQuery))
      .slice(0, MAX_RESULTS_PER_GROUP),
    docResults: docs
      .filter((doc) => includesQuery([doc.title, doc.summary, doc.slug, doc.body], normalizedQuery))
      .slice(0, MAX_RESULTS_PER_GROUP),
  };
}

function SearchSection({
  title,
  emptyMessage,
  children,
}: {
  title: string;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  const items = React.Children.toArray(children);

  return (
    <div className="panel">
      <div className="kicker">{title}</div>
      <div className="list" style={{ marginTop: 16 }}>
        {items.length > 0 ? items : (
          <div className="card" role="status">
            <p className="muted" style={{ margin: 0 }}>{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function kindLabel(kind: string) {
  return kind === 'API' ? 'APIs' : `${kind}s`;
}

export function DiscoverySearch({ entities, docs }: DiscoverySearchProps) {
  const [query, setQuery] = React.useState('');

  const { catalogResults, docResults } = React.useMemo(
    () => deriveDiscoverySearchResults(entities, docs, query),
    [docs, entities, query],
  );

  const hasQuery = normalizeText(query).length > 0;
  const ownerCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    entities.forEach((entity) => {
      if (!entity.owner) return;
      counts.set(entity.owner, (counts.get(entity.owner) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, MAX_SIGNAL_ITEMS);
  }, [entities]);
  const kindCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    entities.forEach((entity) => counts.set(entity.kind, (counts.get(entity.kind) ?? 0) + 1));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, MAX_SIGNAL_ITEMS);
  }, [entities]);
  const repoOwned = React.useMemo(
    () => entities.filter((entity) => entity.isRepoOwned).slice(0, MAX_SIGNAL_ITEMS),
    [entities],
  );
  const docsLinkedEntities = React.useMemo(
    () => entities.filter((entity) => entity.docsLinks > 0).sort((a, b) => b.docsLinks - a.docsLinks).slice(0, MAX_SIGNAL_ITEMS),
    [entities],
  );
  const docHighlights = React.useMemo(() => docs.slice(0, MAX_SIGNAL_ITEMS), [docs]);

  return (
    <section className="discovery-workbench" aria-label="Unified discovery search">
      <aside className="panel workbench-rail" aria-label="Discovery navigation">
        <div>
          <div className="kicker">Explore</div>
          <h2 className="workbench-rail-title">Start from real work, not an empty center stage.</h2>
          <p className="muted">
            Catalog entities, docs, and repo-owned presentation surfaces stay within one screen.
          </p>
        </div>
        <div className="workbench-rail-links">
          <Link href="/catalog" className="entity-link entity-link-compact">
            <strong>Open catalog</strong>
            <p className="muted">Browse grouped entities by ownership, system, and kind.</p>
          </Link>
          <Link href="/docs" className="entity-link entity-link-compact">
            <strong>Browse docs</strong>
            <p className="muted">Open ADRs, getting started, and implementation notes.</p>
          </Link>
        </div>
        <div className="workbench-mini-list">
          <div className="kicker">Ownership</div>
          {ownerCounts.map(([owner, count]) => (
            <div key={owner} className="workbench-mini-row">
              <span>{owner}</span>
              <span className="badge">{count}</span>
            </div>
          ))}
        </div>
        <div className="workbench-mini-list">
          <div className="kicker">Kinds</div>
          {kindCounts.map(([kind, count]) => (
            <div key={kind} className="workbench-mini-row">
              <span>{kindLabel(kind)}</span>
              <span className="badge">{count}</span>
            </div>
          ))}
        </div>
      </aside>

      <div className="panel workbench-main">
        <div className="catalog-filter-header">
          <div>
            <div className="kicker">Unified search</div>
            <h2 style={{ margin: '8px 0' }}>Search everything</h2>
            <p className="muted" style={{ margin: 0 }}>
              {hasQuery
                ? 'Results stay grouped by source so you can move straight into the right surface.'
                : 'The default state is useful before search: live catalog and docs snapshots plus docs-linked and repo-owned signals stay visible.'}
            </p>
          </div>
          <div className="catalog-filter-summary" aria-live="polite">
            <strong>{hasQuery ? catalogResults.length + docResults.length : entities.length + docs.length}</strong>
            <span className="muted">{hasQuery ? ' grouped matches' : ' searchable surfaces'}</span>
          </div>
        </div>

        <label className="workbench-search-label">
          <span>Search everything</span>
          <input
            aria-label="Unified search"
            type="search"
            placeholder="Search entities, owners, APIs, docs titles, and docs content"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="workbench-results-grid">
          <SearchSection
            title={hasQuery ? 'Catalog matches' : 'Catalog snapshot'}
            emptyMessage={hasQuery ? 'No catalog entities match yet.' : 'No catalog entities available.'}
          >
            {catalogResults.map((entity) => (
              <Link key={entity.slug} href={`/catalog/${entity.slug}`} className="entity-link entity-link-compact">
                <div className="entity-link-header">
                  <strong>{entity.title}</strong>
                  <span className="badge">{entity.kind}</span>
                </div>
                <p className="muted">{entity.summary}</p>
                <div className="catalog-card-meta">
                  {entity.owner ? <span className="badge">Owner: {entity.owner}</span> : null}
                  <span className="badge">Namespace: {entity.namespace}</span>
                  {entity.docsLinks > 0 ? <span className="badge">Docs-linked</span> : null}
                  {entity.isRepoOwned ? <span className="badge">Repo-owned</span> : null}
                </div>
              </Link>
            ))}
          </SearchSection>

          <SearchSection
            title={hasQuery ? 'Docs matches' : 'Docs snapshot'}
            emptyMessage={hasQuery ? 'No docs pages match yet.' : 'No docs pages available.'}
          >
            {docResults.map((doc) => (
              <Link key={doc.slug} href={`/docs/${doc.slug}`} className="entity-link entity-link-compact">
                <strong>{doc.title}</strong>
                <p className="muted">{doc.summary}</p>
              </Link>
            ))}
          </SearchSection>
        </div>
      </div>

      <aside className="workbench-side">
        <div className="panel">
          <div className="kicker">Repo-owned</div>
          <h3 className="workbench-side-title">High-value portal surfaces</h3>
          <div className="list" style={{ marginTop: 12 }}>
            {repoOwned.length > 0 ? repoOwned.map((entity) => (
              <Link key={entity.slug} href={`/catalog/${entity.slug}`} className="entity-link entity-link-compact">
                <div className="entity-link-header">
                  <strong>{entity.title}</strong>
                  <span className="badge">{entity.kind}</span>
                </div>
                <p className="muted">{entity.summary}</p>
              </Link>
            )) : (
              <div className="card" role="status">
                <p className="muted" style={{ margin: 0 }}>Repo-owned entities will surface here as the dogfood catalog grows.</p>
              </div>
            )}
          </div>
        </div>
        <div className="panel">
          <div className="kicker">Docs-linked</div>
          <h3 className="workbench-side-title">Entities with documentation context</h3>
          <div className="list" style={{ marginTop: 12 }}>
            {docsLinkedEntities.map((entity) => (
              <Link key={entity.slug} href={`/catalog/${entity.slug}`} className="entity-link entity-link-compact">
                <div className="entity-link-header">
                  <strong>{entity.title}</strong>
                  <span className="badge">{entity.docsLinks} docs</span>
                </div>
                <p className="muted">{entity.summary}</p>
              </Link>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="kicker">Docs highlights</div>
          <div className="list" style={{ marginTop: 12 }}>
            {docHighlights.map((doc) => (
              <Link key={doc.slug} href={`/docs/${doc.slug}`} className="entity-link entity-link-compact">
                <strong>{doc.title}</strong>
                <p className="muted">{doc.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}
