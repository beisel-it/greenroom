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

  return (
    <>
      <div className="kicker">Documentation</div>
      <h1>Documentation</h1>
      <p className="muted">Browse the documentation by section.</p>
      <div className="grid cols-2 docs-index-grid">
        {tree.map((section) => (
          <div className="card" key={section.slug}>
            <div className="docs-index-heading">{section.title}</div>
            {section.summary ? <p className="muted">{section.summary}</p> : null}
            {section.children.length ? (
              <DocsIndexList nodes={section.children} />
            ) : (
              <p className="muted">No pages yet.</p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
