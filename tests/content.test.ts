import { describe, expect, it } from 'vitest';

import {
  catalogKindOrder,
  createCatalogRelationQuery,
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
    const empty = getCatalogFacets([]);
    expect(empty.owners).toEqual([]);
    expect(empty.tags).toEqual([]);
    expect(empty.kinds).toEqual(catalogKindOrder.slice());
    expect(empty.namespaces).toEqual([]);
    expect(empty.systems).toEqual([]);
  });

  it('collects unique owners, tags, and kinds', () => {
    const facets = getCatalogFacets(entities);

    expect(facets.owners).toEqual(['api-team', 'platform-team']);
    // tags come from catalog-info.yaml and may include graphql etc.
    expect(facets.tags).toContain('api');
    expect(facets.tags).toContain('database');
    expect(facets.tags).toContain('domain');
    expect(facets.tags).toContain('nextjs');
    expect(facets.tags).toContain('operations');
    expect(facets.tags).toContain('portal');
    expect(facets.tags).toContain('release');
    expect(facets.tags).toContain('web');
    expect(facets.kinds).toEqual(catalogKindOrder);
    expect(facets.namespaces).toEqual(['default', 'platform']);
    expect(facets.systems).toContain('System:default/dev-portal');
    expect(facets.systems).toContain('System:default/release-orchestrator');
  });

  it('groups entities by kind with stable ordering and empty lists', () => {
    const grouped = groupCatalogEntities(entities);

    expect(Object.keys(grouped)).toEqual(catalogKindOrder as unknown as string[]);
    expect(grouped.Domain?.map((entity) => entity.slug)).toEqual([
      'domain/default/business-operations',
      'domain/default/developer-experience',
    ]);
    expect(grouped.System?.map((entity) => entity.slug)).toEqual([
      'system/default/dev-portal',
      'system/default/release-orchestrator',
    ]);
    expect(grouped.Component?.map((entity) => entity.slug)).toEqual([
      'component/default/greenroom-web',
      'component/platform/docs-service',
    ]);
    expect(grouped.API?.map((entity) => entity.slug)).toEqual([
      'api/default/greenroom-api',
      'api/default/greenroom-async-api',
      'api/default/platform-shell-api',
    ]);
    expect(grouped.Resource?.map((entity) => entity.slug)).toEqual(['resource/default/platform-db']);
    expect(grouped.Location?.map((entity) => entity.slug)).toEqual(['location/default/sample-catalog-source']);
  });

  it('keeps catalog kind order and empty groups after filtering out all entities', () => {
    const catalog = getCatalogContent({ tags: ['non-existent'] }, entities);

    expect(Object.keys(catalog.grouped)).toEqual(catalogKindOrder as unknown as string[]);
    expect(catalog.grouped.Domain).toEqual([]);
    expect(catalog.grouped.System).toEqual([]);
    expect(catalog.grouped.Component).toEqual([]);
  });

  it('filters by owner', () => {
    const results = filterCatalogEntities(entities, { owner: 'platform-team' });
    const slugs = results.map((entity) => entity.slug).sort();

    expect(slugs).toEqual([
      'api/default/platform-shell-api',
      'component/default/greenroom-web',
      'component/platform/docs-service',
      'domain/default/business-operations',
      'domain/default/developer-experience',
      'resource/default/platform-db',
      'system/default/dev-portal',
      'system/default/release-orchestrator',
    ].sort());
  });

  it('filters by tag', () => {
    const results = filterCatalogEntities(entities, { tag: 'portal' });

    expect(results.map((entity) => entity.slug)).toEqual(['system/default/dev-portal']);
  });

  it('filters by multiple tags requiring all matches', () => {
    const results = filterCatalogEntities(entities, { tags: ['web', 'nextjs'] });

    expect(results.map((entity) => entity.slug)).toEqual(['component/default/greenroom-web']);
  });

  it('applies combined owner and tag filters with AND semantics', () => {
    const results = filterCatalogEntities(entities, {
      owner: 'platform-team',
      tags: ['web', 'nextjs'],
    });

    expect(results.map((entity) => entity.slug)).toEqual(['component/default/greenroom-web']);
  });

  it('filters by namespace and system facets', () => {
    const namespaceFiltered = filterCatalogEntities(entities, { namespace: 'platform' });
    expect(namespaceFiltered.map((entity) => entity.slug)).toEqual(['component/platform/docs-service']);

    const systemFiltered = filterCatalogEntities(entities, { system: 'dev-portal' });
    expect(systemFiltered.map((entity) => entity.slug).sort()).toEqual([
      'api/default/greenroom-api',
      'api/default/greenroom-async-api',
      'api/default/platform-shell-api',
      'component/default/greenroom-web',
      'component/platform/docs-service',
      'resource/default/platform-db',
      'system/default/dev-portal',
    ].sort());
  });

  it('returns filtered entities, grouped kinds, and facets from one call', () => {
    const catalog = getCatalogContent({ owner: 'platform-team' }, entities);

    expect(catalog.entities.every((entity) => 'owner' in entity.spec ? (entity.spec as { owner?: string }).owner === 'platform-team' : false)).toBe(true);
    expect(Object.keys(catalog.grouped)).toEqual(catalogKindOrder as unknown as string[]);
    expect(catalog.grouped.Component?.map((entity) => entity.slug)).toEqual([
      'component/default/greenroom-web',
      'component/platform/docs-service',
    ]);
    expect(catalog.facets.owners).toEqual(['api-team', 'platform-team']);
    expect(catalog.facets.tags).toContain('portal');
    expect(catalog.facets.systems).toContain('System:default/dev-portal');
  });

  it('loads catalog entities from catalog-info.yaml fixtures', () => {
    expect(entities.length).toBeGreaterThan(0);
    expect(entities.every((entity) => catalogKindOrder.includes(entity.kind))).toBe(true);
  });
  it('derives relationships from sample catalog content', () => {
    const greenroomWeb = entities.find((entity) => entity.slug === 'component/default/greenroom-web');
    const docsService = entities.find((entity) => entity.slug === 'component/platform/docs-service');
    const api = entities.find((entity) => entity.slug === 'api/default/platform-shell-api');
    const system = entities.find((entity) => entity.slug === 'system/default/dev-portal');
    const resource = entities.find((entity) => entity.slug === 'resource/default/platform-db');

    expect(greenroomWeb?.relations.system?.entityRef).toBe('System:default/dev-portal');
    expect(greenroomWeb?.relations.providesApis.map((ref) => ref.entityRef).sort()).toEqual([
      'API:default/greenroom-api',
      'API:default/platform-shell-api',
    ]);
    expect(greenroomWeb?.relations.dependsOn.map((ref) => ref.entityRef)).toEqual(['Resource:default/platform-db']);

    expect(docsService?.relations.system?.entityRef).toBe('System:default/dev-portal');
    expect(docsService?.relations.consumesApis.map((ref) => ref.entityRef)).toEqual(['API:default/platform-shell-api']);
    expect(docsService?.relations.dependsOn.map((ref) => ref.entityRef)).toEqual(['Resource:default/platform-db']);

    expect(api?.relations.providingComponents.map((ref) => ref.entityRef)).toEqual([
      'Component:default/greenroom-web',
    ]);
    expect(api?.relations.consumingComponents.map((ref) => ref.entityRef)).toEqual([
      'Component:platform/docs-service',
    ]);

    expect(system?.relations.domain?.entityRef).toBe('Domain:default/developer-experience');
    expect(system?.relations.componentsInSystem.map((ref) => ref.entityRef).sort()).toEqual([
      'Component:default/greenroom-web',
      'Component:platform/docs-service',
    ]);
    expect(system?.relations.apisInSystem.map((ref) => ref.entityRef).sort()).toEqual([
      'API:default/greenroom-api',
      'API:default/greenroom-async-api',
      'API:default/platform-shell-api',
    ]);
    expect(system?.relations.resourcesInSystem.map((ref) => ref.entityRef)).toEqual(['Resource:default/platform-db']);

    expect(resource?.relations.system?.entityRef).toBe('System:default/dev-portal');
    expect(entities.every((entity) => entity.brokenReferences.length === 0)).toBe(true);
  });

  it('derives domain explorer relationships for populated and empty domains', () => {
    const developerExperience = entities.find(
      (entity) => entity.slug === 'domain/default/developer-experience',
    );
    const businessOperations = entities.find(
      (entity) => entity.slug === 'domain/default/business-operations',
    );

    expect(developerExperience?.relations.systemsInDomain.map((ref) => ref.entityRef)).toEqual([
      'System:default/dev-portal',
      'System:default/release-orchestrator',
    ]);
    expect(businessOperations?.relations.systemsInDomain).toEqual([]);
  });

  it('exposes computed Backstage relations through a query helper', () => {
    const query = createCatalogRelationQuery(entities);

    expect(
      query.getOutgoing('Component:default/greenroom-web', 'providesApi').map((edge) => edge.target.entityRef),
    ).toEqual([
      'API:default/greenroom-api',
      'API:default/platform-shell-api',
    ]);
    expect(
      query.getOutgoing('Resource:default/platform-db', 'dependencyOf').map((edge) => edge.target.entityRef).sort(),
    ).toEqual([
      'Component:default/greenroom-web',
      'Component:platform/docs-service',
    ]);
    expect(
      query.getOutgoing('System:default/dev-portal', 'hasPart').map((edge) => edge.target.entityRef).sort(),
    ).toEqual([
      'API:default/greenroom-api',
      'API:default/greenroom-async-api',
      'API:default/platform-shell-api',
      'Component:default/greenroom-web',
      'Component:platform/docs-service',
      'Resource:default/platform-db',
    ]);
  });
});

describe('docs navigation helpers', () => {
  it('builds a hierarchical tree with filesystem-driven ordering', () => {
    const tree = getDocTree();

    expect(tree.map((node) => node.slug)).toEqual(['adr', 'getting-started']);
    expect(tree[0].title).toBe('Adr');
    expect(tree[0].children.map((child) => child.slug)).toEqual([
      'adr/0002-entity-rendering',
    ]);
    expect(tree[1].title).toBe('Getting Started');
    expect(tree[1].children.map((child) => child.slug)).toEqual([
      'getting-started/contributing',
      'getting-started/overview',
    ]);
    expect(tree[1].children[0].summary).toContain('Markdown');
    expect(tree[1].children[1].title).toBe('Overview');
  });

  it('flattens the tree into an ordered list with previous and next neighbors', () => {
    const nav = getDocNavList();

    expect(nav.map((item) => item.slug)).toEqual([
      'adr/0002-entity-rendering',
      'getting-started/contributing',
      'getting-started/overview',
    ]);

    expect(nav[0].previous).toBeUndefined();
    expect(nav[0].next).toEqual({
      slug: 'getting-started/contributing',
      title: 'Contributing content',
      slugParts: ['getting-started', 'contributing'],
    });

    expect(nav[1].previous).toEqual({
      slug: 'adr/0002-entity-rendering',
      title: '0002-entity-rendering',
      slugParts: ['adr', '0002-entity-rendering'],
    });
    expect(nav[1].next).toEqual({
      slug: 'getting-started/overview',
      title: 'Overview',
      slugParts: ['getting-started', 'overview'],
    });

    expect(nav[2].previous).toEqual({
      slug: 'getting-started/contributing',
      title: 'Contributing content',
      slugParts: ['getting-started', 'contributing'],
    });
    expect(nav[2].next).toBeUndefined();
  });
});
