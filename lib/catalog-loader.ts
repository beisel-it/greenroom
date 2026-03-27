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
  /** Override the repo-owned catalog-info.yaml file. Included by default when using the default catalogDir. */
  repoCatalogFile?: string;
};

export type CatalogLoadErrorCode = 'yaml_parse' | 'yaml_empty' | 'validation';

export type CatalogLoadErrorDetails = {
  code: CatalogLoadErrorCode;
  file: string;
  document: number;
  field?: string;
  message: string;
};

const FIELD_PATTERN = /^(apiVersion|kind|metadata(?:\.[a-zA-Z0-9_[\].-]+)?|spec(?:\.[a-zA-Z0-9_[\].-]+)?)/;

function extractField(message: string) {
  const match = FIELD_PATTERN.exec(message.trim());
  return match?.[1];
}

export class CatalogLoadError extends Error {
  readonly code: CatalogLoadErrorCode;
  readonly file: string;
  readonly document: number;
  readonly field?: string;

  constructor(details: CatalogLoadErrorDetails) {
    const relativeFile = path.relative(process.cwd(), details.file) || details.file;
    const fieldSuffix = details.field ? ` [field: ${details.field}]` : '';
    super(`${relativeFile} (document ${details.document})${fieldSuffix}: ${details.message}`);
    this.name = 'CatalogLoadError';
    this.code = details.code;
    this.file = details.file;
    this.document = details.document;
    this.field = details.field;
  }
}

export class CatalogAggregateLoadError extends Error {
  readonly errors: CatalogLoadError[];

  constructor(errors: CatalogLoadError[]) {
    const sortedErrors = [...errors].sort((left, right) => {
      if (left.file === right.file) {
        return left.document - right.document;
      }
      return left.file.localeCompare(right.file);
    });
    super(sortedErrors.map((error) => error.message).join('\n'));
    this.name = 'CatalogAggregateLoadError';
    this.errors = sortedErrors;
  }
}

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

function toCatalogLoadError(filePath: string, documentIndex: number, error: unknown): CatalogLoadError {
  if (error instanceof CatalogLoadError) {
    return error;
  }

  if (error instanceof YAMLParseError) {
    return new CatalogLoadError({
      code: 'yaml_parse',
      file: filePath,
      document: documentIndex,
      message: error.message,
    });
  }

  const message = error instanceof Error ? error.message : String(error);
  return new CatalogLoadError({
    code: message.includes('empty') ? 'yaml_empty' : 'validation',
    file: filePath,
    document: documentIndex,
    field: extractField(message),
    message,
  });
}

function loadDocument(doc: ReturnType<typeof parseAllDocuments>[number], filePath: string, index: number): LoadedCatalogEntity {
  if (!doc) {
    throw new CatalogLoadError({
      code: 'yaml_empty',
      file: filePath,
      document: index,
      message: 'YAML document is empty',
    });
  }

  if (doc.errors.length) {
    // Prefer the first parse error for context
    const parseError = doc.errors[0];
    if (parseError instanceof YAMLParseError) {
      throw toCatalogLoadError(filePath, index, parseError);
    }
    throw toCatalogLoadError(filePath, index, parseError);
  }

  if (!doc.contents) {
    throw new CatalogLoadError({
      code: 'yaml_empty',
      file: filePath,
      document: index,
      message: 'YAML document is empty',
    });
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

function collectCatalogInfoFiles(options: LoadOptions): string[] {
  const catalogDir = options.catalogDir ?? path.join(process.cwd(), 'content', 'catalog');
  const files = findCatalogInfoFiles(catalogDir);

  // Dogfood the same contract from the repository root when using the default catalog content.
  if (options.catalogDir === undefined) {
    const repoCatalogFile = options.repoCatalogFile ?? path.join(process.cwd(), 'catalog-info.yaml');
    if (fs.existsSync(repoCatalogFile) && !files.includes(repoCatalogFile)) {
      files.push(repoCatalogFile);
    }
  }

  return files;
}

export function loadCatalogEntitiesFromYaml(options: LoadOptions = {}): LoadedCatalogEntity[] {
  const files = collectCatalogInfoFiles(options);
  const errors: CatalogLoadError[] = [];

  const entities = files.flatMap((filePath) => {
    const raw = fs.readFileSync(filePath, 'utf8');
    const documents = parseAllDocuments(raw);

    if (documents.length === 0) {
      errors.push(
        new CatalogLoadError({
          code: 'yaml_empty',
          file: filePath,
          document: 1,
          message: 'No YAML documents found',
        }),
      );
      return [];
    }

    return documents.flatMap((doc, idx) => {
      try {
        return [loadDocument(doc, filePath, idx + 1)];
      } catch (error) {
        errors.push(toCatalogLoadError(filePath, idx + 1, error));
        return [];
      }
    });
  });

  if (errors.length) {
    throw new CatalogAggregateLoadError(errors);
  }

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
