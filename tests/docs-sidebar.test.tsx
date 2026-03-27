import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

import { DocsSidebar } from '../components/docs-sidebar';
import { getDocTree } from '../lib/content';

vi.mock('next/link', () => {
  const Link = ({
    href,
    children,
    className,
    'aria-current': ariaCurrent,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    'aria-current'?: React.AriaAttributes['aria-current'];
  }) => (
    <a href={href} className={className} aria-current={ariaCurrent}>
      {children}
    </a>
  );
  Link.displayName = 'Link';
  return { default: Link };
});

describe('DocsSidebar', () => {
  it('renders section headings and nested page links from the doc tree', () => {
    const tree = getDocTree();

    const markup = renderToString(<DocsSidebar tree={tree} />);

    expect(markup).toContain('ADR');
    expect(markup).toContain('Getting Started');
    expect(markup).toContain('/docs/getting-started/contributing');
    expect(markup).toContain('/docs/getting-started/overview');

    const contribIndex = markup.indexOf('/docs/getting-started/contributing');
    const overviewIndex = markup.indexOf('/docs/getting-started/overview');

    expect(contribIndex).toBeGreaterThan(-1);
    expect(overviewIndex).toBeGreaterThan(-1);
    expect(contribIndex).toBeLessThan(overviewIndex);
  });

  it('marks the active page link based on the provided slug', () => {
    const tree = getDocTree();

    const markup = renderToString(
      <DocsSidebar tree={tree} activeSlug="getting-started/overview" />,
    );

    expect(markup).toContain(
      '<a href="/docs/getting-started/overview" class="docs-nav-link active" aria-current="page">',
    );
    expect(markup).toContain(
      '<a href="/docs/getting-started/contributing" class="docs-nav-link">',
    );

    const activeMentions = markup.match(/docs-nav-link active/g) ?? [];
    expect(activeMentions).toHaveLength(1);
  });
});
