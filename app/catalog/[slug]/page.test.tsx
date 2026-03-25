import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CatalogEntityContent } from '@/components/catalog-entity-content';
import type { CatalogEntityWithRelationships, EntityReference } from '@/lib/content';

const baseRelations = {
  owner: undefined,
  domain: undefined,
  parentDomain: undefined,
  system: undefined,
  parentComponent: undefined,
  providesApis: [],
  consumesApis: [],
  dependsOn: [],
  dependents: [],
  systemsInDomain: [],
  subdomains: [],
  componentsInSystem: [],
  subcomponents: [],
  apisInSystem: [],
  resourcesInSystem: [],
  providingComponents: [],
  consumingComponents: [],
};

const baseEntity: CatalogEntityWithRelationships = {
  apiVersion: 'backstage.io/v1beta1',
  kind: 'Domain',
  metadata: { name: 'developer-experience', namespace: 'default', description: 'Summary', tags: [] },
  spec: { owner: 'platform-team' },
  entityRef: 'Domain:default/developer-experience',
  slug: 'domain/default/developer-experience',
  location: { file: '/tmp/entity.yaml', document: 1 },
  title: 'Developer Experience',
  summary: 'Summary',
  relations: { ...baseRelations },
  brokenReferences: [],
};

function ref(partial: Partial<EntityReference> & Pick<EntityReference, 'entityRef' | 'slug' | 'kind'>): EntityReference {
  return {
    name: partial.name ?? partial.slug.split('/').pop() ?? 'unknown',
    namespace: partial.namespace ?? partial.slug.split('/')[1] ?? 'default',
    title: partial.title ?? partial.entityRef,
    ...partial,
  } satisfies EntityReference;
}

function render(entity: CatalogEntityWithRelationships) {
  return renderToStaticMarkup(createElement(CatalogEntityContent, { entity }));
}

describe('CatalogEntityContent relationships', () => {
  it('renders grouped neighbors with relation filters for entity pages', () => {
    const html = render({
      ...baseEntity,
      kind: 'Component',
      metadata: { ...baseEntity.metadata, name: 'greenroom-web' },
      spec: {
        type: 'website',
        owner: 'platform-team',
        lifecycle: 'production',
      },
      slug: 'component/default/greenroom-web',
      entityRef: 'Component:default/greenroom-web',
      relations: {
        ...baseRelations,
        domain: ref({ entityRef: 'Domain:default/developer-experience', slug: 'domain/default/developer-experience', kind: 'Domain', title: 'Developer Experience' }),
        owner: ref({ entityRef: 'Group:default/platform-team', slug: 'group/default/platform-team', kind: 'Group', title: 'platform-team' }),
        system: ref({ entityRef: 'System:default/dev-portal', slug: 'system/default/dev-portal', kind: 'System', title: 'Developer Portal' }),
        providesApis: [
          ref({ entityRef: 'API:default/platform-shell-api', slug: 'api/default/platform-shell-api', kind: 'API', title: 'Platform Shell API' }),
        ],
        dependsOn: [
          ref({ entityRef: 'Resource:default/platform-db', slug: 'resource/default/platform-db', kind: 'Resource', title: 'Platform Database' }),
        ],
      },
    });

    expect(html).toContain('Neighbors');
    expect(html).toContain('Catalog path');
    expect(html).toContain('/catalog/domain/default/developer-experience');
    expect(html).toContain('Ownership');
    expect(html).toContain('System / Domain');
    expect(html).toContain('Provides / Consumes API');
    expect(html).toContain('Depends On');
    expect(html).toContain('Relationship diagram');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('/catalog/system/default/dev-portal');
    expect(html).toContain('/catalog/api/default/platform-shell-api');
    expect(html).toContain('/catalog/resource/default/platform-db');
  });

  it('renders linked systems for domain entities', () => {
    const html = render({
      ...baseEntity,
      metadata: {
        ...baseEntity.metadata,
        links: [{ url: 'https://example.com/docs/domain', title: 'Domain runbook' }],
      },
      relations: {
        ...baseRelations,
        systemsInDomain: [
          ref({ entityRef: 'System:default/dev-portal', slug: 'system/default/dev-portal', kind: 'System', title: 'Developer Portal' }),
          ref({ entityRef: 'System:default/payments-core', slug: 'system/default/payments-core', kind: 'System', title: 'Payments Core' }),
        ],
      },
    });

    expect(html).toContain('Systems in domain');
    expect(html).toContain('/catalog/system/default/dev-portal');
    expect(html).toContain('Developer Portal');
    expect(html).toContain('/catalog/system/default/payments-core');
    expect(html).toContain('References');
    expect(html).toContain('Domain runbook');
    expect(html).toContain('Browse docs');
  });

  it('shows an empty state for a domain with no systems', () => {
    const html = render(baseEntity);

    expect(html).toContain('Systems in domain');
    expect(html).toContain('No systems are linked to this domain yet.');
  });

  it('renders linked components for system entities', () => {
    const html = render({
      ...baseEntity,
      kind: 'System',
      metadata: { ...baseEntity.metadata, name: 'dev-portal' },
      slug: 'system/default/dev-portal',
      entityRef: 'System:default/dev-portal',
      relations: {
        ...baseRelations,
        domain: ref({ entityRef: 'Domain:default/developer-experience', slug: 'domain/default/developer-experience', kind: 'Domain', title: 'Developer Experience' }),
        componentsInSystem: [
          ref({ entityRef: 'Component:default/greenroom-web', slug: 'component/default/greenroom-web', kind: 'Component', title: 'Greenroom Web' }),
        ],
      },
    });

    expect(html).toContain('Catalog path');
    expect(html).toContain('/catalog/domain/default/developer-experience');
    expect(html).toContain('Components');
    expect(html).toContain('/catalog/component/default/greenroom-web');
    expect(html).toContain('Greenroom Web');
  });

  it('shows broken reference warnings with targets', () => {
    const html = render({
      ...baseEntity,
      kind: 'System',
      metadata: { ...baseEntity.metadata, name: 'dev-portal' },
      slug: 'system/default/dev-portal',
      entityRef: 'System:default/dev-portal',
      brokenReferences: [
        {
          source: ref({ entityRef: 'System:default/dev-portal', slug: 'system/default/dev-portal', kind: 'System', title: 'Developer Portal' }),
          field: 'spec.domain',
          target: 'Domain:default/missing-domain',
          location: { file: '/tmp/catalog-info.yaml', document: 2 },
        },
      ],
    });

    expect(html).toContain('Broken references');
    expect(html).toContain('unresolved spec.domain reference');
    expect(html).toContain('Domain:default/missing-domain');
  });

  it('shows an empty neighbors state when an entity has no direct relations', () => {
    const html = render({
      ...baseEntity,
      kind: 'Location',
      metadata: { ...baseEntity.metadata, name: 'catalog-source' },
      spec: { type: 'url', target: 'https://example.com/catalog-info.yaml' },
      slug: 'location/default/catalog-source',
      entityRef: 'Location:default/catalog-source',
      relations: { ...baseRelations },
    });

    expect(html).toContain('Neighbors');
    expect(html).toContain('This entity has no direct catalog neighbors yet.');
  });
});
