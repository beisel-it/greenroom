import React from 'react';
import Link from 'next/link';

import { getDocTree, type DocTreeNode } from '@/lib/content';

function DocsIndexList({ nodes }: { nodes: DocTreeNode[] }) {
  if (!nodes.length) return null;

  return (
    <ul className="docs-index-list">
      {nodes.map((node) => (
        <li key={node.slug} className="docs-index-item">
          <div className="docs-index-entry">
            {node.isPage ? (
              <Link href={`/docs/${node.slug}`} className="docs-nav-link">
                {node.title}
              </Link>
            ) : (
              <div className="docs-index-heading">{node.title}</div>
            )}
            {node.summary ? <p className="muted">{node.summary}</p> : null}
          </div>
          {node.children.length ? <DocsIndexList nodes={node.children} /> : null}
        </li>
      ))}
    </ul>
  );
}

export default function DocsIndexPage() {
  const tree = getDocTree();
  const totalPages = tree.reduce((count, section) => count + section.children.length, 0);

  return (
    <>
      <section
        className="hero"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.3fr) minmax(280px, .7fr)',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <div>
          <div className="kicker">Documentation</div>
          <h1 style={{ marginBottom: 12 }}>Read the narrative beside the catalog.</h1>
          <p className="muted" style={{ maxWidth: 760, marginBottom: 0 }}>
            Greenroom’s docs are the explanatory layer for product intent, ownership context, contributor workflow, and ADRs. Start with the narrative you need, then pivot into the catalog when you need canonical metadata.
          </p>
        </div>
        <div className="grid" style={{ gap: 12 }}>
          <div className="card">
            <strong>{tree.length}</strong>
            <div className="muted">sections</div>
          </div>
          <div className="card">
            <strong>{totalPages}</strong>
            <div className="muted">narrative pages</div>
          </div>
          <Link href="/catalog" className="entity-link">
            <strong>Open catalog discovery</strong>
            <p className="muted" style={{ marginBottom: 0 }}>
              Move from guides and ADRs back into systems, APIs, and ownership.
            </p>
          </Link>
        </div>
      </section>

      <div className="grid cols-2 docs-index-grid">
        {tree.map((section) => (
          <section className="card" key={section.slug} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
              <div>
                <div className="kicker">Section</div>
                <div className="docs-index-heading">{section.title}</div>
              </div>
              <span className="badge">{section.children.length} pages</span>
            </div>
            {section.summary ? <p className="muted">{section.summary}</p> : null}
            {section.children.length ? (
              <DocsIndexList nodes={section.children} />
            ) : (
              <p className="muted">No pages yet.</p>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
