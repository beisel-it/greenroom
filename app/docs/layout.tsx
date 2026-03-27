import React from 'react';

import { DocsSidebar } from '@/components/docs-sidebar';
import { getCatalogEntities, getDocNavList, getDocPage, getDocTree } from '@/lib/content';
import Link from 'next/link';

export default async function DocsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = [] } = await params;
  const tree = getDocTree();
  const navItems = getDocNavList(tree);
  const activeSlug = slug.join('/');
  const currentPage = activeSlug ? getDocPage(slug) : undefined;
  const currentNavItem = activeSlug ? navItems.find((item) => item.slug === activeSlug) : undefined;
  const sectionSlug = currentPage?.slugParts[0] ?? slug[0];
  const activeSection = sectionSlug ? tree.find((node) => node.slug === sectionSlug) : undefined;
  const relatedEntities = getCatalogEntities().filter((entity) =>
    (entity.metadata.links ?? []).some((link) => {
      if (!link.url.startsWith('/docs')) return false;
      if (!activeSlug) return link.url === '/docs' || link.url === '/docs/getting-started/overview';
      return link.url === `/docs/${activeSlug}` || link.url === '/docs' || link.url === '/docs/getting-started/overview';
    }),
  );

  return (
    <div className="docs-layout">
      <aside className="panel docs-sidebar">
        <div className="kicker">Narrative Layer</div>
        <div>
          <h2 style={{ margin: '6px 0 8px' }}>Documentation</h2>
          <p className="muted" style={{ margin: 0 }}>
            Read guides and ADRs beside the ownership and system metadata they explain.
          </p>
        </div>
        <DocsSidebar tree={tree} activeSlug={activeSlug || undefined} />
      </aside>
      <section className="panel docs-content">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            alignItems: 'flex-start',
          }}
        >
          <div style={{ flex: '999 1 620px', minWidth: 0 }}>{children}</div>
          <aside style={{ flex: '1 1 280px', display: 'grid', gap: 16 }}>
            <div className="card">
              <div className="kicker">Section</div>
              <h2 style={{ margin: '6px 0 8px' }}>{activeSection?.title ?? 'Documentation'}</h2>
              <p className="muted" style={{ margin: 0 }}>
                {currentPage?.summary ??
                  activeSection?.summary ??
                  'Use the docs for narrative guidance and the catalog for canonical metadata.'}
              </p>
            </div>

            <div className="card">
              <div className="kicker">Catalog Pivots</div>
              <div className="list" style={{ marginTop: 12 }}>
                <Link href="/catalog" className="entity-link">
                  <strong>Open catalog discovery</strong>
                  <p className="muted" style={{ marginBottom: 0 }}>
                    Jump into owners, systems, APIs, and linked entities.
                  </p>
                </Link>
                <Link href="/catalog/component/default/greenroom" className="entity-link">
                  <strong>Open Greenroom repo entity</strong>
                  <p className="muted" style={{ marginBottom: 0 }}>
                    Canonical project metadata for the tool itself.
                  </p>
                </Link>
                <Link href="/catalog/component/default/greenroom-web" className="entity-link">
                  <strong>Open Greenroom Web</strong>
                  <p className="muted" style={{ marginBottom: 0 }}>
                    Runtime component context for the app developers are using.
                  </p>
                </Link>
              </div>
            </div>

            {currentNavItem ? (
              <div className="card">
                <div className="kicker">Reading Path</div>
                <div className="list" style={{ marginTop: 12 }}>
                  {currentNavItem.previous ? (
                    <Link href={`/docs/${currentNavItem.previous.slug}`} className="entity-link">
                      <span className="badge">Previous</span>
                      <p style={{ margin: '12px 0 0', fontWeight: 700 }}>{currentNavItem.previous.title}</p>
                    </Link>
                  ) : null}
                  {currentNavItem.next ? (
                    <Link href={`/docs/${currentNavItem.next.slug}`} className="entity-link">
                      <span className="badge">Next</span>
                      <p style={{ margin: '12px 0 0', fontWeight: 700 }}>{currentNavItem.next.title}</p>
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="card">
              <div className="kicker">Related Entities</div>
              <div className="list" style={{ marginTop: 12 }}>
                {relatedEntities.length ? (
                  relatedEntities.slice(0, 4).map((entity) => (
                    <Link key={entity.slug} href={`/catalog/${entity.slug}`} className="entity-link">
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <strong>{entity.title}</strong>
                        <span className="badge">{entity.kind}</span>
                      </div>
                      <p className="muted" style={{ marginBottom: 0 }}>{entity.entityRef}</p>
                    </Link>
                  ))
                ) : (
                  <p className="muted" style={{ margin: 0 }}>
                    No explicit entity links map to this page yet. Use the catalog pivots above to move between narrative and metadata.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
