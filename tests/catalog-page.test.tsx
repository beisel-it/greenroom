import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

import CatalogPage from '../app/catalog/page';
import { CatalogGroups } from '../components/catalog-groups';
import { deriveGroupedCatalog } from '../components/catalog-page-content';
import { getCatalogContent } from '../lib/content';
import { CatalogGroupedEntities, groupCatalogEntities } from '../lib/catalog-shared';

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
    expect(markup).toContain('Browse catalog entities by kind.');
    expect(markup).toContain('Filters');

    expect(markup.indexOf('Organizations')).toBeLessThan(markup.indexOf('Teams'));
    expect(markup.indexOf('Teams')).toBeLessThan(markup.indexOf('Systems'));
    expect(markup.indexOf('Systems')).toBeLessThan(markup.indexOf('Components'));

    expect(markup).toContain('Greenroom Web');
    expect(markup).toContain('Developer Portal');
    expect(markup).toContain('Platform Team');
    expect(markup).toContain('/catalog/greenroom-web');
    expect(markup).toContain('/catalog/dev-portal');
    expect(markup).toContain('/catalog/platform');
  });

  it('shows empty states for kinds without entities', () => {
    const emptyGrouped: CatalogGroupedEntities = {
      org: [],
      team: [],
      system: [],
      component: [],
    };

    const markup = renderToString(<CatalogGroups grouped={emptyGrouped} />);

    expect(markup).toContain('No organizations yet.');
    expect(markup).toContain('No teams yet.');
    expect(markup).toContain('No systems yet.');
    expect(markup).toContain('No components yet.');
  });

  it('applies owner, team, and tag filters before grouping and keeps empty groups visible', () => {
    const { entities } = getCatalogContent();

    const groupedByOwner = deriveGroupedCatalog(entities, { owner: 'Platform Team' });
    expect(groupedByOwner.org).toHaveLength(0);
    expect(groupedByOwner.team.map((e) => e.slug)).toEqual(['platform']);
    expect(groupedByOwner.system.map((e) => e.slug)).toEqual(['dev-portal']);
    expect(groupedByOwner.component.map((e) => e.slug)).toEqual(['greenroom-web']);

    const groupedByTag = deriveGroupedCatalog(entities, { tag: 'portal' });
    expect(groupedByTag.org).toHaveLength(0);
    expect(groupedByTag.team).toHaveLength(0);
    expect(groupedByTag.system.map((e) => e.slug)).toEqual(['dev-portal']);
    expect(groupedByTag.component).toHaveLength(0);
  });

  it('clears filters back to the full grouped catalog view', () => {
    const { entities } = getCatalogContent();

    const resetGrouped = deriveGroupedCatalog(entities, {});
    const fullGrouped = groupCatalogEntities(entities);

    expect(resetGrouped).toEqual(fullGrouped);
  });
});
