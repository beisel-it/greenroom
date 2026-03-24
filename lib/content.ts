import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

import {
  CatalogEntity,
  CatalogFacets,
  CatalogGroupedEntities,
  CatalogFilters,
  CatalogKind,
  catalogKindOrder,
  filterCatalogEntities,
  groupCatalogEntities,
} from './catalog-shared';

export type CatalogContent = {
  entities: CatalogEntity[];
  grouped: CatalogGroupedEntities;
  facets: CatalogFacets;
};

export type EntityReference = {
  slug: string;
  title: string;
  kind: CatalogKind;
};

export type BrokenReference = {
  kind: CatalogKind;
  slug: string;
  title: string;
  field: 'team' | 'system';
  target: string;
};

export type CatalogRelationships = {
  teamSystems: Record<string, EntityReference[]>;
  systemComponents: Record<string, EntityReference[]>;
  brokenReferences: BrokenReference[];
};

export type CatalogEntityWithRelationships = CatalogEntity & {
  systems: EntityReference[];
  components: EntityReference[];
  brokenReferences: BrokenReference[];
};

export type CatalogContent = {
  entities: CatalogEntityWithRelationships[];
  relationships: CatalogRelationships;
};

export type DocPage = {
  slugParts: string[];
  slug: string;
  title: string;
  summary: string;
  path: string;
  body: string;
};

const root = process.cwd();
const catalogRoot = path.join(root, 'content', 'catalog');
const docsRoot = path.join(root, 'content', 'docs');

function walkMarkdown(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkMarkdown(full);
    return entry.name.endsWith('.md') ? [full] : [];
  });
}

function uniqueSorted(values: (string | undefined)[]) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function getCatalogEntities(): CatalogEntity[] {
  return walkMarkdown(catalogRoot)
    .map((file) => {
      const raw = fs.readFileSync(file, 'utf8');
      const { data, content } = matter(raw);
      return {
        slug: String(data.slug),
        kind: data.kind as CatalogKind,
        title: String(data.title),
        summary: String(data.summary ?? ''),
        owner: data.owner ? String(data.owner) : undefined,
        system: data.system ? String(data.system) : undefined,
        team: data.team ? String(data.team) : undefined,
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        path: file,
        body: content,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getCatalogFacets(entities: CatalogEntity[] = getCatalogEntities()): CatalogFacets {
  return {
    owners: uniqueSorted(entities.map((entity) => entity.owner)),
    teams: uniqueSorted(entities.map((entity) => entity.team)),
    tags: uniqueSorted(entities.flatMap((entity) => entity.tags ?? [])),
  };
}

export function getCatalogContent(
  filters: CatalogFilters = {},
  entities: CatalogEntity[] = getCatalogEntities(),
): CatalogContent {
  const filtered = filterCatalogEntities(entities, filters);

  return {
    entities: filtered,
    grouped: groupCatalogEntities(filtered, catalogKindOrder),
    facets: getCatalogFacets(entities),
  };
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function buildLookup(entities: CatalogEntity[]) {
  const bySlug = new Map<string, CatalogEntity>();
  const byTitle = new Map<string, CatalogEntity>();

  for (const entity of entities) {
    bySlug.set(normalizeKey(entity.slug), entity);
    byTitle.set(normalizeKey(entity.title), entity);
  }

  return { bySlug, byTitle };
}

function resolveReference(value: string | undefined, lookup: ReturnType<typeof buildLookup>) {
  if (!value) return undefined;
  const key = normalizeKey(value);
  return lookup.bySlug.get(key) ?? lookup.byTitle.get(key);
}

function addRelationship(map: Record<string, EntityReference[]>, key: string, ref: EntityReference) {
  const entries = map[key] ?? [];
  if (!entries.some((entry) => entry.slug === ref.slug)) {
    entries.push(ref);
  }
  map[key] = entries;
}

const toReference = (entity: CatalogEntity): EntityReference => ({
  slug: entity.slug,
  title: entity.title,
  kind: entity.kind,
});

function applyRelationshipsToEntity(
  entity: CatalogEntity,
  relationships: CatalogRelationships,
): CatalogEntityWithRelationships {
  return {
    ...entity,
    systems: relationships.teamSystems[entity.slug] ?? [],
    components: relationships.systemComponents[entity.slug] ?? [],
    brokenReferences: relationships.brokenReferences.filter((ref) => ref.slug === entity.slug),
  };
}

export function deriveCatalogRelationships(entities: CatalogEntity[]): CatalogRelationships {
  const teams = entities.filter((entity) => entity.kind === 'team');
  const systems = entities.filter((entity) => entity.kind === 'system');
  const components = entities.filter((entity) => entity.kind === 'component');

  const teamLookup = buildLookup(teams);
  const systemLookup = buildLookup(systems);

  const relationships: CatalogRelationships = {
    teamSystems: {},
    systemComponents: {},
    brokenReferences: [],
  };

  for (const system of systems) {
    const resolvedTeam = resolveReference(system.team, teamLookup);
    if (resolvedTeam) {
      addRelationship(relationships.teamSystems, resolvedTeam.slug, toReference(system));
    } else if (system.team) {
      relationships.brokenReferences.push({
        kind: system.kind,
        slug: system.slug,
        title: system.title,
        field: 'team',
        target: system.team,
      });
    }
  }

  for (const component of components) {
    const resolvedSystem = resolveReference(component.system, systemLookup);
    if (resolvedSystem) {
      addRelationship(relationships.systemComponents, resolvedSystem.slug, toReference(component));
    } else if (component.system) {
      relationships.brokenReferences.push({
        kind: component.kind,
        slug: component.slug,
        title: component.title,
        field: 'system',
        target: component.system,
      });
    }
  }

  return relationships;
}

export function getCatalogContent(entitiesOverride?: CatalogEntity[]): CatalogContent {
  const entities = entitiesOverride ?? getCatalogEntities();
  const relationships = deriveCatalogRelationships(entities);

  return {
    entities: entities.map((entity) => applyRelationshipsToEntity(entity, relationships)),
    relationships,
  };
}

export function getCatalogEntity(slug: string, entitiesOverride?: CatalogEntity[]) {
  const { entities } = getCatalogContent(entitiesOverride);
  return entities.find((entity) => entity.slug === slug);
}

export function getDocPages(): DocPage[] {
  return walkMarkdown(docsRoot)
    .map((file) => {
      const raw = fs.readFileSync(file, 'utf8');
      const { data, content } = matter(raw);
      const rel = path.relative(docsRoot, file).replace(/\.md$/, '');
      const slugParts = rel.split(path.sep);
      return {
        slugParts,
        slug: slugParts.join('/'),
        title: String(data.title ?? slugParts.at(-1) ?? 'Untitled'),
        summary: String(data.summary ?? ''),
        path: file,
        body: content,
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export function getDocPage(slugParts: string[]) {
  const slug = slugParts.join('/');
  return getDocPages().find((page) => page.slug === slug);
}

export * from './catalog-shared';
