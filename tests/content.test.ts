import { describe, expect, it } from 'vitest';

import {
  CatalogEntity,
  catalogKindOrder,
  filterCatalogEntities,
  getCatalogContent,
  getCatalogEntities,
  getCatalogFacets,
  groupCatalogEntities,
} from '../lib/content';

describe('catalog content helpers', () => {
  const entities = getCatalogEntities();

  it('collects unique owners, teams, and tags', () => {
    const facets = getCatalogFacets(entities);

    expect(facets.owners).toEqual(['beisel-it', 'Platform Team']);
    expect(facets.teams).toEqual(['Platform Team']);
    expect(facets.tags).toEqual([
      'component',
      'nextjs',
      'org',
      'platform',
      'portal',
      'system',
      'team',
      'web',
    ]);
  });

  it('groups entities by kind with stable ordering and empty lists', () => {
    const sample: CatalogEntity[] = [
      {
        slug: 'platform-team',
        kind: 'team',
        title: 'Platform Team',
        summary: '',
        path: '/tmp/platform-team.md',
        body: '',
      },
      {
        slug: 'greenroom-web',
        kind: 'component',
        title: 'Greenroom Web',
        summary: '',
        path: '/tmp/greenroom-web.md',
        body: '',
      },
    ];

    const grouped = groupCatalogEntities(sample);

    expect(Object.keys(grouped)).toEqual(catalogKindOrder);
    expect(grouped.org).toEqual([]);
    expect(grouped.team.map((entity) => entity.slug)).toEqual(['platform-team']);
    expect(grouped.system).toEqual([]);
    expect(grouped.component.map((entity) => entity.slug)).toEqual(['greenroom-web']);
  });

  it('filters by owner', () => {
    const results = filterCatalogEntities(entities, { owner: 'Platform Team' });
    const slugs = results.map((entity) => entity.slug).sort();

    expect(slugs).toEqual(['dev-portal', 'greenroom-web', 'platform'].sort());
  });

  it('filters by team', () => {
    const results = filterCatalogEntities(entities, { team: 'Platform Team' });
    const slugs = results.map((entity) => entity.slug).sort();

    expect(slugs).toEqual(['dev-portal', 'greenroom-web'].sort());
  });

  it('filters by tag', () => {
    const results = filterCatalogEntities(entities, { tag: 'portal' });

    expect(results.map((entity) => entity.slug)).toEqual(['dev-portal']);
  });

  it('filters by multiple tags requiring all matches', () => {
    const results = filterCatalogEntities(entities, { tags: ['web', 'nextjs'] });

    expect(results.map((entity) => entity.slug)).toEqual(['greenroom-web']);
  });

  it('combines filters', () => {
    const results = filterCatalogEntities(entities, {
      owner: 'Platform Team',
      tags: ['web'],
    });

    expect(results.map((entity) => entity.slug)).toEqual(['greenroom-web']);
  });

  it('returns filtered entities, grouped kinds, and facets from one call', () => {
    const catalog = getCatalogContent({ owner: 'Platform Team' }, entities);

    expect(catalog.entities.every((entity) => entity.owner === 'Platform Team')).toBe(true);
    expect(Object.keys(catalog.grouped)).toEqual(catalogKindOrder);
    expect(catalog.grouped.org).toHaveLength(0);
    expect(catalog.grouped.team.map((entity) => entity.slug)).toEqual(['platform']);
    expect(catalog.facets.owners).toEqual(['beisel-it', 'Platform Team']);
    expect(catalog.facets.tags).toContain('portal');
  });
});
