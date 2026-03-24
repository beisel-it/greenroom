import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

import DocsLayout from '../app/docs/layout';

vi.mock('next/link', () => {
  const Link = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  );
  Link.displayName = 'Link';
  return { default: Link };
});

describe('DocsLayout', () => {
  it('wraps docs pages with sidebar navigation and renders children', async () => {
    const element = await DocsLayout({
      children: <div className="doc-child">Hello Docs</div>,
      params: Promise.resolve({ slug: ['getting-started', 'overview'] }),
    });

    const markup = renderToString(element);

    expect(markup).toContain('Documentation');
    expect(markup).toContain('docs-nav');
    expect(markup).toContain('Hello Docs');
    expect(markup).toContain('docs-nav-link active');
  });

  it('handles docs index without an active slug', async () => {
    const element = await DocsLayout({
      children: <div>Index Content</div>,
      params: Promise.resolve({}),
    });

    const markup = renderToString(element);

    expect(markup).toContain('docs-nav');
    expect(markup).toContain('Index Content');
  });
});
