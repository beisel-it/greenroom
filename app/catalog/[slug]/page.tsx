import { notFound } from 'next/navigation';
import { Markdown } from '@/components/markdown';
import { getCatalogEntities, getCatalogEntity } from '@/lib/content';

export function generateStaticParams() {
  return getCatalogEntities().map((entity) => ({ slug: entity.slug }));
}

export default async function CatalogEntityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entity = getCatalogEntity(slug);
  if (!entity) notFound();

  return (
    <section className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start' }}>
        <div>
          <div className="kicker">{entity.kind}</div>
          <h1>{entity.title}</h1>
          <p className="muted">{entity.summary}</p>
        </div>
        <div className="badge">{entity.slug}</div>
      </div>

      <div className="grid cols-3" style={{ margin: '20px 0' }}>
        <div className="card"><strong>Owner</strong><div className="muted">{entity.owner ?? '—'}</div></div>
        <div className="card"><strong>Team</strong><div className="muted">{entity.team ?? '—'}</div></div>
        <div className="card"><strong>System</strong><div className="muted">{entity.system ?? '—'}</div></div>
      </div>

      <Markdown content={entity.body} />
    </section>
  );
}
