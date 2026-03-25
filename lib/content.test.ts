import { describe, expect, it } from 'vitest';

import {
  attachCatalogRelationships,
  deriveCatalogRelationships,
  getCatalogEntity,
} from './content';
import { catalogEntityRef, catalogEntitySlug } from './catalog-loader';
import type { LoadedCatalogEntity } from './catalog-loader';
import { formatEntityRef } from './catalog-shared';

function makeEntity(partial: Omit<LoadedCatalogEntity, 'entityRef' | 'slug' | 'location'> & { location?: LoadedCatalogEntity['location'] }): LoadedCatalogEntity {
  const entityRef = catalogEntityRef(partial as LoadedCatalogEntity);
  const slug = catalogEntitySlug(partial as LoadedCatalogEntity);
  return {
    ...partial,
    entityRef,
    slug,
    location: partial.location ?? { file: '/tmp/catalog-info.yaml', document: 1 },
  } as LoadedCatalogEntity;
}

describe('deriveCatalogRelationships', () => {
  const domain = makeEntity({
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Domain',
    metadata: { name: 'devx' },
    spec: { owner: 'platform' },
  });

  const system = makeEntity({
    apiVersion: 'backstage.io/v1beta1',
    kind: 'System',
    metadata: { name: 'dev-portal' },
    spec: { owner: 'platform', domain: 'devx' },
  });

  const component = makeEntity({
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Component',
    metadata: { name: 'greenroom-web' },
    spec: { owner: 'platform', lifecycle: 'production', type: 'website', system: 'dev-portal' },
  });

  it('derives relationships using normalized entity refs', () => {
    const { relationships, byEntity } = deriveCatalogRelationships([domain, system, component]);

    expect(relationships.domainSystems[formatEntityRef({ kind: 'Domain', name: 'devx', namespace: 'default' })]).toEqual([
      {
        entityRef: formatEntityRef({ kind: 'System', name: 'dev-portal', namespace: 'default' }),
        slug: 'system/default/dev-portal',
        kind: 'System',
        name: 'dev-portal',
        namespace: 'default',
        title: 'dev-portal',
      },
    ]);

    expect(relationships.systemComponents[formatEntityRef({ kind: 'System', name: 'dev-portal', namespace: 'default' })]).toEqual([
      {
        entityRef: formatEntityRef({ kind: 'Component', name: 'greenroom-web', namespace: 'default' }),
        slug: 'component/default/greenroom-web',
        kind: 'Component',
        name: 'greenroom-web',
        namespace: 'default',
        title: 'greenroom-web',
      },
    ]);

    expect(byEntity[system.entityRef].domain?.entityRef).toBe(domain.entityRef);
    expect(byEntity[component.entityRef].system?.entityRef).toBe(system.entityRef);
  });

  it('records broken references when targets cannot be resolved', () => {
    const orphanSystem = makeEntity({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'System',
      metadata: { name: 'unknown-system' },
      spec: { owner: 'platform', domain: 'missing-domain' },
    });

    const orphanComponent = makeEntity({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Component',
      metadata: { name: 'orphan' },
      spec: { owner: 'platform', lifecycle: 'production', type: 'website', system: 'missing-system' },
    });

    const { relationships } = deriveCatalogRelationships([orphanSystem, orphanComponent]);

    expect(relationships.domainSystems[orphanSystem.entityRef]).toBeUndefined();
    expect(relationships.systemComponents[orphanSystem.entityRef]).toBeUndefined();
    expect(relationships.brokenReferences.map((ref) => ref.field)).toEqual([
      'spec.domain',
      'spec.system',
    ]);
  });

  it('resolves relative refs against the source entity namespace', () => {
    const system = makeEntity({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'System',
      metadata: { name: 'dev-portal', namespace: 'platform' },
      spec: { owner: 'platform' },
    });
    const api = makeEntity({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'API',
      metadata: { name: 'portal-api', namespace: 'platform' },
      spec: { owner: 'platform', lifecycle: 'production', type: 'graphql', system: 'dev-portal' },
    });
    const resource = makeEntity({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Resource',
      metadata: { name: 'platform-db', namespace: 'platform' },
      spec: { owner: 'platform', type: 'postgres', lifecycle: 'production', system: 'dev-portal' },
    });
    const component = makeEntity({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Component',
      metadata: { name: 'greenroom-web', namespace: 'platform' },
      spec: {
        owner: 'platform',
        lifecycle: 'production',
        type: 'website',
        system: 'dev-portal',
        providesApis: ['portal-api'],
        dependsOn: ['Resource:platform-db'],
      },
    });

    const { byEntity } = deriveCatalogRelationships([system, api, resource, component]);

    expect(byEntity[component.entityRef].system?.entityRef).toBe('System:platform/dev-portal');
    expect(byEntity[component.entityRef].providesApis.map((ref) => ref.entityRef)).toEqual([
      'API:platform/portal-api',
    ]);
    expect(byEntity[component.entityRef].dependsOn.map((ref) => ref.entityRef)).toEqual([
      'Resource:platform/platform-db',
    ]);
  });

  it('derives owner refs and parent-child partOf relations without custom relationship fields', () => {
    const domain = makeEntity({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Domain',
      metadata: { name: 'platform', namespace: 'ops' },
      spec: { owner: 'ops-team' },
    });
    const subdomain = makeEntity({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Domain',
      metadata: { name: 'developer-experience', namespace: 'ops' },
      spec: { owner: 'ops-team', subdomainOf: 'platform' },
    });
    const system = makeEntity({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'System',
      metadata: { name: 'dev-portal', namespace: 'ops' },
      spec: { owner: 'ops-team', domain: 'developer-experience' },
    });
    const component = makeEntity({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Component',
      metadata: { name: 'frontend-shell', namespace: 'ops' },
      spec: {
        owner: 'ops-team',
        lifecycle: 'production',
        type: 'website',
        system: 'dev-portal',
      },
    });
    const childComponent = makeEntity({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Component',
      metadata: { name: 'search-panel', namespace: 'ops' },
      spec: {
        owner: 'ops-team',
        lifecycle: 'production',
        type: 'website',
        system: 'dev-portal',
        subcomponentOf: 'frontend-shell',
      },
    });

    const { relationships, byEntity } = deriveCatalogRelationships([
      domain,
      subdomain,
      system,
      component,
      childComponent,
    ]);

    expect(byEntity[system.entityRef].owner?.entityRef).toBe('Group:ops/ops-team');
    expect(byEntity[subdomain.entityRef].parentDomain?.entityRef).toBe('Domain:ops/platform');
    expect(byEntity[childComponent.entityRef].parentComponent?.entityRef).toBe(
      'Component:ops/frontend-shell',
    );
    expect(relationships.domainSubdomains[domain.entityRef].map((ref) => ref.entityRef)).toEqual([
      'Domain:ops/developer-experience',
    ]);
    expect(
      relationships.componentSubcomponents[component.entityRef].map((ref) => ref.entityRef),
    ).toEqual(['Component:ops/search-panel']);
  });

  it('derives reverse dependency relations from dependencyOf semantics', () => {
    const resource = makeEntity({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Resource',
      metadata: { name: 'platform-db' },
      spec: { owner: 'platform', type: 'postgres', lifecycle: 'production', dependencyOf: ['greenroom-web'] },
    });
    const component = makeEntity({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Component',
      metadata: { name: 'greenroom-web' },
      spec: { owner: 'platform', lifecycle: 'production', type: 'website', system: 'dev-portal' },
    });
    const system = makeEntity({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'System',
      metadata: { name: 'dev-portal' },
      spec: { owner: 'platform' },
    });

    const { byEntity, relationships } = deriveCatalogRelationships([system, resource, component]);

    expect(byEntity[resource.entityRef].dependents.map((ref) => ref.entityRef)).toEqual([
      'Component:default/greenroom-web',
    ]);
    expect(byEntity[component.entityRef].dependsOn.map((ref) => ref.entityRef)).toEqual([
      'Resource:default/platform-db',
    ]);
    expect(relationships.dependents[resource.entityRef].map((ref) => ref.entityRef)).toEqual([
      'Component:default/greenroom-web',
    ]);
  });
});

describe('getCatalogEntity', () => {
  const domain = makeEntity({
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Domain',
    metadata: { name: 'devx' },
    spec: { owner: 'platform' },
  });
  const system = makeEntity({
    apiVersion: 'backstage.io/v1beta1',
    kind: 'System',
    metadata: { name: 'dev-portal' },
    spec: { owner: 'platform', domain: 'devx' },
  });
  const component = makeEntity({
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Component',
    metadata: { name: 'greenroom-web' },
    spec: { owner: 'platform', lifecycle: 'production', type: 'website', system: 'dev-portal' },
  });

  const entities = attachCatalogRelationships([domain, system, component]);

  it('adds related systems for domain entities', () => {
    const entity = getCatalogEntity(domain.slug, entities);

    expect(entity?.relations.systemsInDomain.map((ref) => ref.slug)).toEqual(['system/default/dev-portal']);
    expect(entity?.relations.componentsInSystem).toEqual([]);
    expect(entity?.brokenReferences).toEqual([]);
  });

  it('adds derived parent-child relations to attached entities', () => {
    const parent = makeEntity({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Component',
      metadata: { name: 'shell' },
      spec: { owner: 'platform', lifecycle: 'production', type: 'website', system: 'dev-portal' },
    });
    const child = makeEntity({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Component',
      metadata: { name: 'search-panel' },
      spec: {
        owner: 'platform',
        lifecycle: 'production',
        type: 'website',
        system: 'dev-portal',
        subcomponentOf: 'shell',
      },
    });
    const attached = attachCatalogRelationships([system, parent, child]);

    const parentEntity = getCatalogEntity(parent.slug, attached);
    const childEntity = getCatalogEntity(child.slug, attached);

    expect(parentEntity?.relations.subcomponents.map((ref) => ref.entityRef)).toEqual([
      'Component:default/search-panel',
    ]);
    expect(childEntity?.relations.parentComponent?.entityRef).toBe('Component:default/shell');
  });

  it('adds related components for system entities', () => {
    const entity = getCatalogEntity(system.slug, entities);

    expect(entity?.relations.componentsInSystem.map((ref) => ref.slug)).toEqual(['component/default/greenroom-web']);
    expect(entity?.relations.systemsInDomain).toEqual([]);
    expect(entity?.brokenReferences).toEqual([]);
  });

  it('includes broken references scoped to the requested entity', () => {
    const orphan = makeEntity({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'System',
      metadata: { name: 'orphan-system' },
      spec: { owner: 'platform', domain: 'missing-domain' },
      location: { file: '/tmp/orphan.yaml', document: 3 },
    });
    const orphanEntities = attachCatalogRelationships([orphan]);

    const systemEntity = getCatalogEntity(orphan.slug, orphanEntities);

    expect(systemEntity?.brokenReferences).toEqual([
      {
        source: expect.objectContaining({ entityRef: orphan.entityRef }),
        field: 'spec.domain',
        target: 'Domain:default/missing-domain',
        location: { file: '/tmp/orphan.yaml', document: 3 },
      },
    ]);
  });
});
