"use client";

import React from 'react';
import type { CatalogKind, CatalogFacets, CatalogFilters } from '@/lib/content';

type CatalogFilterControlsProps = {
  facets: CatalogFacets;
  filters: Pick<CatalogFilters, 'owner' | 'tag' | 'kind' | 'namespace' | 'system' | 'domain'>;
  onOwnerChange?: (owner?: string) => void;
  onTagChange?: (tag?: string) => void;
  onKindChange?: (kind?: CatalogKind) => void;
  onNamespaceChange?: (namespace?: string) => void;
  onSystemChange?: (system?: string) => void;
  onDomainChange?: (domain?: string) => void;
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

export function CatalogFilterControls({ facets, filters, onOwnerChange, onTagChange, onKindChange, onNamespaceChange, onSystemChange, onDomainChange }: CatalogFilterControlsProps) {
  return (
    <section className="panel" aria-label="Catalog filters">
      <div className="kicker" style={{ marginBottom: 12 }}>
        Filters
      </div>

      <div className="grid cols-3" style={{ gap: 12 }}>
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

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Domain</span>
          <select
            id="domain-filter"
            aria-label="Domain filter"
            value={filters.domain ?? ''}
            onChange={handleSelectChange(onDomainChange)}
          >
            {renderOptions(facets.domains, 'All domains')}
          </select>
        </label>
      </div>
    </section>
  );
}
