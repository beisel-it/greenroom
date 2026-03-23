import { describe, expect, it } from 'vitest';

import {
  filterCatalogEntities,
  getCatalogEntities,
  getCatalogFacets,
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

  it('combines filters', () => {
    const results = filterCatalogEntities(entities, {
      owner: 'Platform Team',
      tags: ['web'],
    });

    expect(results.map((entity) => entity.slug)).toEqual(['greenroom-web']);
  });
});
