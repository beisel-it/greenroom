import {
  CatalogKind,
  catalogKindOrder,
  DEFAULT_ENTITY_KIND,
  DEFAULT_ENTITY_NAMESPACE,
  formatEntityRef,
  parseEntityRef,
  ComponentSpec,
} from './catalog-shared';
import type { LoadedCatalogEntity } from './catalog-loader';

export type EntityReference = {
  entityRef: string;
  slug: string;
  kind: CatalogKind;
  name: string;
  namespace: string;
  title: string;
};

export type BrokenReference = {
  source: EntityReference;
  field: string;
  target: string;
  location: LoadedCatalogEntity['location'];
};

export type DerivedRelationshipMaps = {
  domainSystems: Record<string, EntityReference[]>;
  systemComponents: Record<string, EntityReference[]>;
  systemApis: Record<string, EntityReference[]>;
  systemResources: Record<string, EntityReference[]>;
  apiProviders: Record<string, EntityReference[]>;
  apiConsumers: Record<string, EntityReference[]>;
  dependents: Record<string, EntityReference[]>;
  brokenReferences: BrokenReference[];
};

export type EntityRelationships = {
  domain?: EntityReference;
  system?: EntityReference;
  providesApis: EntityReference[];
  consumesApis: EntityReference[];
  dependsOn: EntityReference[];
  dependents: EntityReference[];
  systemsInDomain: EntityReference[];
  componentsInSystem: EntityReference[];
  apisInSystem: EntityReference[];
  resourcesInSystem: EntityReference[];
  providingComponents: EntityReference[];
  consumingComponents: EntityReference[];
};

export type CatalogEntityWithRelationships = LoadedCatalogEntity & {
  title: string;
  summary: string;
  relations: EntityRelationships;
  brokenReferences: BrokenReference[];
};

export type CatalogFacets = {
  owners: string[];
  tags: string[];
  kinds: CatalogKind[];
  namespaces: string[];
  systems: string[];
  domains: string[];
};

export type CatalogGroupedEntities = Partial<Record<CatalogKind, CatalogEntityWithRelationships[]>>;

export type CatalogFilters = {
  owner?: string;
  tag?: string;
  tags?: string[];
  kind?: CatalogKind;
  namespace?: string;
  system?: string;
};

function toReference(entity: LoadedCatalogEntity): EntityReference {
  return {
    entityRef: entity.entityRef,
    slug: entity.slug,
    kind: entity.kind,
    name: entity.metadata.name,
    namespace: entity.metadata.namespace ?? DEFAULT_ENTITY_NAMESPACE,
    title: entity.metadata.title ?? entity.metadata.name,
  };
}

function normalizeTarget(raw: string, fallbackKind?: CatalogKind) {
  const value = raw.trim();
  const hasKind = value.includes(':');
  if (hasKind) return parseEntityRef(value);
  if (!fallbackKind) return parseEntityRef(value);
  return parseEntityRef(`${fallbackKind}:${value}`);
}

function addRelationship(map: Record<string, EntityReference[]>, key: string, ref: EntityReference) {
  const entries = map[key] ?? [];
  if (!entries.some((entry) => entry.entityRef === ref.entityRef)) {
    entries.push(ref);
  }
  map[key] = entries;
}

function emptyRelations(): EntityRelationships {
  return {
    providesApis: [],
    consumesApis: [],
    dependsOn: [],
    dependents: [],
    systemsInDomain: [],
    componentsInSystem: [],
    apisInSystem: [],
    resourcesInSystem: [],
    providingComponents: [],
    consumingComponents: [],
  };
}

export function deriveCatalogRelationships(entities: LoadedCatalogEntity[]): {
  relationships: DerivedRelationshipMaps;
  byEntity: Record<string, EntityRelationships>;
} {
  const lookup = new Map<string, LoadedCatalogEntity>();
  const byEntity: Record<string, EntityRelationships> = {};

  entities.forEach((entity) => {
    lookup.set(entity.entityRef, entity);
    byEntity[entity.entityRef] = emptyRelations();
  });

  const relationships: DerivedRelationshipMaps = {
    domainSystems: {},
    systemComponents: {},
    systemApis: {},
    systemResources: {},
    apiProviders: {},
    apiConsumers: {},
    dependents: {},
    brokenReferences: [],
  };

  function recordBroken(source: LoadedCatalogEntity, field: string, target: string) {
    relationships.brokenReferences.push({
      source: toReference(source),
      field,
      target,
      location: source.location,
    });
  }

  entities.forEach((entity) => {
    const sourceRef = toReference(entity);
    const setForward = byEntity[entity.entityRef];

    const domainRefValue = (entity.spec as { domain?: string }).domain;
    if (domainRefValue) {
      try {
        const targetRef = normalizeTarget(domainRefValue, 'Domain');
        const key = formatEntityRef(targetRef);
        const target = lookup.get(key);
        if (target && target.kind === 'Domain') {
          const ref = toReference(target);
          setForward.domain = ref;
          addRelationship(relationships.domainSystems, target.entityRef, sourceRef);
        } else {
          recordBroken(entity, 'spec.domain', key);
        }
      } catch (error) {
        recordBroken(entity, 'spec.domain', domainRefValue);
      }
    }

    const systemRefValue = (entity.spec as { system?: string }).system;
    if (systemRefValue) {
      try {
        const targetRef = normalizeTarget(systemRefValue, 'System');
        const key = formatEntityRef(targetRef);
        const target = lookup.get(key);
        if (target && target.kind === 'System') {
          const ref = toReference(target);
          setForward.system = ref;
          if (entity.kind === 'Component') {
            addRelationship(relationships.systemComponents, target.entityRef, sourceRef);
          }
          if (entity.kind === 'API') {
            addRelationship(relationships.systemApis, target.entityRef, sourceRef);
          }
          if (entity.kind === 'Resource') {
            addRelationship(relationships.systemResources, target.entityRef, sourceRef);
          }
        } else {
          recordBroken(entity, 'spec.system', key);
        }
      } catch (error) {
        recordBroken(entity, 'spec.system', systemRefValue);
      }
    }

    if (entity.kind === 'Component') {
      const { providesApis = [], consumesApis = [], dependsOn = [] } = entity.spec as ComponentSpec;

      providesApis.forEach((raw, index) => {
        try {
          const targetRef = normalizeTarget(raw, 'API');
          const key = formatEntityRef(targetRef);
          const target = lookup.get(key);
          if (target && target.kind === 'API') {
            const ref = toReference(target);
            setForward.providesApis.push(ref);
            addRelationship(relationships.apiProviders, target.entityRef, sourceRef);
          } else {
            recordBroken(entity, `spec.providesApis[${index}]`, key);
          }
        } catch (error) {
          recordBroken(entity, `spec.providesApis[${index}]`, raw);
        }
      });

      consumesApis.forEach((raw, index) => {
        try {
          const targetRef = normalizeTarget(raw, 'API');
          const key = formatEntityRef(targetRef);
          const target = lookup.get(key);
          if (target && target.kind === 'API') {
            const ref = toReference(target);
            setForward.consumesApis.push(ref);
            addRelationship(relationships.apiConsumers, target.entityRef, sourceRef);
          } else {
            recordBroken(entity, `spec.consumesApis[${index}]`, key);
          }
        } catch (error) {
          recordBroken(entity, `spec.consumesApis[${index}]`, raw);
        }
      });

      dependsOn.forEach((raw, index) => {
        try {
          const hasKind = raw.includes(':');
          const targetRef = hasKind ? parseEntityRef(raw) : parseEntityRef({ name: raw, kind: DEFAULT_ENTITY_KIND });
          const key = formatEntityRef(targetRef);
          const target = lookup.get(key);
          if (target) {
            const ref = toReference(target);
            setForward.dependsOn.push(ref);
            addRelationship(relationships.dependents, target.entityRef, sourceRef);
          } else {
            recordBroken(entity, `spec.dependsOn[${index}]`, key);
          }
        } catch (error) {
          recordBroken(entity, `spec.dependsOn[${index}]`, raw);
        }
      });
    }
  });

  Object.entries(byEntity).forEach(([entityRef, forward]) => {
    byEntity[entityRef] = {
      ...forward,
      systemsInDomain: relationships.domainSystems[entityRef] ?? [],
      componentsInSystem: relationships.systemComponents[entityRef] ?? [],
      apisInSystem: relationships.systemApis[entityRef] ?? [],
      resourcesInSystem: relationships.systemResources[entityRef] ?? [],
      providingComponents: relationships.apiProviders[entityRef] ?? [],
      consumingComponents: relationships.apiConsumers[entityRef] ?? [],
      dependents: relationships.dependents[entityRef] ?? forward.dependents,
    } satisfies EntityRelationships;
  });

  return { relationships, byEntity };
}

function withPresentation(entity: LoadedCatalogEntity, relations: EntityRelationships, broken: BrokenReference[]): CatalogEntityWithRelationships {
  return {
    ...entity,
    title: entity.metadata.title ?? entity.metadata.name,
    summary: entity.metadata.description ?? '',
    relations,
    brokenReferences: broken,
  } satisfies CatalogEntityWithRelationships;
}

export function attachCatalogRelationships(entities: LoadedCatalogEntity[]): CatalogEntityWithRelationships[] {
  const { relationships, byEntity } = deriveCatalogRelationships(entities);
  return entities.map((entity) => withPresentation(
    entity,
    byEntity[entity.entityRef] ?? emptyRelations(),
    relationships.brokenReferences.filter((ref) => ref.source.entityRef === entity.entityRef),
  ));
}

export function getCatalogFacets(entities: CatalogEntityWithRelationships[]): CatalogFacets {
  const owners = new Set<string>();
  const tags = new Set<string>();
  const namespaces = new Set<string>();
  const systems = new Set<string>();

  entities.forEach((entity) => {
    if ('owner' in entity.spec && (entity.spec as { owner?: string }).owner) {
      owners.add((entity.spec as { owner?: string }).owner as string);
    }
    (entity.metadata.tags ?? []).forEach((tag) => tags.add(tag));
    namespaces.add((entity.metadata.namespace ?? DEFAULT_ENTITY_NAMESPACE).toLowerCase());

    if (entity.kind === 'System') systems.add(entity.entityRef);
  });

  return {
    owners: Array.from(owners).sort(),
    tags: Array.from(tags).sort(),
    kinds: catalogKindOrder.slice() as CatalogKind[],
    namespaces: Array.from(namespaces).sort(),
    systems: Array.from(systems).sort(),
    domains: Array.from(entities.filter((e) => e.kind === 'Domain').map((e) => e.entityRef)).sort(),
  } satisfies CatalogFacets;
}

function normalizeTags(filters: CatalogFilters) {
  const incoming = filters.tags ?? (filters.tag ? [filters.tag] : []);
  return Array.from(new Set(incoming.filter(Boolean)));
}

export function filterCatalogEntities(
  entities: CatalogEntityWithRelationships[],
  filters: CatalogFilters = {},
): CatalogEntityWithRelationships[] {
  const requestedTags = normalizeTags(filters);

  const normalizeTargetRef = (val: string, kind: CatalogKind) => {
    const hasKind = val.includes(':');
    if (hasKind) return formatEntityRef(val);
    const hasNamespace = val.includes('/');
    if (hasNamespace) return formatEntityRef(`${kind}:${val}`);
    return formatEntityRef({ kind, name: val });
  };

  const wantedSystem = filters.system ? normalizeTargetRef(filters.system, 'System') : undefined;

  return entities.filter((entity) => {
    const matchesOwner = filters.owner ? ('owner' in entity.spec ? (entity.spec as { owner?: string }).owner === filters.owner : false) : true;
    const matchesKind = filters.kind ? entity.kind === filters.kind : true;

    const namespace = (entity.metadata.namespace ?? DEFAULT_ENTITY_NAMESPACE).toLowerCase();
    const matchesNamespace = filters.namespace ? namespace === filters.namespace.toLowerCase() : true;

    const entitySystemRef = entity.kind === 'System' ? entity.entityRef : entity.relations.system?.entityRef;
    const matchesSystem = wantedSystem ? entitySystemRef === wantedSystem : true;

    const entityTags = entity.metadata.tags ?? [];
    const matchesTags =
      requestedTags.length === 0 || requestedTags.every((tag) => entityTags.includes(tag));

    return matchesOwner && matchesKind && matchesNamespace && matchesSystem && matchesTags;
  });
}

export function groupCatalogEntities(
  entities: CatalogEntityWithRelationships[],
  kindOrder: ReadonlyArray<CatalogKind> = catalogKindOrder,
): CatalogGroupedEntities {
  const initial = kindOrder.reduce((acc, kind) => {
    acc[kind] = [];
    return acc;
  }, {} as Record<CatalogKind, CatalogEntityWithRelationships[]>);

  return entities.reduce((acc, entity) => {
    acc[entity.kind]?.push(entity);
    return acc;
  }, { ...initial });
}

export { catalogKindOrder } from './catalog-shared';
export type { CatalogKind } from './catalog-shared';
