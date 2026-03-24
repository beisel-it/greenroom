import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

import { catalogKindOrder } from './catalog-shared';
import { loadCatalogEntitiesFromYaml } from './catalog-loader';
import type { LoadedCatalogEntity } from './catalog-loader';
import {
  attachCatalogRelationships,
  CatalogEntityWithRelationships,
  CatalogFacets,
  CatalogFilters,
  CatalogGroupedEntities,
  DerivedRelationshipMaps,
  deriveCatalogRelationships,
  filterCatalogEntities,
  getCatalogFacets,
  groupCatalogEntities,
} from './catalog-core';

export type CatalogContent = {
  entities: CatalogEntityWithRelationships[];
  grouped: CatalogGroupedEntities;
  facets: CatalogFacets;
  relationships: DerivedRelationshipMaps;
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

export function getCatalogEntities(
  entitiesOverride?: CatalogEntityWithRelationships[] | LoadedCatalogEntity[],
): CatalogEntityWithRelationships[] {
  if (entitiesOverride && entitiesOverride.length > 0) {
    const first = entitiesOverride[0] as CatalogEntityWithRelationships;
    const hasRelations = 'relations' in first && 'brokenReferences' in first;
    return hasRelations
      ? (entitiesOverride as CatalogEntityWithRelationships[])
      : attachCatalogRelationships(entitiesOverride as LoadedCatalogEntity[]);
  }

  return attachCatalogRelationships(loadCatalogEntitiesFromYaml());
}

export function getCatalogContent(
  filtersOrEntities: CatalogFilters | CatalogEntityWithRelationships[] = {},
  entitiesOverride?: CatalogEntityWithRelationships[],
): CatalogContent {
  const hasEntityArrayOverride = Array.isArray(filtersOrEntities);
  const filters = hasEntityArrayOverride ? {} : filtersOrEntities;
  const allEntities = hasEntityArrayOverride
    ? (filtersOrEntities as CatalogEntityWithRelationships[])
    : (entitiesOverride ?? getCatalogEntities());
  const filteredEntities = filterCatalogEntities(allEntities, filters as CatalogFilters);
  const { relationships } = deriveCatalogRelationships(allEntities.map((entity) => ({ ...entity } as CatalogEntityWithRelationships)));

  return {
    entities: filteredEntities,
    grouped: groupCatalogEntities(filteredEntities, catalogKindOrder),
    facets: getCatalogFacets(allEntities),
    relationships,
  };
}

export function getCatalogEntity(slug: string, entitiesOverride?: CatalogEntityWithRelationships[]) {
  const entities = entitiesOverride ?? getCatalogEntities();
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
export * from './catalog-loader';
export * from './catalog-core';
