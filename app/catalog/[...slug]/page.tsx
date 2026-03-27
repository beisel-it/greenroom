import { CatalogEntityContent } from '@/components/catalog-entity-content';
import { getCatalogEntities, getCatalogEntity } from '@/lib/content';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return getCatalogEntities().map((entity) => ({ slug: entity.slug.split('/') }));
}

export default async function CatalogEntityPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const entity = getCatalogEntity(slug.join('/'));
  if (!entity) notFound();

  return <CatalogEntityContent entity={entity} />;
}
