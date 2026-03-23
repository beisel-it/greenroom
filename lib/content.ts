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
