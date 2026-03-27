import React from 'react';
import Link from 'next/link';
import type { DocTreeNode } from '@/lib/content';

export function DocsSidebar({ tree, activeSlug }: { tree: DocTreeNode[]; activeSlug?: string }) {
  return (
    <nav aria-label="Docs navigation" className="docs-nav">
      {tree.map((node) => (
        <div key={node.slug} className="docs-nav-section" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div className="docs-nav-section-title">{node.title}</div>
            <span className="badge">{node.children.length}</span>
          </div>
          {node.summary ? <p className="muted" style={{ margin: 0, fontSize: '.95rem' }}>{node.summary}</p> : null}
          {node.children.length ? <DocsNavList nodes={node.children} activeSlug={activeSlug} /> : null}
        </div>
      ))}
    </nav>
  );
}

function DocsNavList({ nodes, activeSlug }: { nodes: DocTreeNode[]; activeSlug?: string }) {
  return (
    <ul className="docs-nav-list">
      {nodes.map((node) => (
        <li key={node.slug}>
          {node.isPage ? (
            <Link
              href={`/docs/${node.slug}`}
              className={`docs-nav-link${activeSlug === node.slug ? ' active' : ''}`}
              aria-current={activeSlug === node.slug ? 'page' : undefined}
            >
              <span>{node.title}</span>
              {node.summary ? (
                <small className="muted" style={{ display: 'block', marginTop: 4, fontSize: '.8rem', lineHeight: 1.45 }}>
                  {node.summary}
                </small>
              ) : null}
            </Link>
          ) : (
            <>
              <div className="docs-nav-subsection">{node.title}</div>
              {node.children.length ? (
                <DocsNavList nodes={node.children} activeSlug={activeSlug} />
              ) : null}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
