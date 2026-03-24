export const backstageCatalogKinds = ['Component', 'API', 'System', 'Resource', 'Domain', 'Location'] as const;
export type CatalogKind = (typeof backstageCatalogKinds)[number];
export const catalogKindOrder: readonly CatalogKind[] = ['Domain', 'System', 'Component', 'API', 'Resource', 'Location'];

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
  subcomponentOf?: string;
  providesApis?: string[];
  consumesApis?: string[];
  dependsOn?: string[];
  dependencyOf?: string[];
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
  dependsOn?: string[];
  dependencyOf?: string[];
};

export type DomainSpec = {
  owner: string;
  subdomainOf?: string;
};

export type LocationSpec = {
  type: string;
  target?: string;
  targets?: string[];
  presence?: 'required' | 'optional';
};

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
  kind: string;
  namespace: string;
  name: string;
};

export type EntityRefInput = string | (Partial<EntityRef> & { name: string });
export type EntityRefContext = {
  defaultKind?: string;
  defaultNamespace?: string;
};

export const DEFAULT_ENTITY_NAMESPACE = 'default';
export const DEFAULT_ENTITY_KIND: CatalogKind = 'Component';

const ENTITY_REF_PATTERN = /^(?:(?<kind>[^:\/]+):)?(?:(?<namespace>[^\/]+)\/)?(?<name>[^\/]+)$/i;
const VALID_REF_SEGMENT = /^[a-z0-9_.-]+$/i;

function normalizeEntityRefKind(rawKind?: string): string {
  const value = (rawKind ?? DEFAULT_ENTITY_KIND).trim();
  if (!value) throw new Error('Entity kind is required');
  if (!VALID_REF_SEGMENT.test(value)) {
    throw new Error(`Invalid kind segment "${value}"`);
  }

  const lower = value.toLowerCase();
  const normalized =
    lower === 'api' ? 'API' : lower.charAt(0).toUpperCase() + lower.slice(1);

  return normalized;
}

function normalizeKind(rawKind?: string): CatalogKind {
  const normalized = normalizeEntityRefKind(rawKind) as CatalogKind;
  if (!backstageCatalogKinds.includes(normalized)) {
    throw new Error(`Unsupported entity kind "${rawKind ?? ''}"`);
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

export function parseEntityRef(input: EntityRefInput, context: EntityRefContext = {}): EntityRef {
  const defaultKind = context.defaultKind ?? DEFAULT_ENTITY_KIND;
  const defaultNamespace = context.defaultNamespace ?? DEFAULT_ENTITY_NAMESPACE;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error('Entity name is required');
    }
    const match = ENTITY_REF_PATTERN.exec(trimmed);
    if (!match || !match.groups) {
      throw new Error(
        `Invalid entity reference "${input}". Expected format [<kind>:][<namespace>/]<name>`,
      );
    }

    const { kind, namespace, name } = match.groups;
    return {
      kind: normalizeEntityRefKind(kind ?? defaultKind),
      namespace: normalizeSegment(namespace, 'namespace', defaultNamespace),
      name: normalizeSegment(name, 'name'),
    };
  }

  const { kind, namespace, name } = input;
  return {
    kind: normalizeEntityRefKind(kind ?? defaultKind),
    namespace: normalizeSegment(namespace, 'namespace', defaultNamespace),
    name: normalizeSegment(name, 'name'),
  };
}

export function formatEntityRef(input: EntityRefInput, context?: EntityRefContext): string {
  const ref = parseEntityRef(input, context);
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

function normalizeEntityRefValue(
  value: unknown,
  label: string,
  context: EntityRefContext,
): string {
  return formatEntityRef(ensureString(value, label), context);
}

function normalizeEntityRefList(
  value: unknown,
  label: string,
  context: EntityRefContext,
): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw new Error(`${label} must be an array of strings`);
  }

  return value.map((entry) => formatEntityRef(ensureString(entry, label), context));
}

function validateSpecBase(input: Record<string, unknown>, namespace: string): EntitySpecBase {
  return {
    system: input.system
      ? normalizeEntityRefValue(input.system, 'spec.system', {
          defaultKind: 'System',
          defaultNamespace: namespace,
        })
      : undefined,
    domain: input.domain
      ? normalizeEntityRefValue(input.domain, 'spec.domain', {
          defaultKind: 'Domain',
          defaultNamespace: namespace,
        })
      : undefined,
  };
}

function validateComponentSpec(input: Record<string, unknown>, namespace: string): ComponentSpec {
  const base = validateSpecBase(input, namespace);
  const type = ensureString(input.type ?? 'other', 'spec.type');
  const lifecycle = ensureString(input.lifecycle ?? '', 'spec.lifecycle');
  const owner = ensureString(input.owner ?? '', 'spec.owner');
  const subcomponentOf = input.subcomponentOf
    ? normalizeEntityRefValue(input.subcomponentOf, 'spec.subcomponentOf', {
        defaultKind: 'Component',
        defaultNamespace: namespace,
      })
    : undefined;

  return {
    ...base,
    type: type as ComponentType,
    lifecycle: lifecycle as CatalogLifecycle,
    owner,
    subcomponentOf,
    providesApis: normalizeEntityRefList(input.providesApis, 'spec.providesApis', {
      defaultKind: 'API',
      defaultNamespace: namespace,
    }),
    consumesApis: normalizeEntityRefList(input.consumesApis, 'spec.consumesApis', {
      defaultKind: 'API',
      defaultNamespace: namespace,
    }),
    dependsOn: normalizeEntityRefList(input.dependsOn, 'spec.dependsOn', {
      defaultKind: DEFAULT_ENTITY_KIND,
      defaultNamespace: namespace,
    }),
    dependencyOf: normalizeEntityRefList(input.dependencyOf, 'spec.dependencyOf', {
      defaultKind: DEFAULT_ENTITY_KIND,
      defaultNamespace: namespace,
    }),
  } satisfies ComponentSpec;
}

function validateApiSpec(input: Record<string, unknown>, namespace: string): ApiSpec {
  const base = validateSpecBase(input, namespace);
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

function validateSystemSpec(input: Record<string, unknown>, namespace: string): SystemSpec {
  const base = validateSpecBase(input, namespace);
  const owner = ensureString(input.owner ?? '', 'spec.owner');

  return { ...base, owner } satisfies SystemSpec;
}

function validateResourceSpec(input: Record<string, unknown>, namespace: string): ResourceSpec {
  const base = validateSpecBase(input, namespace);
  const type = ensureString(input.type ?? '', 'spec.type');
  const owner = ensureString(input.owner ?? '', 'spec.owner');
  const lifecycle = validateLifecycle(input.lifecycle);

  return {
    ...base,
    type,
    owner,
    lifecycle,
    dependsOn: normalizeEntityRefList(input.dependsOn, 'spec.dependsOn', {
      defaultKind: DEFAULT_ENTITY_KIND,
      defaultNamespace: namespace,
    }),
    dependencyOf: normalizeEntityRefList(input.dependencyOf, 'spec.dependencyOf', {
      defaultKind: DEFAULT_ENTITY_KIND,
      defaultNamespace: namespace,
    }),
  } satisfies ResourceSpec;
}

function validateDomainSpec(input: Record<string, unknown>, namespace: string): DomainSpec {
  const owner = ensureString(input.owner ?? '', 'spec.owner');
  const subdomainOf = input.subdomainOf
    ? normalizeEntityRefValue(input.subdomainOf, 'spec.subdomainOf', {
        defaultKind: 'Domain',
        defaultNamespace: namespace,
      })
    : undefined;
  return { owner, subdomainOf } satisfies DomainSpec;
}

function validateLocationSpec(input: Record<string, unknown>): LocationSpec {
  const type = ensureString(input.type, 'spec.type');
  const target = input.target ? ensureString(input.target, 'spec.target') : undefined;
  const targets = input.targets === undefined
    ? undefined
    : Array.isArray(input.targets) && input.targets.every((item) => typeof item === 'string')
      ? input.targets.map((item) => ensureString(item, 'spec.targets'))
      : (() => {
          throw new Error('spec.targets must be an array of strings');
        })();
  const presence = input.presence === undefined ? undefined : ensureString(input.presence, 'spec.presence');

  if (!target && (!targets || targets.length === 0)) {
    throw new Error('spec.target or spec.targets is required');
  }

  if (presence && presence !== 'required' && presence !== 'optional') {
    throw new Error('spec.presence must be "required" or "optional"');
  }

  return { type, target, targets, presence: presence as LocationSpec['presence'] } satisfies LocationSpec;
}

function validateSpec(kind: CatalogKind, input: unknown, namespace: string): AnyEntitySpec {
  const spec = ensureObject(input, 'spec');

  switch (kind) {
    case 'Component':
      return validateComponentSpec(spec, namespace);
    case 'API':
      return validateApiSpec(spec, namespace);
    case 'System':
      return validateSystemSpec(spec, namespace);
    case 'Resource':
      return validateResourceSpec(spec, namespace);
    case 'Domain':
      return validateDomainSpec(spec, namespace);
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
  const spec = validateSpec(kind, envelope.spec, metadata.namespace ?? DEFAULT_ENTITY_NAMESPACE);

  return { apiVersion, kind, metadata, spec };
}
