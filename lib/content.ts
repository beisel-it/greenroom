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
  entities: CatalogEntityWithRelationships[];
  grouped: CatalogGroupedEntities;
  facets: CatalogFacets;
  relationships: CatalogRelationships;
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

export type DocPage = {
  slugParts: string[];
  slug: string;
  title: string;
  summary: string;
  path: string;
  body: string;
};

export type DocTreeNode = {
  slugParts: string[];
  slug: string;
  title: string;
  summary: string;
  path: string;
  children: DocTreeNode[];
  isPage: boolean;
};

type DocNavNeighbor = Pick<DocTreeNode, 'slug' | 'title' | 'slugParts'>;

export type DocNavItem = Omit<DocTreeNode, 'children' | 'isPage'> & {
  previous?: DocNavNeighbor;
  next?: DocNavNeighbor;
};

const root = process.cwd();
const catalogRoot = path.join(root, 'content', 'catalog');
const docsRoot = path.join(root, 'content', 'docs');

function walkMarkdown(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));
  const files = entries
    .filter((entry) => entry.isFile())
    .sort((a, b) => a.name.localeCompare(b.name));

  return [
    ...directories.flatMap((entry) => walkMarkdown(path.join(dir, entry.name))),
    ...files.filter((entry) => entry.name.endsWith('.md')).map((entry) => path.join(dir, entry.name)),
  ];
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
      } as CatalogEntity;
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

export function getCatalogContent(
  filtersOrEntities: CatalogFilters | CatalogEntity[] = {},
  entitiesOverride?: CatalogEntity[],
): CatalogContent {
  const hasEntityArrayOverride = Array.isArray(filtersOrEntities);
  const filters = hasEntityArrayOverride ? {} : filtersOrEntities;
  const allEntities = hasEntityArrayOverride
    ? filtersOrEntities
    : (entitiesOverride ?? getCatalogEntities());
  const filteredEntities = filterCatalogEntities(allEntities, filters);
  const relationships = deriveCatalogRelationships(allEntities);

  return {
    entities: filteredEntities.map((entity) => applyRelationshipsToEntity(entity, relationships)),
    grouped: groupCatalogEntities(filteredEntities, catalogKindOrder),
    facets: getCatalogFacets(allEntities),
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
      } satisfies DocPage;
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export function getDocPage(slugParts: string[]) {
  const slug = slugParts.join('/');
  return getDocPages().find((page) => page.slug === slug);
}

function segmentTitle(segment: string) {
  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getDocTree(): DocTreeNode[] {
  const pages = getDocPages();
  const tree: DocTreeNode[] = [];

  for (const page of pages) {
    let currentLevel = tree;

    page.slugParts.forEach((part, index) => {
      const slugParts = page.slugParts.slice(0, index + 1);
      const slug = slugParts.join('/');
      const isPage = index === page.slugParts.length - 1;
      let node = currentLevel.find((child) => child.slug === slug);

      if (!node) {
        node = {
          slugParts,
          slug,
          title: isPage ? page.title : segmentTitle(part),
          summary: isPage ? page.summary : '',
          path: isPage ? page.path : path.join(docsRoot, ...slugParts),
          children: [],
          isPage,
        };
        currentLevel.push(node);
        currentLevel.sort((a, b) => a.slug.localeCompare(b.slug));
      }

      if (isPage) {
        node.title = page.title;
        node.summary = page.summary;
        node.path = page.path;
        node.isPage = true;
      } else {
        currentLevel = node.children;
      }
    });
  }

  return tree;
}

export function getDocNavList(tree: DocTreeNode[] = getDocTree()): DocNavItem[] {
  const flat: DocNavItem[] = [];

  function walk(nodes: DocTreeNode[]) {
    nodes.forEach((node) => {
      if (node.isPage) {
        flat.push({
          slugParts: node.slugParts,
          slug: node.slug,
          title: node.title,
          summary: node.summary,
          path: node.path,
        });
      }

      if (node.children.length) {
        walk(node.children);
      }
    });
  }

  walk(tree);

  flat.forEach((item, index) => {
    const previous = flat[index - 1];
    const next = flat[index + 1];

    if (previous) {
      item.previous = {
        slug: previous.slug,
        title: previous.title,
        slugParts: previous.slugParts,
      };
    }

    if (next) {
      item.next = {
        slug: next.slug,
        title: next.title,
        slugParts: next.slugParts,
      };
    }
  });

  return flat;
}

export * from './catalog-shared';
