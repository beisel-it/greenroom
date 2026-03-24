import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CatalogEntityContent } from '@/components/catalog-entity-content';
import type { CatalogEntityWithRelationships } from '@/lib/content';

const baseEntity: CatalogEntityWithRelationships = {
  slug: 'entity-slug',
  kind: 'team',
  title: 'Entity Title',
  summary: 'Summary',
  path: '/tmp/entity.md',
  body: 'Body',
  systems: [],
  components: [],
  brokenReferences: [],
};

function render(entity: CatalogEntityWithRelationships) {
  return renderToStaticMarkup(createElement(CatalogEntityContent, { entity }));
}

describe('CatalogEntityContent relationships', () => {
  it('renders linked systems for team entities', () => {
    const html = render({
      ...baseEntity,
      systems: [
        { slug: 'dev-portal', title: 'Developer Portal', kind: 'system' },
        { slug: 'payments-core', title: 'Payments Core', kind: 'system' },
      ],
    });

    expect(html).toContain('Linked systems');
    expect(html).toContain('/catalog/dev-portal');
    expect(html).toContain('Developer Portal');
    expect(html).toContain('/catalog/payments-core');
  });

  it('renders linked components for system entities', () => {
    const html = render({
      ...baseEntity,
      kind: 'system',
      components: [
        { slug: 'greenroom-web', title: 'Greenroom Web', kind: 'component' },
      ],
    });

    expect(html).toContain('Linked components');
    expect(html).toContain('/catalog/greenroom-web');
    expect(html).toContain('Greenroom Web');
  });

  it('shows broken reference warnings with targets', () => {
    const html = render({
      ...baseEntity,
      kind: 'system',
      brokenReferences: [
        {
          kind: 'system',
          slug: 'dev-portal',
          title: 'Developer Portal',
          field: 'team',
          target: 'Missing Team',
        },
      ],
    });

    expect(html).toContain('Broken references');
    expect(html).toContain('unresolved team reference');
    expect(html).toContain('Missing Team');
  });
});
