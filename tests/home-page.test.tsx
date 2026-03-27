import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

import HomePage from '../app/page';
import { deriveDiscoverySearchResults } from '../components/discovery-search';
import { getCatalogEntities, getDocPages } from '../lib/content';

vi.mock('next/link', () => {
  const Link = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  );
  Link.displayName = 'Link';
  return { default: Link };
});

describe('home page unified search', () => {
  it('renders a unified search surface with grouped catalog and docs snapshots', () => {
    const markup = renderToString(<HomePage />);

    expect(markup).toContain('Unified search');
    expect(markup).toContain('Search everything');
    expect(markup).toContain('Catalog snapshot');
    expect(markup).toContain('Docs snapshot');
    expect(markup).toContain('/catalog/component/default/greenroom-web');
    expect(markup).toContain('/docs/getting-started/overview');
  });

  it('returns grouped matches across catalog entities and docs for one query', () => {
    const entities = getCatalogEntities().map((entity) => ({
      slug: entity.slug,
      title: entity.title,
      summary: entity.summary,
      entityRef: entity.entityRef,
      kind: entity.kind,
      owner: 'owner' in entity.spec ? (entity.spec as { owner?: string }).owner : undefined,
      tags: entity.metadata.tags ?? [],
    }));
    const docs = getDocPages().map((doc) => ({
      slug: doc.slug,
      title: doc.title,
      summary: doc.summary,
      body: doc.body,
    }));

    const results = deriveDiscoverySearchResults(entities, docs, 'catalog');

    expect(results.catalogResults.map((result) => result.slug)).toContain('location/default/sample-catalog-source');
    expect(results.docResults.map((result) => result.slug)).toContain('getting-started/overview');
  });
});
