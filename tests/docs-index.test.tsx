import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

import DocsIndexPage from '../app/docs/page';

vi.mock('next/link', () => {
  const Link = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  );
  Link.displayName = 'Link';
  return { default: Link };
});

describe('Docs index page', () => {
  it('renders an index derived from the docs navigation tree', () => {
    const markup = renderToString(<DocsIndexPage />);

    expect(markup).toContain('Documentation');
    expect(markup).toContain('Getting Started');
    expect(markup).toContain('/docs/getting-started/overview');
    expect(markup).toContain('/docs/getting-started/contributing');
  });
});
