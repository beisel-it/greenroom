import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

import { DocsPrevNext } from '../components/docs-prev-next';
import { DocNavItem, getDocNavList } from '../lib/content';

vi.mock('next/link', () => {
  const Link = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  );
  Link.displayName = 'Link';
  return { default: Link };
});

describe('DocsPrevNext', () => {
  it('renders previous link for nested pages using flattened navigation order', () => {
    const markup = renderToString(
      <DocsPrevNext currentSlug="getting-started/overview" navItems={getDocNavList()} />,
    );

    expect(markup).toContain('Previous');
    expect(markup).toContain('/docs/getting-started/contributing');
    expect(markup).toContain('Contributing content');
    expect(markup).not.toContain('Next');
  });

  it('renders both neighbors when available', () => {
    const navItems: DocNavItem[] = [
      {
        slug: 'section/alpha',
        slugParts: ['section', 'alpha'],
        title: 'Alpha',
        summary: '',
        path: '/tmp/alpha.md',
        next: { slug: 'section/beta', title: 'Beta', slugParts: ['section', 'beta'] },
      },
      {
        slug: 'section/beta',
        slugParts: ['section', 'beta'],
        title: 'Beta',
        summary: '',
        path: '/tmp/beta.md',
        previous: { slug: 'section/alpha', title: 'Alpha', slugParts: ['section', 'alpha'] },
        next: { slug: 'section/gamma', title: 'Gamma', slugParts: ['section', 'gamma'] },
      },
      {
        slug: 'section/gamma',
        slugParts: ['section', 'gamma'],
        title: 'Gamma',
        summary: '',
        path: '/tmp/gamma.md',
        previous: { slug: 'section/beta', title: 'Beta', slugParts: ['section', 'beta'] },
      },
    ];

    const markup = renderToString(<DocsPrevNext currentSlug="section/beta" navItems={navItems} />);

    expect(markup).toContain('Previous');
    expect(markup).toContain('/docs/section/alpha');
    expect(markup).toContain('Alpha');
    expect(markup).toContain('Next');
    expect(markup).toContain('/docs/section/gamma');
    expect(markup).toContain('Gamma');
  });
});
