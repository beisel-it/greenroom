"use client";

import Link from 'next/link';
import React from 'react';

type SearchCatalogEntity = {
  slug: string;
  title: string;
  summary: string;
  entityRef: string;
  kind: string;
  owner?: string;
  tags: string[];
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

export function DiscoverySearch({ entities, docs }: DiscoverySearchProps) {
  const [query, setQuery] = React.useState('');

  const { catalogResults, docResults } = React.useMemo(
    () => deriveDiscoverySearchResults(entities, docs, query),
    [docs, entities, query],
  );

  const hasQuery = normalizeText(query).length > 0;

  return (
    <section className="panel" aria-label="Unified discovery search">
      <div className="catalog-filter-header">
        <div>
          <div className="kicker">Unified search</div>
          <h2 style={{ margin: '8px 0' }}>Search catalog entities and docs together.</h2>
          <p className="muted" style={{ margin: 0 }}>
            {hasQuery ? 'Results are grouped by source so you can jump straight into the right surface.' : 'Start from one box, then branch into catalog entities or documentation.'}
          </p>
        </div>
        {hasQuery ? (
          <div className="catalog-filter-summary" aria-live="polite">
            <strong>{catalogResults.length + docResults.length}</strong>
            <span className="muted"> grouped matches</span>
          </div>
        ) : null}
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16 }}>
        <span>Search everything</span>
        <input
          aria-label="Unified search"
          type="search"
          placeholder="Search entities, owners, APIs, docs titles, and docs content"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <div className="grid cols-2" style={{ marginTop: 20 }}>
        <SearchSection
          title={hasQuery ? 'Catalog matches' : 'Catalog snapshot'}
          emptyMessage={hasQuery ? 'No catalog entities match yet.' : 'No catalog entities available.'}
        >
          {catalogResults.map((entity) => (
            <Link key={entity.slug} href={`/catalog/${entity.slug}`} className="entity-link">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <strong>{entity.title}</strong>
                <span className="badge">{entity.kind}</span>
              </div>
              <p className="muted">{entity.summary}</p>
            </Link>
          ))}
        </SearchSection>

        <SearchSection
          title={hasQuery ? 'Docs matches' : 'Docs snapshot'}
          emptyMessage={hasQuery ? 'No docs pages match yet.' : 'No docs pages available.'}
        >
          {docResults.map((doc) => (
            <Link key={doc.slug} href={`/docs/${doc.slug}`} className="entity-link">
              <strong>{doc.title}</strong>
              <p className="muted">{doc.summary}</p>
            </Link>
          ))}
        </SearchSection>
      </div>
    </section>
  );
}
