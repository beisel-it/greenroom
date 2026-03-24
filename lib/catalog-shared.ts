export const legacyCatalogKinds = ['org', 'team', 'system', 'component'] as const;
export type LegacyCatalogKind = (typeof legacyCatalogKinds)[number];

export const backstageCatalogKinds = ['Component', 'API', 'System', 'Resource', 'Domain', 'Location'] as const;
export type CatalogKind = (typeof backstageCatalogKinds)[number];

export type CatalogLifecycle = 'experimental' | 'production' | 'deprecated' | 'obsolete';
export type ComponentType = 'service' | 'website' | 'library' | 'tool' | 'documentation' | 'other';
export type ApiType = 'openapi' | 'graphql' | 'grpc' | 'asyncapi' | 'soap' | 'other';

export type EntityLink = {
  url: string;
  title?: string;
  icon?: string;
  type?: string;
};

export type EntityMetadata = {
  name: string;
  namespace?: string;
  title?: string;
  description?: string;
  tags?: string[];
  annotations?: Record<string, string>;
  links?: EntityLink[];
};

export type EntitySpecBase = {
  system?: string;
  domain?: string;
};

export type ComponentSpec = EntitySpecBase & {
  type: ComponentType | string;
  owner: string;
  lifecycle: CatalogLifecycle | string;
  providesApis?: string[];
  consumesApis?: string[];
  dependsOn?: string[];
};

export type ApiSpec = EntitySpecBase & {
  type: ApiType | string;
  owner: string;
  lifecycle: CatalogLifecycle | string;
};

export type SystemSpec = EntitySpecBase & {
  owner: string;
};

export type ResourceSpec = EntitySpecBase & {
  type: string;
  owner: string;
  lifecycle?: CatalogLifecycle;
};

export type DomainSpec = { owner: string };
export type LocationSpec = { type: string; target: string };

export type AnyEntitySpec =
  | ComponentSpec
  | ApiSpec
  | SystemSpec
  | ResourceSpec
  | DomainSpec
  | LocationSpec;

export type CatalogEntityEnvelope<TSpec extends AnyEntitySpec = AnyEntitySpec> = {
  apiVersion: string;
  kind: CatalogKind;
  metadata: EntityMetadata;
  spec: TSpec;
};

export type EntityRef = {
  kind: CatalogKind;
  namespace: string;
  name: string;
};

export type EntityRefInput = string | (Partial<EntityRef> & { name: string });

export const DEFAULT_ENTITY_NAMESPACE = 'default';
export const DEFAULT_ENTITY_KIND: CatalogKind = 'Component';

const ENTITY_REF_PATTERN = /^(?:(?<kind>[^:\/]+):)?(?:(?<namespace>[^\/]+)\/)?(?<name>[^\/]+)$/i;
const VALID_REF_SEGMENT = /^[a-z0-9_.-]+$/i;

function normalizeKind(rawKind?: string): CatalogKind {
  const value = (rawKind ?? DEFAULT_ENTITY_KIND).trim();
  if (!value) throw new Error('Entity kind is required');

  const lower = value.toLowerCase();
  const normalized = lower === 'api'
    ? 'API'
    : (lower.charAt(0).toUpperCase() + lower.slice(1)) as CatalogKind;

  if (!backstageCatalogKinds.includes(normalized)) {
    throw new Error(`Unsupported entity kind "${value}"`);
  }

  return normalized;
}

function normalizeSegment(value: string | undefined, label: 'namespace' | 'name', fallback?: string) {
  const candidate = (value ?? fallback ?? '').trim();
  if (!candidate) throw new Error(`Entity ${label} is required`);
  if (!VALID_REF_SEGMENT.test(candidate)) {
    throw new Error(`Invalid ${label} segment "${candidate}"`);
  }
  return candidate.toLowerCase();
}

export function parseEntityRef(input: EntityRefInput): EntityRef {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    const match = ENTITY_REF_PATTERN.exec(trimmed);
    if (!match || !match.groups) {
      throw new Error(
        `Invalid entity reference "${input}". Expected format [<kind>:][<namespace>/]<name>`,
      );
    }

    const { kind, namespace, name } = match.groups;
    return {
      kind: normalizeKind(kind),
      namespace: normalizeSegment(namespace, 'namespace', DEFAULT_ENTITY_NAMESPACE),
      name: normalizeSegment(name, 'name'),
    };
  }

  const { kind, namespace, name } = input;
  return {
    kind: normalizeKind(kind),
    namespace: normalizeSegment(namespace, 'namespace', DEFAULT_ENTITY_NAMESPACE),
    name: normalizeSegment(name, 'name'),
  };
}

export function formatEntityRef(input: EntityRefInput): string {
  const ref = parseEntityRef(input);
  return `${ref.kind}:${ref.namespace}/${ref.name}`;
}

export function isComponentEntity(
  entity: CatalogEntityEnvelope,
): entity is CatalogEntityEnvelope<ComponentSpec> {
  return entity.kind === 'Component';
}

export function isApiEntity(entity: CatalogEntityEnvelope): entity is CatalogEntityEnvelope<ApiSpec> {
  return entity.kind === 'API';
}

export function isSystemEntity(
  entity: CatalogEntityEnvelope,
): entity is CatalogEntityEnvelope<SystemSpec> {
  return entity.kind === 'System';
}

export function isResourceEntity(
  entity: CatalogEntityEnvelope,
): entity is CatalogEntityEnvelope<ResourceSpec> {
  return entity.kind === 'Resource';
}

export function isDomainEntity(
  entity: CatalogEntityEnvelope,
): entity is CatalogEntityEnvelope<DomainSpec> {
  return entity.kind === 'Domain';
}

export function isLocationEntity(
  entity: CatalogEntityEnvelope,
): entity is CatalogEntityEnvelope<LocationSpec> {
  return entity.kind === 'Location';
}

const BACKSTAGE_API_VERSIONS = new Set([
  'backstage.io/v1alpha1',
  'backstage.io/v1beta1',
  'backstage.io/v1',
]);

export type CatalogEntity = {
  slug: string;
  kind: LegacyCatalogKind;
  title: string;
  summary: string;
  owner?: string;
  system?: string;
  team?: string;
  tags?: string[];
  path: string;
  body: string;
};

export type CatalogFacets = {
  owners: string[];
  teams: string[];
  tags: string[];
};

export type CatalogGroupedEntities =
  Partial<Record<CatalogKind, CatalogEntity[]>> &
  Record<LegacyCatalogKind, CatalogEntity[]>;

export type CatalogFilters = {
  owner?: string;
  team?: string;
  tag?: string;
  tags?: string[];
};

export const catalogKindOrder: readonly LegacyCatalogKind[] = legacyCatalogKinds;

function normalizeTags(filters: CatalogFilters) {
  const incoming = filters.tags ?? (filters.tag ? [filters.tag] : []);
  return Array.from(new Set(incoming.filter(Boolean)));
}

function ensureObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function ensureString(value: unknown, label: string, { allowEmpty = false } = {}) {
  if (typeof value !== 'string') {
    throw new Error(`${label} is required`);
  }
  const trimmed = value.trim();
  if (!allowEmpty && !trimmed) {
    throw new Error(`${label} is required`);
  }
  return trimmed;
}

const NAME_SEGMENT_PATTERN = /^[a-z0-9_.-]+$/i;

function normalizeMetadataSegment(value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined;
  const str = ensureString(value, label);
  if (!NAME_SEGMENT_PATTERN.test(str)) {
    throw new Error(`${label} "${value}" is invalid; use alphanumeric, dash, underscore, or dot`);
  }
  return str.toLowerCase();
}

export function validateEntityMetadata(input: unknown): EntityMetadata {
  const metadata = ensureObject(input, 'metadata');
  const name = normalizeMetadataSegment(metadata.name, 'metadata.name');
  if (!name) throw new Error('metadata.name is required');
  const namespace = normalizeMetadataSegment(metadata.namespace, 'metadata.namespace') ?? DEFAULT_ENTITY_NAMESPACE;

  const metadataTags = metadata.tags;
  if (metadataTags !== undefined && (!Array.isArray(metadataTags) || metadataTags.some((tag) => typeof tag !== 'string'))) {
    throw new Error('metadata.tags must be an array of strings');
  }

  const links = metadata.links;
  if (links !== undefined) {
    if (!Array.isArray(links)) throw new Error('metadata.links must be an array of links');
    links.forEach((link, index) => {
      const linkObject = ensureObject(link, `metadata.links[${index}]`);
      ensureString(linkObject.url, `metadata.links[${index}].url`);
    });
  }

  const annotations = metadata.annotations;
  if (annotations !== undefined) {
    if (!annotations || typeof annotations !== 'object' || Array.isArray(annotations)) {
      throw new Error('metadata.annotations must be an object of string values');
    }
    for (const [key, value] of Object.entries(annotations)) {
      if (typeof value !== 'string') {
        throw new Error(`metadata.annotations[${key}] must be a string`);
      }
    }
  }

  return {
    name,
    namespace,
    title: metadata.title ? ensureString(metadata.title, 'metadata.title') : undefined,
    description: metadata.description
      ? ensureString(metadata.description, 'metadata.description', { allowEmpty: true })
      : undefined,
    tags: metadataTags?.map((tag) => tag.trim()).filter(Boolean),
    annotations: annotations as Record<string, string> | undefined,
    links: links as EntityLink[] | undefined,
  };
}

function validateLifecycle(value: unknown) {
  if (value === undefined) return undefined;
  const lifecycle = ensureString(value, 'spec.lifecycle');
  return lifecycle as CatalogLifecycle;
}

function validateSpecBase(input: Record<string, unknown>): EntitySpecBase {
  return {
    system: input.system ? ensureString(input.system, 'spec.system') : undefined,
    domain: input.domain ? ensureString(input.domain, 'spec.domain') : undefined,
  };
}

function validateComponentSpec(input: Record<string, unknown>): ComponentSpec {
  const base = validateSpecBase(input);
  const type = ensureString(input.type ?? 'other', 'spec.type');
  const lifecycle = ensureString(input.lifecycle ?? '', 'spec.lifecycle');
  const owner = ensureString(input.owner ?? '', 'spec.owner');

  const stringList = (value: unknown, label: string) => {
    if (value === undefined) return undefined;
    if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
      throw new Error(`${label} must be an array of strings`);
    }
    return value.map((v) => ensureString(v, label));
  };

  return {
    ...base,
    type: type as ComponentType,
    lifecycle: lifecycle as CatalogLifecycle,
    owner,
    providesApis: stringList(input.providesApis, 'spec.providesApis'),
    consumesApis: stringList(input.consumesApis, 'spec.consumesApis'),
    dependsOn: stringList(input.dependsOn, 'spec.dependsOn'),
  } satisfies ComponentSpec;
}

function validateApiSpec(input: Record<string, unknown>): ApiSpec {
  const base = validateSpecBase(input);
  const type = ensureString(input.type, 'spec.type');
  const lifecycle = ensureString(input.lifecycle ?? '', 'spec.lifecycle');
  const owner = ensureString(input.owner ?? '', 'spec.owner');

  return {
    ...base,
    type: type as ApiType,
    lifecycle: lifecycle as CatalogLifecycle,
    owner,
  } satisfies ApiSpec;
}

function validateSystemSpec(input: Record<string, unknown>): SystemSpec {
  const base = validateSpecBase(input);
  const owner = ensureString(input.owner ?? '', 'spec.owner');

  return { ...base, owner } satisfies SystemSpec;
}

function validateResourceSpec(input: Record<string, unknown>): ResourceSpec {
  const base = validateSpecBase(input);
  const type = ensureString(input.type ?? '', 'spec.type');
  const owner = ensureString(input.owner ?? '', 'spec.owner');
  const lifecycle = validateLifecycle(input.lifecycle);

  return { ...base, type, owner, lifecycle } satisfies ResourceSpec;
}

function validateDomainSpec(input: Record<string, unknown>): DomainSpec {
  const owner = ensureString(input.owner ?? '', 'spec.owner');
  return { owner } satisfies DomainSpec;
}

function validateLocationSpec(input: Record<string, unknown>): LocationSpec {
  const type = ensureString(input.type, 'spec.type');
  const target = ensureString(input.target, 'spec.target');
  return { type, target } satisfies LocationSpec;
}

function validateSpec(kind: CatalogKind, input: unknown): AnyEntitySpec {
  const spec = ensureObject(input, 'spec');

  switch (kind) {
    case 'Component':
      return validateComponentSpec(spec);
    case 'API':
      return validateApiSpec(spec);
    case 'System':
      return validateSystemSpec(spec);
    case 'Resource':
      return validateResourceSpec(spec);
    case 'Domain':
      return validateDomainSpec(spec);
    case 'Location':
      return validateLocationSpec(spec);
    default:
      throw new Error(`Unsupported kind "${kind}"`);
  }
}

export function validateCatalogEntityEnvelope(input: unknown): CatalogEntityEnvelope {
  const envelope = ensureObject(input, 'entity');
  const apiVersion = ensureString(envelope.apiVersion, 'apiVersion');
  if (!BACKSTAGE_API_VERSIONS.has(apiVersion)) {
    throw new Error(`Unsupported apiVersion "${apiVersion}"`);
  }

  const kind = normalizeKind(ensureString(envelope.kind, 'kind'));
  const metadata = validateEntityMetadata(envelope.metadata);
  const spec = validateSpec(kind, envelope.spec);

  return { apiVersion, kind, metadata, spec };
}

export function groupCatalogEntities(
  entities: CatalogEntity[],
  kindOrder: ReadonlyArray<LegacyCatalogKind> = catalogKindOrder,
): CatalogGroupedEntities {
  const initial = kindOrder.reduce((acc, kind) => {
    acc[kind] = [];
    return acc;
  }, {} as Record<LegacyCatalogKind, CatalogEntity[]>);

  return entities.reduce((acc, entity) => {
    acc[entity.kind]?.push(entity);
    return acc;
  }, { ...initial });
}

export function filterCatalogEntities(
  entities: CatalogEntity[],
  filters: CatalogFilters = {},
): CatalogEntity[] {
  const requestedTags = normalizeTags(filters);

  return entities.filter((entity) => {
    const matchesOwner = filters.owner ? entity.owner === filters.owner : true;
    const matchesTeam = filters.team ? entity.team === filters.team : true;

    const entityTags = entity.tags ?? [];
    const matchesTags =
      requestedTags.length === 0 || requestedTags.every((tag) => entityTags.includes(tag));

    return matchesOwner && matchesTeam && matchesTags;
  });
}
