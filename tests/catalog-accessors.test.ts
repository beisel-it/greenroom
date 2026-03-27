import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { getCatalogContent, getCatalogEntities } from '../lib/content';
import { loadCatalogEntitiesFromYaml } from '../lib/catalog-loader';
import { catalogKindOrder } from '../lib/catalog-shared';

const fixturesRoot = path.join(process.cwd(), 'tests', 'fixtures', 'catalog-accessors');

function loadFixtureCatalog() {
  const loaded = loadCatalogEntitiesFromYaml({ catalogDir: fixturesRoot });
  return getCatalogEntities(loaded);
}

describe('catalog accessors facets and filters', () => {
  it('groups Backstage entities in catalog kind order and enriches relationships', () => {
    const entities = loadFixtureCatalog();
    const content = getCatalogContent(entities);

    expect(Object.keys(content.grouped)).toEqual([...catalogKindOrder]);

    const system = getCatalogContent(entities).entities.find(
      (entity) => entity.slug === 'system/platform/developer-portal',
    );
    expect(system?.relations.componentsInSystem.map((ref) => ref.slug)).toContain(
      'component/platform/greenroom-web',
    );
    expect(system?.relations.domain?.entityRef).toBe('Domain:platform/developer-experience');
  });

  it('builds unique sorted facets for owners, tags, kinds', () => {
    const entities = loadFixtureCatalog();
    const { facets, discovery } = getCatalogContent(entities);

    expect(facets.owners).toEqual(['team-a', 'team-b']);
    expect(facets.tags).toContain('web');
    expect(facets.tags).toContain('portal');
    expect(facets.kinds).toEqual([...catalogKindOrder]);
    expect(facets.lifecycles).toEqual(['experimental', 'production']);
    expect(discovery.groups.owner.find((group) => group.key === 'team-a')?.entities.length).toBeGreaterThan(0);
  });

  it('applies AND semantics across owner, kind, and tag filters', () => {
    const entities = loadFixtureCatalog();
    const filtered = getCatalogContent(
      {
        owner: 'team-a',
        kind: 'Component',
        tag: 'web',
      },
      entities,
    );

    expect(filtered.entities.map((entity) => entity.slug)).toEqual([
      'component/platform/greenroom-web',
    ]);
  });
});
