import { describe, expect, it } from 'vitest';

import { getCatalogEntities } from '../lib/content';
import {
  filterCatalogNeighborGroups,
  getCatalogEntityRelations,
  getCatalogNeighborGroups,
} from '../lib/catalog-graph';

describe('catalog graph helper', () => {
  const entities = getCatalogEntities();

  it('returns neighbor relations from Backstage catalog references for a component', () => {
    const response = getCatalogEntityRelations('component/default/greenroom-web', entities);

    expect(response).not.toBeNull();
    expect(response?.entity).toMatchObject({
      entityRef: 'Component:default/greenroom-web',
      slug: 'component/default/greenroom-web',
      kind: 'Component',
    });
    expect(response?.neighbors.owner?.entityRef).toBe('Group:default/platform-team');
    expect(response?.neighbors.system?.entityRef).toBe('System:default/dev-portal');
    expect(response?.neighbors.providesApis.map((ref) => ref.entityRef)).toEqual([
      'API:default/platform-shell-api',
    ]);
    expect(response?.neighbors.dependsOn.map((ref) => ref.entityRef)).toEqual([
      'Resource:default/platform-db',
    ]);
    expect(response?.brokenReferences).toEqual([]);
  });

  it('returns domain and part-of neighbors for a system', () => {
    const response = getCatalogEntityRelations('system/default/dev-portal', entities);

    expect(response?.neighbors.owner?.entityRef).toBe('Group:default/platform-team');
    expect(response?.neighbors.domain?.entityRef).toBe('Domain:default/developer-experience');
    expect(response?.neighbors.componentsInSystem.map((ref) => ref.entityRef).sort()).toEqual([
      'Component:default/greenroom-web',
      'Component:platform/docs-service',
    ]);
    expect(response?.neighbors.apisInSystem.map((ref) => ref.entityRef)).toEqual([
      'API:default/platform-shell-api',
    ]);
    expect(response?.neighbors.resourcesInSystem.map((ref) => ref.entityRef)).toEqual([
      'Resource:default/platform-db',
    ]);
  });

  it('uses the same derived relation graph for domains with multiple and empty system sets', () => {
    const populatedDomain = getCatalogEntityRelations('domain/default/developer-experience', entities);
    const emptyDomain = getCatalogEntityRelations('domain/default/business-operations', entities);

    expect(populatedDomain?.neighbors.systemsInDomain.map((ref) => ref.entityRef)).toEqual([
      'System:default/dev-portal',
      'System:default/release-orchestrator',
    ]);
    expect(emptyDomain?.neighbors.systemsInDomain).toEqual([]);
  });

  it('groups entity neighbors into UI relation buckets', () => {
    const response = getCatalogEntityRelations('system/default/dev-portal', entities);
    const groups = getCatalogNeighborGroups(response!.neighbors);

    expect(groups.map((group) => group.key)).toEqual([
      'ownership',
      'system-domain',
    ]);
    expect(groups.find((group) => group.key === 'ownership')?.items).toEqual([
      expect.objectContaining({
        relationLabel: 'Owned by',
        entity: expect.objectContaining({ entityRef: 'Group:default/platform-team' }),
      }),
    ]);
    expect(groups.find((group) => group.key === 'system-domain')?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          relationLabel: 'Domain',
          entity: expect.objectContaining({ entityRef: 'Domain:default/developer-experience' }),
        }),
        expect.objectContaining({
          relationLabel: 'Components',
          entity: expect.objectContaining({ entityRef: 'Component:default/greenroom-web' }),
        }),
      ]),
    );
  });

  it('filters grouped neighbors by selected relation types', () => {
    const response = getCatalogEntityRelations('component/default/greenroom-web', entities);
    const groups = getCatalogNeighborGroups(response!.neighbors);
    const filtered = filterCatalogNeighborGroups(groups, ['api', 'depends-on']);

    expect(filtered.map((group) => group.key)).toEqual(['depends-on', 'api']);
  });

  it('supports domain to system to component traversal through the derived graph', () => {
    const domain = getCatalogEntityRelations('domain/default/developer-experience', entities);
    const systemRef = domain?.neighbors.systemsInDomain.find(
      (ref) => ref.entityRef === 'System:default/dev-portal',
    );

    expect(systemRef).toBeDefined();

    const system = getCatalogEntityRelations(systemRef!.slug, entities);
    const componentRef = system?.neighbors.componentsInSystem.find(
      (ref) => ref.entityRef === 'Component:default/greenroom-web',
    );

    expect(componentRef).toBeDefined();

    const component = getCatalogEntityRelations(componentRef!.slug, entities);
    expect(component?.neighbors.system?.entityRef).toBe('System:default/dev-portal');
    expect(system?.neighbors.domain?.entityRef).toBe('Domain:default/developer-experience');
  });

  it('returns null for an unknown entity slug', () => {
    expect(getCatalogEntityRelations('component/default/missing-service', entities)).toBeNull();
  });
});
