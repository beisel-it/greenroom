import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

import DocPage, { generateStaticParams } from '../app/docs/[...slug]/page';

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

describe('Docs page', () => {
  it('renders documentation page content and previous link from navigation order', async () => {
    const element = await DocPage({ params: Promise.resolve({ slug: ['getting-started', 'overview'] }) });

    const markup = renderToString(element);

    expect(markup).toContain('Documentation');
    expect(markup).toContain('Previous');
    expect(markup).toContain('/docs/getting-started/contributing');
    expect(markup).toContain('Contributing content');
    expect(markup).not.toContain('Next');
  });

  it('includes previous and next links for contributing based on integrated doc order', async () => {
    const element = await DocPage({ params: Promise.resolve({ slug: ['getting-started', 'contributing'] }) });

    const markup = renderToString(element);

    expect(markup).toContain('Previous');
    expect(markup).toContain('/docs/adr/0002-entity-rendering');
    expect(markup).toContain('ADR-0002: Mermaid rendering for ADR/entity diagrams');
    expect(markup).toContain('Next');
    expect(markup).toContain('/docs/getting-started/overview');
    expect(markup).toContain('Overview');
  });

  it('exposes static params for docs slugs', () => {
    const params = generateStaticParams();

    expect(params).toEqual([
      { slug: ['adr', '0002-entity-rendering'] },
      { slug: ['getting-started', 'contributing'] },
      { slug: ['getting-started', 'overview'] },
    ]);
  });
});
