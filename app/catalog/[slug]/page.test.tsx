import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CatalogEntityContent } from '@/components/catalog-entity-content';
import type { CatalogEntityWithRelationships, EntityReference } from '@/lib/content';

const baseRelations = {
  domain: undefined,
  system: undefined,
  providesApis: [],
  consumesApis: [],
  dependsOn: [],
  dependents: [],
  systemsInDomain: [],
  componentsInSystem: [],
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
  it('renders linked systems for domain entities', () => {
    const html = render({
      ...baseEntity,
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
        componentsInSystem: [
          ref({ entityRef: 'Component:default/greenroom-web', slug: 'component/default/greenroom-web', kind: 'Component', title: 'Greenroom Web' }),
        ],
      },
    });

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
});
