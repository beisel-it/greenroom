import { notFound } from 'next/navigation';
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
    <section className="panel">
      <div className="kicker">Documentation</div>
      <h1>{page.title}</h1>
      <p className="muted">{page.summary}</p>
      <Markdown content={page.body} />
    </section>
  );
}
