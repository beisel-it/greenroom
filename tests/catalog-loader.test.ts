import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { loadCatalogEntitiesFromYaml } from '../lib/catalog-loader';

const fixturesRoot = path.join(process.cwd(), 'tests', 'fixtures', 'catalog-loader');

describe('catalog-info loader', () => {
  it('loads a single catalog-info.yaml into normalized entities with slugs', () => {
    const entities = loadCatalogEntitiesFromYaml({ catalogDir: path.join(fixturesRoot, 'single') });

    expect(entities).toHaveLength(1);

    const entity = entities[0];
    expect(entity.kind).toBe('Component');
    expect(entity.metadata.namespace).toBe('default');
    expect(entity.entityRef).toBe('Component:default/greenroom-web');
    expect(entity.slug).toBe('component/default/greenroom-web');
    expect(entity.location.document).toBe(1);
  });

  it('loads multi-document catalog-info.yaml files', () => {
    const entities = loadCatalogEntitiesFromYaml({ catalogDir: path.join(fixturesRoot, 'multi') });

    expect(entities).toHaveLength(2);
    expect(entities.map((entity) => entity.entityRef)).toEqual([
      'API:default/platform-shell-api',
      'Component:platform/platform-shell',
    ]);
    expect(entities.map((entity) => entity.slug)).toEqual([
      'api/default/platform-shell-api',
      'component/platform/platform-shell',
    ]);
  });

  it('raises YAML parse errors with file and document context', () => {
    expect(() =>
      loadCatalogEntitiesFromYaml({ catalogDir: path.join(fixturesRoot, 'invalid') }),
    ).toThrow(/invalid\/catalog-info\.yaml \(document 1\):/i);
  });

  it('raises validation errors with file and document context for unsupported kinds', () => {
    expect(() =>
      loadCatalogEntitiesFromYaml({ catalogDir: path.join(fixturesRoot, 'unsupported') }),
    ).toThrow(/unsupported\/catalog-info\.yaml \(document 1\): Unsupported entity kind/);
  });
});
