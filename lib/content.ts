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

export function getCatalogEntity(slug: string) {
  return getCatalogEntities().find((entity) => entity.slug === slug);
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
