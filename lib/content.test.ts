import { describe, expect, it } from 'vitest';
import { CatalogEntity, deriveCatalogRelationships } from './content';

const baseTeam: CatalogEntity = {
  slug: 'platform',
  kind: 'team',
  title: 'Platform Team',
  summary: 'Platform ownership',
  path: '/tmp/team.md',
  body: '',
};

const baseSystem: CatalogEntity = {
  slug: 'dev-portal',
  kind: 'system',
  title: 'Developer Portal',
  summary: 'Portal system',
  path: '/tmp/system.md',
  body: '',
};

const baseComponent: CatalogEntity = {
  slug: 'greenroom-web',
  kind: 'component',
  title: 'Greenroom Web',
  summary: 'Web UI',
  path: '/tmp/component.md',
  body: '',
};

describe('deriveCatalogRelationships', () => {
  it('derives relationships using slug matching', () => {
    const entities: CatalogEntity[] = [
      baseTeam,
      { ...baseSystem, team: 'platform' },
      { ...baseComponent, system: 'dev-portal' },
    ];

    const relationships = deriveCatalogRelationships(entities);

    expect(relationships.brokenReferences).toHaveLength(0);
    expect(relationships.teamSystems['platform']).toEqual([
      { slug: 'dev-portal', title: 'Developer Portal', kind: 'system' },
    ]);
    expect(relationships.systemComponents['dev-portal']).toEqual([
      { slug: 'greenroom-web', title: 'Greenroom Web', kind: 'component' },
    ]);
  });

  it('falls back to title matching when reference values are display names', () => {
    const entities: CatalogEntity[] = [
      baseTeam,
      { ...baseSystem, team: 'Platform Team' },
      { ...baseComponent, system: 'Developer Portal' },
    ];

    const relationships = deriveCatalogRelationships(entities);

    expect(relationships.brokenReferences).toHaveLength(0);
    expect(relationships.teamSystems['platform']).toEqual([
      { slug: 'dev-portal', title: 'Developer Portal', kind: 'system' },
    ]);
    expect(relationships.systemComponents['dev-portal']).toEqual([
      { slug: 'greenroom-web', title: 'Greenroom Web', kind: 'component' },
    ]);
  });

  it('records broken references when targets cannot be resolved', () => {
    const entities: CatalogEntity[] = [
      baseTeam,
      { ...baseSystem, team: 'Missing Team' },
      { ...baseComponent, system: 'Unknown System' },
    ];

    const relationships = deriveCatalogRelationships(entities);

    expect(relationships.teamSystems['platform']).toBeUndefined();
    expect(relationships.systemComponents['dev-portal']).toBeUndefined();
    expect(relationships.brokenReferences).toEqual([
      {
        kind: 'system',
        slug: 'dev-portal',
        title: 'Developer Portal',
        field: 'team',
        target: 'Missing Team',
      },
      {
        kind: 'component',
        slug: 'greenroom-web',
        title: 'Greenroom Web',
        field: 'system',
        target: 'Unknown System',
      },
    ]);
  });
});
