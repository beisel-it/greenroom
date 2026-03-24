import fs from 'node:fs';
import path from 'node:path';
import { parseAllDocuments, YAMLParseError } from 'yaml';

import {
  CatalogEntityEnvelope,
  formatEntityRef,
  parseEntityRef,
  validateCatalogEntityEnvelope,
} from './catalog-shared';

export type LoadedCatalogEntity = CatalogEntityEnvelope & {
  /** Canonical Backstage entity ref string (Kind:namespace/name) */
  entityRef: string;
  /** Route-friendly slug derived from the entity ref */
  slug: string;
  /** Source file and document index (1-based) inside the YAML file */
  location: { file: string; document: number };
};

type LoadOptions = {
  /** Override the catalog root directory. Defaults to `<cwd>/content/catalog`. */
  catalogDir?: string;
};

function deriveSlug(envelope: CatalogEntityEnvelope) {
  const ref = parseEntityRef({
    kind: envelope.kind,
    namespace: envelope.metadata.namespace,
    name: envelope.metadata.name,
  });

  const entityRef = formatEntityRef(ref);
  const slug = `${ref.kind.toLowerCase()}/${ref.namespace}/${ref.name}`;

  return { ref, entityRef, slug };
}

function withContext(filePath: string, documentIndex: number, error: unknown): Error {
  const prefix = `${path.relative(process.cwd(), filePath) || filePath} (document ${documentIndex})`;
  const message = error instanceof Error ? error.message : String(error);
  return new Error(`${prefix}: ${message}`);
}

function loadDocument(doc: ReturnType<typeof parseAllDocuments>[number], filePath: string, index: number): LoadedCatalogEntity {
  if (!doc) {
    throw new Error('YAML document is empty');
  }

  if (doc.errors.length) {
    // Prefer the first parse error for context
    const parseError = doc.errors[0];
    if (parseError instanceof YAMLParseError) {
      throw parseError;
    }
    throw new Error(parseError.message);
  }

  if (!doc.contents) {
    throw new Error('YAML document is empty');
  }

  const envelope = validateCatalogEntityEnvelope(doc.toJS({ mapAsMap: false }));
  const { entityRef, slug } = deriveSlug(envelope);

  return {
    ...envelope,
    entityRef,
    slug,
    location: { file: filePath, document: index },
  };
}

function findCatalogInfoFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && /^catalog-info\.ya?ml$/i.test(entry.name))
    .map((entry) => path.join(dir, entry.name));

  const nested = entries
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => findCatalogInfoFiles(path.join(dir, entry.name)));

  return [...files, ...nested];
}

export function loadCatalogEntitiesFromYaml(options: LoadOptions = {}): LoadedCatalogEntity[] {
  const catalogDir = options.catalogDir ?? path.join(process.cwd(), 'content', 'catalog');
  const files = findCatalogInfoFiles(catalogDir);

  const entities = files.flatMap((filePath) => {
    const raw = fs.readFileSync(filePath, 'utf8');
    const documents = parseAllDocuments(raw);

    if (documents.length === 0) {
      throw withContext(filePath, 1, new Error('No YAML documents found'));
    }

    return documents.map((doc, idx) => {
      try {
        return loadDocument(doc, filePath, idx + 1);
      } catch (error) {
        throw withContext(filePath, idx + 1, error);
      }
    });
  });

  return entities.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function catalogEntitySlug(envelope: CatalogEntityEnvelope) {
  const { slug } = deriveSlug(envelope);
  return slug;
}

export function catalogEntityRef(envelope: CatalogEntityEnvelope) {
  const { entityRef } = deriveSlug(envelope);
  return entityRef;
}
