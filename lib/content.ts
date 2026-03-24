import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export type CatalogKind = 'org' | 'team' | 'system' | 'component';

export type CatalogEntity = {
  slug: string;
  kind: CatalogKind;
  title: string;
  summary: string;
  owner?: string;
  system?: string;
  team?: string;
  tags?: string[];
  path: string;
  body: string;
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

export function getCatalogEntities(): CatalogEntity[] {
  return walkMarkdown(catalogRoot).map((file) => {
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
  }).sort((a, b) => a.title.localeCompare(b.title));
}

export function getCatalogEntity(slug: string) {
  return getCatalogEntities().find((entity) => entity.slug === slug);
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

export function getDocPages(): DocPage[] {
  return walkMarkdown(docsRoot).map((file) => {
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
  }).sort((a, b) => a.slug.localeCompare(b.slug));
}

export function getDocPage(slugParts: string[]) {
  const slug = slugParts.join('/');
  return getDocPages().find((page) => page.slug === slug);
}
