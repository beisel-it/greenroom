import { describe, expect, it } from 'vitest';

import {
  CatalogEntity,
  catalogKindOrder,
  filterCatalogEntities,
  getCatalogContent,
  getCatalogEntities,
  getCatalogFacets,
  getDocNavList,
  getDocTree,
  groupCatalogEntities,
} from '../lib/content';

describe('catalog content helpers', () => {
  const entities = getCatalogEntities();

  it('returns empty facets when no entities are provided', () => {
    expect(getCatalogFacets([])).toEqual({ owners: [], teams: [], tags: [] });
  });

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

  it('handles missing optional fields while keeping facets unique and sorted', () => {
    const sample: CatalogEntity[] = [
      {
        slug: 'alpha',
        kind: 'component',
        title: 'Alpha',
        summary: '',
        path: '/tmp/alpha.md',
        body: '',
        owner: 'Owner A',
        tags: ['b'],
      },
      {
        slug: 'beta',
        kind: 'component',
        title: 'Beta',
        summary: '',
        path: '/tmp/beta.md',
        body: '',
        team: 'Team A',
        tags: ['a', 'b'],
      },
      {
        slug: 'gamma',
        kind: 'component',
        title: 'Gamma',
        summary: '',
        path: '/tmp/gamma.md',
        body: '',
        owner: 'Owner A',
        team: 'Team A',
      },
    ];

    const facets = getCatalogFacets(sample);

    expect(facets.owners).toEqual(['Owner A']);
    expect(facets.teams).toEqual(['Team A']);
    expect(facets.tags).toEqual(['a', 'b']);
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

  it('keeps catalog kind order and empty groups after filtering out all entities', () => {
    const sample: CatalogEntity[] = [
      {
        slug: 'org-a',
        kind: 'org',
        title: 'Org A',
        summary: '',
        path: '/tmp/org-a.md',
        body: '',
        owner: 'Owner A',
      },
      {
        slug: 'team-a',
        kind: 'team',
        title: 'Team A',
        summary: '',
        path: '/tmp/team-a.md',
        body: '',
        team: 'Team A',
        tags: ['internal'],
      },
    ];

    const catalog = getCatalogContent({ tags: ['non-existent'] }, sample);

    expect(Object.keys(catalog.grouped)).toEqual(catalogKindOrder);
    expect(catalog.grouped.org).toEqual([]);
    expect(catalog.grouped.team).toEqual([]);
    expect(catalog.grouped.system).toEqual([]);
    expect(catalog.grouped.component).toEqual([]);
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

  it('applies combined owner, team, and tag filters with AND semantics', () => {
    const sample: CatalogEntity[] = [
      {
        slug: 'alpha',
        kind: 'component',
        title: 'Alpha',
        summary: '',
        path: '/tmp/alpha.md',
        body: '',
        owner: 'Owner A',
        team: 'Team A',
        tags: ['a', 'b'],
      },
      {
        slug: 'beta',
        kind: 'component',
        title: 'Beta',
        summary: '',
        path: '/tmp/beta.md',
        body: '',
        owner: 'Owner A',
        team: 'Team A',
        tags: ['a'],
      },
      {
        slug: 'gamma',
        kind: 'component',
        title: 'Gamma',
        summary: '',
        path: '/tmp/gamma.md',
        body: '',
        owner: 'Owner A',
        team: 'Team B',
        tags: ['a', 'b'],
      },
    ];

    const results = filterCatalogEntities(sample, {
      owner: 'Owner A',
      team: 'Team A',
      tags: ['a', 'b'],
    });

    expect(results.map((entity) => entity.slug)).toEqual(['alpha']);
  });

  it('combines filters against live entities', () => {
    const results = filterCatalogEntities(entities, {
      owner: 'Platform Team',
      team: 'Platform Team',
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

describe('docs navigation helpers', () => {
  it('builds a hierarchical tree with filesystem-driven ordering', () => {
    const tree = getDocTree();

    expect(tree.map((node) => node.slug)).toEqual(['getting-started']);
    expect(tree[0].title).toBe('Getting Started');
    expect(tree[0].children.map((child) => child.slug)).toEqual([
      'getting-started/contributing',
      'getting-started/overview',
    ]);
    expect(tree[0].children[0].summary).toContain('Markdown');
    expect(tree[0].children[1].title).toBe('Overview');
  });

  it('flattens the tree into an ordered list with previous and next neighbors', () => {
    const nav = getDocNavList();

    expect(nav.map((item) => item.slug)).toEqual([
      'getting-started/contributing',
      'getting-started/overview',
    ]);

    expect(nav[0].previous).toBeUndefined();
    expect(nav[0].next).toEqual({
      slug: 'getting-started/overview',
      title: 'Overview',
      slugParts: ['getting-started', 'overview'],
    });

    expect(nav[1].previous).toEqual({
      slug: 'getting-started/contributing',
      title: 'Contributing content',
      slugParts: ['getting-started', 'contributing'],
    });
    expect(nav[1].next).toBeUndefined();
  });
});
