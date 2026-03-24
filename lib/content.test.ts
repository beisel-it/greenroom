import { describe, expect, it } from 'vitest';
import * as content from './content';

const baseTeam: content.CatalogEntity = {
  slug: 'platform',
  kind: 'team',
  title: 'Platform Team',
  summary: 'Platform ownership',
  path: '/tmp/team.md',
  body: '',
};

const baseSystem: content.CatalogEntity = {
  slug: 'dev-portal',
  kind: 'system',
  title: 'Developer Portal',
  summary: 'Portal system',
  path: '/tmp/system.md',
  body: '',
};

const baseComponent: content.CatalogEntity = {
  slug: 'greenroom-web',
  kind: 'component',
  title: 'Greenroom Web',
  summary: 'Web UI',
  path: '/tmp/component.md',
  body: '',
};

describe('deriveCatalogRelationships', () => {
  it('derives relationships using slug matching', () => {
    const entities: content.CatalogEntity[] = [
      baseTeam,
      { ...baseSystem, team: 'platform' },
      { ...baseComponent, system: 'dev-portal' },
    ];

    const relationships = content.deriveCatalogRelationships(entities);

    expect(relationships.brokenReferences).toHaveLength(0);
    expect(relationships.teamSystems['platform']).toEqual([
      { slug: 'dev-portal', title: 'Developer Portal', kind: 'system' },
    ]);
    expect(relationships.systemComponents['dev-portal']).toEqual([
      { slug: 'greenroom-web', title: 'Greenroom Web', kind: 'component' },
    ]);
  });

  it('falls back to title matching when reference values are display names', () => {
    const entities: content.CatalogEntity[] = [
      baseTeam,
      { ...baseSystem, team: 'Platform Team' },
      { ...baseComponent, system: 'Developer Portal' },
    ];

    const relationships = content.deriveCatalogRelationships(entities);

    expect(relationships.brokenReferences).toHaveLength(0);
    expect(relationships.teamSystems['platform']).toEqual([
      { slug: 'dev-portal', title: 'Developer Portal', kind: 'system' },
    ]);
    expect(relationships.systemComponents['dev-portal']).toEqual([
      { slug: 'greenroom-web', title: 'Greenroom Web', kind: 'component' },
    ]);
  });

  it('records broken references when targets cannot be resolved', () => {
    const entities: content.CatalogEntity[] = [
      baseTeam,
      { ...baseSystem, team: 'Missing Team' },
      { ...baseComponent, system: 'Unknown System' },
    ];

    const relationships = content.deriveCatalogRelationships(entities);

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

describe('getCatalogEntity', () => {
  it('adds related systems for team entities', () => {
    const entities: content.CatalogEntity[] = [
      baseTeam,
      { ...baseSystem, team: 'platform' },
    ];

    const entity = content.getCatalogEntity('platform', entities);

    expect(entity?.systems).toEqual([
      { slug: 'dev-portal', title: 'Developer Portal', kind: 'system' },
    ]);
    expect(entity?.components).toEqual([]);
    expect(entity?.brokenReferences).toEqual([]);
  });

  it('adds related components for system entities', () => {
    const entities: content.CatalogEntity[] = [
      baseSystem,
      { ...baseComponent, system: 'dev-portal' },
    ];

    const entity = content.getCatalogEntity('dev-portal', entities);

    expect(entity?.components).toEqual([
      { slug: 'greenroom-web', title: 'Greenroom Web', kind: 'component' },
    ]);
    expect(entity?.systems).toEqual([]);
    expect(entity?.brokenReferences).toEqual([]);
  });

  it('includes broken references scoped to the requested entity', () => {
    const entities: content.CatalogEntity[] = [
      { ...baseSystem, team: 'Unknown Team' },
      { ...baseComponent, system: 'dev-portal' },
      {
        ...baseComponent,
        slug: 'unbound-component',
        title: 'Unbound Component',
        system: 'Missing System',
      },
    ];

    const systemEntity = content.getCatalogEntity('dev-portal', entities);
    const componentEntity = content.getCatalogEntity('unbound-component', entities);

    expect(systemEntity?.brokenReferences).toEqual([
      {
        kind: 'system',
        slug: 'dev-portal',
        title: 'Developer Portal',
        field: 'team',
        target: 'Unknown Team',
      },
    ]);
    expect(componentEntity?.brokenReferences).toEqual([
      {
        kind: 'component',
        slug: 'unbound-component',
        title: 'Unbound Component',
        field: 'system',
        target: 'Missing System',
      },
    ]);
  });
});
