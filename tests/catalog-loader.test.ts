import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  CatalogAggregateLoadError,
  loadCatalogEntitiesFromYaml,
} from '../lib/catalog-loader';

const fixturesRoot = path.join(process.cwd(), 'tests', 'fixtures', 'catalog-loader');

describe('catalog-info loader', () => {
  it('accepts the sample catalog-info.yaml with all MVP kinds and normalizes refs', () => {
    const entities = loadCatalogEntitiesFromYaml({
      catalogDir: path.join(process.cwd(), 'content', 'catalog'),
    });

    expect(entities.map((entity) => entity.kind)).toEqual([
      'API',
      'API',
      'API',
      'Component',
      'Component',
      'Domain',
      'Domain',
      'Location',
      'Resource',
      'System',
      'System',
    ]);

    const greenroomWeb = entities.find((entity) => entity.metadata.name === 'greenroom-web');
    const docsService = entities.find((entity) => entity.metadata.name === 'docs-service');
    const developerPortal = entities.find(
      (entity) => entity.kind === 'System' && entity.metadata.name === 'dev-portal',
    );
    const greenroomApi = entities.find((entity) => entity.metadata.name === 'greenroom-api');
    const greenroomAsyncApi = entities.find(
      (entity) => entity.metadata.name === 'greenroom-async-api',
    );

    expect(greenroomWeb?.spec).toMatchObject({
      system: 'System:default/dev-portal',
      providesApis: [
        'API:default/platform-shell-api',
        'API:default/greenroom-api',
      ],
      dependsOn: ['Resource:default/platform-db'],
    });
    expect(docsService?.spec).toMatchObject({
      system: 'System:default/dev-portal',
      consumesApis: ['API:default/platform-shell-api'],
      dependsOn: ['Resource:default/platform-db'],
    });
    expect(developerPortal?.spec).toMatchObject({
      domain: 'Domain:default/developer-experience',
    });
    expect(greenroomApi?.spec).toMatchObject({
      type: 'openapi',
      system: 'System:default/dev-portal',
      links: [
        {
          url: 'https://example.com/openapi/greenroom.yaml',
          title: 'OpenAPI spec',
        },
      ],
    });
    expect(greenroomAsyncApi?.spec).toMatchObject({
      type: 'asyncapi',
      system: 'System:default/dev-portal',
      links: [
        {
          url: 'https://example.com/asyncapi.yaml',
          title: 'AsyncAPI spec',
        },
      ],
    });
  });

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

  it('surfaces deterministic structured validation errors with offending fields', () => {
    try {
      loadCatalogEntitiesFromYaml({ catalogDir: path.join(fixturesRoot, 'mixed-invalid') });
      throw new Error('expected catalog load to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogAggregateLoadError);
      const loadError = error as CatalogAggregateLoadError;

      expect(loadError.errors).toHaveLength(2);
      expect(loadError.errors.map((entry) => ({
        code: entry.code,
        document: entry.document,
        field: entry.field,
      }))).toEqual([
        { code: 'validation', document: 2, field: 'metadata.name' },
        { code: 'validation', document: 3, field: undefined },
      ]);
      expect(loadError.message).toContain('mixed-invalid/catalog-info.yaml (document 2) [field: metadata.name]');
      expect(loadError.message).toContain('mixed-invalid/catalog-info.yaml (document 3): Unsupported entity kind');
    }
  });
});
