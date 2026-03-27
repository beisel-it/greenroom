import React from 'react';
import Link from 'next/link';

import type { DocNavItem } from '@/lib/content';
import { getDocNavList } from '@/lib/content';

export function DocsPrevNext({
  currentSlug,
  navItems = getDocNavList(),
}: {
  currentSlug: string;
  navItems?: DocNavItem[];
}) {
  const current = navItems.find((item) => item.slug === currentSlug);

  if (!current) return null;

  const { previous, next } = current;

  if (!previous && !next) return null;

  return (
    <nav className="docs-prev-next" aria-label="Previous and next documentation pages">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="kicker">Reading Path</div>
        <p className="muted" style={{ margin: 0 }}>
          Stay in the narrative flow here, then use the catalog pivots in the context rail when you need ownership or system metadata.
        </p>
      </div>
      <div className="docs-prev-next-grid">
        {previous ? (
          <Link href={`/docs/${previous.slug}`} className="docs-prev-next-link previous">
            <span className="docs-prev-next-label">Previous</span>
            <span className="docs-prev-next-title">{previous.title}</span>
          </Link>
        ) : null}
        {next ? (
          <Link href={`/docs/${next.slug}`} className="docs-prev-next-link next">
            <span className="docs-prev-next-label">Next</span>
            <span className="docs-prev-next-title">{next.title}</span>
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
