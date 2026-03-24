import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

import { CatalogGroups } from '../components/catalog-groups';
import { CatalogGroupedEntities, getCatalogContent } from '../lib/content';

vi.mock('next/link', () => {
  const Link = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  );
  Link.displayName = 'Link';
  return { default: Link };
});

describe('catalog index page', () => {
  it('renders grouped sections with entity cards and detail links', () => {
    const { grouped } = getCatalogContent();
    const markup = renderToString(<CatalogGroups grouped={grouped} />);

    expect(markup.indexOf('Organizations')).toBeLessThan(markup.indexOf('Teams'));
    expect(markup.indexOf('Teams')).toBeLessThan(markup.indexOf('Systems'));
    expect(markup.indexOf('Systems')).toBeLessThan(markup.indexOf('Components'));

    expect(markup).toContain('Greenroom Web');
    expect(markup).toContain('Developer Portal');
    expect(markup).toContain('Platform Team');
    expect(markup).toContain('/catalog/greenroom-web');
    expect(markup).toContain('/catalog/dev-portal');
    expect(markup).toContain('/catalog/platform');
  });

  it('shows empty states for kinds without entities', () => {
    const emptyGrouped: CatalogGroupedEntities = {
      org: [],
      team: [],
      system: [],
      component: [],
    };

    const markup = renderToString(<CatalogGroups grouped={emptyGrouped} />);

    expect(markup).toContain('No organizations yet.');
    expect(markup).toContain('No teams yet.');
    expect(markup).toContain('No systems yet.');
    expect(markup).toContain('No components yet.');
  });
});
