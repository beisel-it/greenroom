import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import CatalogEntityPage, { generateStaticParams } from './page';

vi.mock('next/link', () => {
  const Link = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  );
  Link.displayName = 'Link';
  return { default: Link };
});

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('not found');
  },
}));

describe('catalog entity page route', () => {
  it('renders a catch-all entity slug path', async () => {
    const element = await CatalogEntityPage({
      params: Promise.resolve({ slug: ['system', 'default', 'dev-portal'] }),
    });

    const markup = renderToString(element);

    expect(markup).toContain('Developer Portal');
    expect(markup).toContain('Graph and neighbors');
    expect(markup).toContain('/catalog/component/default/greenroom-web');
  });

  it('exposes static params as slug arrays', () => {
    const params = generateStaticParams();

    expect(params).toContainEqual({ slug: ['system', 'default', 'dev-portal'] });
    expect(params).toContainEqual({ slug: ['component', 'default', 'greenroom-web'] });
  });
});
