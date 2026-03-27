"use client";

import React from 'react';
import type { CatalogKind, CatalogFacets, CatalogFilters } from '@/lib/catalog-core';

type CatalogFilterControlsProps = {
  facets: CatalogFacets;
  filters: Pick<CatalogFilters, 'query' | 'owner' | 'tag' | 'kind' | 'namespace' | 'system'>;
  resultCount?: number;
  totalCount?: number;
  onQueryChange?: (query?: string) => void;
  onOwnerChange?: (owner?: string) => void;
  onTagChange?: (tag?: string) => void;
  onKindChange?: (kind?: CatalogKind) => void;
  onNamespaceChange?: (namespace?: string) => void;
  onSystemChange?: (system?: string) => void;
  onReset?: () => void;
};

function handleSelectChange<T extends string>(
  handler: ((value?: T) => void) | undefined,
): (event: React.ChangeEvent<HTMLSelectElement>) => void {
  return (event) => {
    const nextValue = (event.target.value || undefined) as T | undefined;
    handler?.(nextValue);
  };
}

function renderOptions(values: string[], allLabel: string) {
  return [
    <option key="all" value="">
      {allLabel}
    </option>,
    ...values.map((value) => (
      <option key={value} value={value}>
        {value}
      </option>
    )),
  ];
}

export function CatalogFilterControls({
  facets,
  filters,
  resultCount,
  totalCount,
  onQueryChange,
  onOwnerChange,
  onTagChange,
  onKindChange,
  onNamespaceChange,
  onSystemChange,
  onReset,
}: CatalogFilterControlsProps) {
  const activeFilters = [
    filters.query ? `Search: ${filters.query}` : undefined,
    filters.owner ? `Owner: ${filters.owner}` : undefined,
    filters.tag ? `Tag: ${filters.tag}` : undefined,
    filters.kind ? `Kind: ${filters.kind}` : undefined,
    filters.namespace ? `Namespace: ${filters.namespace}` : undefined,
    filters.system ? `System: ${filters.system}` : undefined,
  ].filter((value): value is string => Boolean(value));

  return (
    <section className="panel" aria-label="Catalog filters">
      <div className="catalog-filter-header">
        <div>
          <div className="kicker" style={{ marginBottom: 12 }}>
            Filters
          </div>
          <p className="muted" style={{ margin: 0 }}>
            {typeof filters.query === 'string' && filters.query.trim().length > 0 ? 'Search and refine the catalog.' : 'Drill into owners, systems, APIs, and tags.'}
          </p>
        </div>
        {typeof totalCount === 'number' && typeof resultCount === 'number' ? (
          <div className="catalog-filter-summary" aria-live="polite">
            <strong>{resultCount}</strong>
            <span className="muted"> of {totalCount} entities</span>
          </div>
        ) : null}
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '16px 0 0' }}>
        <span>Search</span>
        <input
          id="query-filter"
          aria-label="Search filter"
          type="search"
          placeholder="Search by title, owner, system, tag, or entity ref"
          value={filters.query ?? ''}
          onChange={(event) => onQueryChange?.(event.target.value || undefined)}
        />
      </label>

      <div className="grid cols-3" style={{ gap: 12, marginTop: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Owner</span>
          <select
            id="owner-filter"
            aria-label="Owner filter"
            value={filters.owner ?? ''}
            onChange={handleSelectChange(onOwnerChange)}
          >
            {renderOptions(facets.owners, 'All owners')}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Tag</span>
          <select
            id="tag-filter"
            aria-label="Tag filter"
            value={filters.tag ?? ''}
            onChange={handleSelectChange(onTagChange)}
          >
            {renderOptions(facets.tags, 'All tags')}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Kind</span>
          <select
            id="kind-filter"
            aria-label="Kind filter"
            value={filters.kind ?? ''}
            onChange={handleSelectChange(onKindChange)}
          >
            {renderOptions(facets.kinds, 'All kinds')}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Namespace</span>
          <select
            id="namespace-filter"
            aria-label="Namespace filter"
            value={filters.namespace ?? ''}
            onChange={handleSelectChange(onNamespaceChange)}
          >
            {renderOptions(facets.namespaces, 'All namespaces')}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>System</span>
          <select
            id="system-filter"
            aria-label="System filter"
            value={filters.system ?? ''}
            onChange={handleSelectChange(onSystemChange)}
          >
            {renderOptions(facets.systems, 'All systems')}
          </select>
        </label>
      </div>

      <div className="catalog-filter-footer">
        {activeFilters.length > 0 ? (
          <div className="catalog-active-filters" aria-label="Active catalog filters">
            {activeFilters.map((filter) => (
              <span key={filter} className="badge">{filter}</span>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ margin: 0 }}>No active filters.</p>
        )}

        <button type="button" className="catalog-reset-button" onClick={onReset}>
          Clear filters
        </button>
      </div>
    </section>
  );
}
