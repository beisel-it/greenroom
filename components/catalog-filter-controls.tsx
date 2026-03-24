"use client";

import React from 'react';
import { CatalogFacets, CatalogFilters } from '@/lib/content';

type CatalogFilterControlsProps = {
  facets: CatalogFacets;
  filters: Pick<CatalogFilters, 'owner' | 'team' | 'tag'>;
  onOwnerChange?: (owner?: string) => void;
  onTeamChange?: (team?: string) => void;
  onTagChange?: (tag?: string) => void;
};

function handleSelectChange(
  handler: ((value?: string) => void) | undefined,
): (event: React.ChangeEvent<HTMLSelectElement>) => void {
  return (event) => {
    const nextValue = event.target.value || undefined;
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
  onOwnerChange,
  onTeamChange,
  onTagChange,
}: CatalogFilterControlsProps) {
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
          <span>Team</span>
          <select
            id="team-filter"
            aria-label="Team filter"
            value={filters.team ?? ''}
            onChange={handleSelectChange(onTeamChange)}
          >
            {renderOptions(facets.teams, 'All teams')}
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
      </div>
    </section>
  );
}
