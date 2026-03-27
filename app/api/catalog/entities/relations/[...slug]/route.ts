import { getCatalogEntityRelations } from '@/lib/catalog-graph';
import { NextResponse } from 'next/server';

export function GET(
  _request: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  return params.then(({ slug = [] }) => {
    const entitySlug = slug.join('/');
    const response = getCatalogEntityRelations(entitySlug);

    if (!response) {
      return NextResponse.json(
        {
          error: 'Catalog entity not found',
          slug: entitySlug,
        },
        { status: 404 },
      );
    }

    return NextResponse.json(response);
  });
}
