import { describe, expect, it } from 'vitest';

import { GET } from './route';

describe('catalog relations API route', () => {
  it('returns neighbor relations for a known entity slug', async () => {
    const response = await GET(new Request('http://localhost/api/catalog/entities/relations/component/default/greenroom-web'), {
      params: Promise.resolve({ slug: ['component', 'default', 'greenroom-web'] }),
    });

    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.entity.entityRef).toBe('Component:default/greenroom-web');
    expect(payload.neighbors.owner.entityRef).toBe('Group:default/platform-team');
    expect(payload.neighbors.system.entityRef).toBe('System:default/dev-portal');
    expect(payload.neighbors.providesApis.map((ref: { entityRef: string }) => ref.entityRef)).toEqual([
      'API:default/platform-shell-api',
    ]);
  });

  it('returns a clear 404 payload for an unknown entity slug', async () => {
    const response = await GET(new Request('http://localhost/api/catalog/entities/relations/component/default/missing'), {
      params: Promise.resolve({ slug: ['component', 'default', 'missing'] }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: 'Catalog entity not found',
      slug: 'component/default/missing',
    });
  });
});
