import React from 'react';

import { DocsSidebar } from '@/components/docs-sidebar';
import { getDocTree } from '@/lib/content';

export default async function DocsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = [] } = await params;
  const tree = getDocTree();
  const activeSlug = slug.join('/');

  return (
    <div className="docs-layout">
      <aside className="panel docs-sidebar">
        <div className="kicker">Documentation</div>
        <DocsSidebar tree={tree} activeSlug={activeSlug || undefined} />
      </aside>
      <section className="panel docs-content">{children}</section>
    </div>
  );
}
