import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

import CatalogPage from '../app/catalog/page';
import { CatalogGroups } from '../components/catalog-groups';
import { deriveGroupedCatalog } from '../components/catalog-page-content';
import { CatalogFilterControls } from '../components/catalog-filter-controls';
import { getCatalogContent } from '../lib/content';
import { CatalogGroupedEntities, catalogKindOrder, groupCatalogEntities } from '../lib/catalog-core';

vi.mock('next/link', () => {
  const Link = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  );
  Link.displayName = 'Link';
  return { default: Link };
});

describe('catalog index page', () => {
  it('renders hero, filters, and grouped sections with entity cards and detail links', () => {
    const markup = renderToString(<CatalogPage />);

    expect(markup).toContain('Catalog');
    expect(markup).toContain('Backstage-native catalog entities');
    expect(markup).toContain('Discovery');
    expect(markup).toContain('Open docs index');
    expect(markup).toContain('Filters');
    expect(markup).toContain('Search');

    expect(markup).toContain('Domains');
    expect(markup).toContain('Systems');
    expect(markup).toContain('Components');
    expect(markup).toContain('APIs');

    expect(markup).toContain('Greenroom Web');
    expect(markup).toContain('Developer Portal');
    expect(markup).toContain('/catalog/component/default/greenroom-web');
    expect(markup).toContain('/catalog/system/default/dev-portal');
    expect(markup).toContain('/catalog/domain/default/developer-experience');
    expect(markup).toContain('platform-team');
  });

  it('shows empty states for kinds without entities', () => {
    const emptyGrouped: CatalogGroupedEntities = catalogKindOrder.reduce((acc, kind) => {
      acc[kind] = [];
      return acc;
    }, {} as CatalogGroupedEntities);

    const markup = renderToString(<CatalogGroups grouped={emptyGrouped} />);

    expect(markup).toContain('No domains yet.');
    expect(markup).toContain('No systems yet.');
    expect(markup).toContain('No components yet.');
    expect(markup).toContain('No APIs yet.');
    expect(markup).toContain('No resources yet.');
  });

  it('applies owner, tag, and kind filters before grouping', () => {
    const { entities } = getCatalogContent();

    const groupedByOwner = deriveGroupedCatalog(entities, { owner: 'platform-team' });
    expect(groupedByOwner.Domain?.length).toBeGreaterThan(1);
    expect(groupedByOwner.System?.map((e) => e.slug)).toEqual([
      'system/default/dev-portal',
      'system/default/release-orchestrator',
    ]);
    expect(groupedByOwner.Component?.map((e) => e.slug)).toContain('component/default/greenroom');
    expect(groupedByOwner.Component?.map((e) => e.slug)).toContain('component/default/greenroom-web');

    const groupedByTag = deriveGroupedCatalog(entities, { tag: 'api' });
    expect(groupedByTag.API?.map((e) => e.slug)).toEqual([
      'api/default/greenroom-api',
      'api/default/greenroom-async-api',
      'api/default/platform-shell-api',
    ]);
  });

  it('applies text query filters before grouping', () => {
    const { entities } = getCatalogContent();

    const groupedByQuery = deriveGroupedCatalog(entities, { query: 'release orchestrator' });

    expect(groupedByQuery.System?.map((entity) => entity.slug)).toEqual([
      'system/default/release-orchestrator',
    ]);
  });

  it('clears filters back to the full grouped catalog view', () => {
    const { entities } = getCatalogContent();

    const resetGrouped = deriveGroupedCatalog(entities, {});
    const fullGrouped = groupCatalogEntities(entities);

    expect(resetGrouped).toEqual(fullGrouped);
  });

  it('renders active filters and query controls', () => {
    const { facets } = getCatalogContent();
    const markup = renderToString(
      <CatalogFilterControls
        facets={facets}
        filters={{ query: 'portal', owner: 'platform-team' }}
        resultCount={2}
        totalCount={8}
      />,
    );

    expect(markup).toContain('Search filter');
    expect(markup).toContain('2');
    expect(markup).toContain('8');
    expect(markup).toContain('entities');
    expect(markup).toContain('Search: portal');
    expect(markup).toContain('Owner: platform-team');
    expect(markup).toContain('Clear filters');
  });
});
