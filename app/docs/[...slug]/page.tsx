import React from 'react';
import { notFound } from 'next/navigation';

import { DocsPrevNext } from '@/components/docs-prev-next';
import { Markdown } from '@/components/markdown';
import { getDocPage, getDocPages } from '@/lib/content';

export function generateStaticParams() {
  return getDocPages().map((page) => ({ slug: page.slugParts }));
}

export default async function DocPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const page = getDocPage(slug);
  if (!page) notFound();

  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="kicker">Documentation</div>
      <h1>{page.title}</h1>
      <p className="muted">{page.summary}</p>
      <Markdown content={page.body} />
      <DocsPrevNext currentSlug={page.slug} />
    </article>
  );
}
