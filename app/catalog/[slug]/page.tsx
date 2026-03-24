import { CatalogEntityContent } from '@/components/catalog-entity-content';
import { getCatalogEntities, getCatalogEntity } from '@/lib/content';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return getCatalogEntities().map((entity) => ({ slug: entity.slug }));
}

export default async function CatalogEntityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entity = getCatalogEntity(slug);
  if (!entity) notFound();

  return <CatalogEntityContent entity={entity} />;
}
