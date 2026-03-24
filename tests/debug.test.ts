import { describe, it, expect } from 'vitest';
import { loadCatalogEntitiesFromYaml } from '../lib/catalog-loader';
import { deriveCatalogRelationships } from '../lib/catalog-core';
import path from 'node:path';

describe('debug', () => {
  it('checks catalog-accessors system-component relationship', () => {
    const loaded = loadCatalogEntitiesFromYaml({ catalogDir: path.join(process.cwd(), 'tests/fixtures/catalog-accessors') });
    console.log('entityRefs:', loaded.map(e => e.entityRef));
    const {relationships} = deriveCatalogRelationships(loaded);
    const key = 'System:platform/developer-portal';
    console.log('systemComponents[', key, ']:', relationships.systemComponents[key]);
    expect(loaded.length).toBeGreaterThan(0);
  });
});
