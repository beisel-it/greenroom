import {
  CatalogKind,
  catalogKindOrder,
  DomainSpec,
  DEFAULT_ENTITY_NAMESPACE,
  formatEntityRef,
  parseEntityRef,
  ComponentSpec,
} from './catalog-shared';
import type { LoadedCatalogEntity } from './catalog-loader';

export type EntityReference = {
  entityRef: string;
  slug: string;
  kind: string;
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
  domainSubdomains: Record<string, EntityReference[]>;
  systemComponents: Record<string, EntityReference[]>;
  systemApis: Record<string, EntityReference[]>;
  systemResources: Record<string, EntityReference[]>;
  componentSubcomponents: Record<string, EntityReference[]>;
  apiProviders: Record<string, EntityReference[]>;
  apiConsumers: Record<string, EntityReference[]>;
  dependents: Record<string, EntityReference[]>;
  brokenReferences: BrokenReference[];
};

export type EntityRelationships = {
  owner?: EntityReference;
  domain?: EntityReference;
  parentDomain?: EntityReference;
  system?: EntityReference;
  parentComponent?: EntityReference;
  providesApis: EntityReference[];
  consumesApis: EntityReference[];
  dependsOn: EntityReference[];
  dependents: EntityReference[];
  systemsInDomain: EntityReference[];
  subdomains: EntityReference[];
  componentsInSystem: EntityReference[];
  subcomponents: EntityReference[];
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

export type CatalogRelationType =
  | 'ownedBy'
  | 'ownerOf'
  | 'partOf'
  | 'hasPart'
  | 'providesApi'
  | 'apiProvidedBy'
  | 'consumesApi'
  | 'apiConsumedBy'
  | 'dependsOn'
  | 'dependencyOf';

export type CatalogRelation = {
  type: CatalogRelationType;
  source: EntityReference;
  target: EntityReference;
};

export type CatalogRelationQuery = {
  edges: CatalogRelation[];
  getOutgoing: (entityRef: string, type?: CatalogRelationType) => CatalogRelation[];
  getIncoming: (entityRef: string, type?: CatalogRelationType) => CatalogRelation[];
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

function normalizeTarget(source: LoadedCatalogEntity, raw: string, fallbackKind?: CatalogKind) {
  return parseEntityRef(raw, {
    defaultKind: fallbackKind,
    defaultNamespace: source.metadata.namespace ?? DEFAULT_ENTITY_NAMESPACE,
  });
}

function formatOwnerReference(source: LoadedCatalogEntity, raw: string): EntityReference {
  const ref = parseEntityRef(raw, {
    defaultKind: 'Group',
    defaultNamespace: source.metadata.namespace ?? DEFAULT_ENTITY_NAMESPACE,
  });

  return {
    entityRef: formatEntityRef(ref),
    slug: `${ref.kind.toLowerCase()}/${ref.namespace}/${ref.name}`,
    kind: ref.kind,
    name: ref.name,
    namespace: ref.namespace,
    title: ref.name,
  };
}

function addRelationship(map: Record<string, EntityReference[]>, key: string, ref: EntityReference) {
  const entries = map[key] ?? [];
  if (!entries.some((entry) => entry.entityRef === ref.entityRef)) {
    entries.push(ref);
  }
  map[key] = entries;
}

function addReference(list: EntityReference[], ref: EntityReference) {
  if (!list.some((entry) => entry.entityRef === ref.entityRef)) {
    list.push(ref);
  }
}

function hasAttachedRelationships(
  entity: LoadedCatalogEntity | CatalogEntityWithRelationships,
): entity is CatalogEntityWithRelationships {
  return 'relations' in entity && 'brokenReferences' in entity;
}

function emptyRelations(): EntityRelationships {
  return {
    providesApis: [],
    consumesApis: [],
    dependsOn: [],
    dependents: [],
    systemsInDomain: [],
    subdomains: [],
    componentsInSystem: [],
    subcomponents: [],
    apisInSystem: [],
    resourcesInSystem: [],
    providingComponents: [],
    consumingComponents: [],
  };
}

/**
 * Relations are derived from Backstage envelope semantics instead of persisted
 * as custom relationship fields. Owner comes from `spec.owner`, part-of from
 * `spec.domain`, `spec.system`, `spec.subdomainOf`, and `spec.subcomponentOf`,
 * and API/dependency links come from the corresponding Component/Resource refs.
 */
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
    domainSubdomains: {},
    systemComponents: {},
    systemApis: {},
    systemResources: {},
    componentSubcomponents: {},
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
    const ownerValue = (entity.spec as { owner?: string }).owner;

    if (ownerValue) {
      try {
        setForward.owner = formatOwnerReference(entity, ownerValue);
      } catch (error) {
        recordBroken(entity, 'spec.owner', ownerValue);
      }
    }

    const domainRefValue = (entity.spec as { domain?: string }).domain;
    if (domainRefValue) {
      try {
        const targetRef = normalizeTarget(entity, domainRefValue, 'Domain');
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

    if (entity.kind === 'Domain') {
      const subdomainOf = (entity.spec as DomainSpec).subdomainOf;
      if (subdomainOf) {
        try {
          const targetRef = normalizeTarget(entity, subdomainOf, 'Domain');
          const key = formatEntityRef(targetRef);
          const target = lookup.get(key);
          if (target && target.kind === 'Domain') {
            const ref = toReference(target);
            setForward.parentDomain = ref;
            addRelationship(relationships.domainSubdomains, target.entityRef, sourceRef);
          } else {
            recordBroken(entity, 'spec.subdomainOf', key);
          }
        } catch (error) {
          recordBroken(entity, 'spec.subdomainOf', subdomainOf);
        }
      }
    }

    const systemRefValue = (entity.spec as { system?: string }).system;
    if (systemRefValue) {
      try {
        const targetRef = normalizeTarget(entity, systemRefValue, 'System');
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
      const {
        providesApis = [],
        consumesApis = [],
        dependsOn = [],
        dependencyOf = [],
        subcomponentOf,
      } = entity.spec as ComponentSpec;

      if (subcomponentOf) {
        try {
          const targetRef = normalizeTarget(entity, subcomponentOf, 'Component');
          const key = formatEntityRef(targetRef);
          const target = lookup.get(key);
          if (target && target.kind === 'Component') {
            const ref = toReference(target);
            setForward.parentComponent = ref;
            addRelationship(relationships.componentSubcomponents, target.entityRef, sourceRef);
          } else {
            recordBroken(entity, 'spec.subcomponentOf', key);
          }
        } catch (error) {
          recordBroken(entity, 'spec.subcomponentOf', subcomponentOf);
        }
      }

      providesApis.forEach((raw, index) => {
        try {
          const targetRef = normalizeTarget(entity, raw, 'API');
          const key = formatEntityRef(targetRef);
          const target = lookup.get(key);
          if (target && target.kind === 'API') {
            const ref = toReference(target);
            addReference(setForward.providesApis, ref);
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
          const targetRef = normalizeTarget(entity, raw, 'API');
          const key = formatEntityRef(targetRef);
          const target = lookup.get(key);
          if (target && target.kind === 'API') {
            const ref = toReference(target);
            addReference(setForward.consumesApis, ref);
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
          const targetRef = normalizeTarget(entity, raw);
          const key = formatEntityRef(targetRef);
          const target = lookup.get(key);
          if (target) {
            const ref = toReference(target);
            addReference(setForward.dependsOn, ref);
            addRelationship(relationships.dependents, target.entityRef, sourceRef);
          } else {
            recordBroken(entity, `spec.dependsOn[${index}]`, key);
          }
        } catch (error) {
          recordBroken(entity, `spec.dependsOn[${index}]`, raw);
        }
      });

      dependencyOf.forEach((raw, index) => {
        try {
          const targetRef = normalizeTarget(entity, raw);
          const key = formatEntityRef(targetRef);
          const target = lookup.get(key);
          if (target) {
            const ref = toReference(target);
            addRelationship(relationships.dependents, entity.entityRef, ref);
            addReference(byEntity[target.entityRef].dependsOn, sourceRef);
          } else {
            recordBroken(entity, `spec.dependencyOf[${index}]`, key);
          }
        } catch (error) {
          recordBroken(entity, `spec.dependencyOf[${index}]`, raw);
        }
      });
    }

    if (entity.kind === 'Resource') {
      const {
        dependsOn = [],
        dependencyOf = [],
      } = entity.spec as { dependsOn?: string[]; dependencyOf?: string[] };

      dependsOn.forEach((raw, index) => {
        try {
          const targetRef = normalizeTarget(entity, raw);
          const key = formatEntityRef(targetRef);
          const target = lookup.get(key);
          if (target) {
            const ref = toReference(target);
            addReference(setForward.dependsOn, ref);
            addRelationship(relationships.dependents, target.entityRef, sourceRef);
          } else {
            recordBroken(entity, `spec.dependsOn[${index}]`, key);
          }
        } catch (error) {
          recordBroken(entity, `spec.dependsOn[${index}]`, raw);
        }
      });

      dependencyOf.forEach((raw, index) => {
        try {
          const targetRef = normalizeTarget(entity, raw);
          const key = formatEntityRef(targetRef);
          const target = lookup.get(key);
          if (target) {
            const ref = toReference(target);
            addRelationship(relationships.dependents, entity.entityRef, ref);
            addReference(byEntity[target.entityRef].dependsOn, sourceRef);
          } else {
            recordBroken(entity, `spec.dependencyOf[${index}]`, key);
          }
        } catch (error) {
          recordBroken(entity, `spec.dependencyOf[${index}]`, raw);
        }
      });
    }
  });

  Object.entries(byEntity).forEach(([entityRef, forward]) => {
    byEntity[entityRef] = {
      ...forward,
      systemsInDomain: relationships.domainSystems[entityRef] ?? [],
      subdomains: relationships.domainSubdomains[entityRef] ?? [],
      componentsInSystem: relationships.systemComponents[entityRef] ?? [],
      subcomponents: relationships.componentSubcomponents[entityRef] ?? [],
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

export function createCatalogRelationQuery(
  entities: Array<LoadedCatalogEntity | CatalogEntityWithRelationships>,
): CatalogRelationQuery {
  const attached = entities.every((entity) => hasAttachedRelationships(entity))
    ? (entities as CatalogEntityWithRelationships[])
    : attachCatalogRelationships(entities as LoadedCatalogEntity[]);
  const referenceByEntityRef = new Map(attached.map((entity) => [entity.entityRef, toReference(entity)]));
  const edges: CatalogRelation[] = [];
  const edgeKeys = new Set<string>();

  function addEdge(type: CatalogRelationType, source: EntityReference, target: EntityReference) {
    const key = `${type}:${source.entityRef}->${target.entityRef}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push({ type, source, target });
  }

  attached.forEach((entity) => {
    const source = referenceByEntityRef.get(entity.entityRef);
    if (!source) return;

    if (entity.relations.owner) {
      addEdge('ownedBy', source, entity.relations.owner);
      addEdge('ownerOf', entity.relations.owner, source);
    }

    const partOfTargets = [
      entity.relations.domain,
      entity.relations.parentDomain,
      entity.relations.system,
      entity.relations.parentComponent,
    ].filter((target): target is EntityReference => Boolean(target));
    partOfTargets.forEach((target) => {
      addEdge('partOf', source, target);
      addEdge('hasPart', target, source);
    });

    entity.relations.providesApis.forEach((target) => {
      addEdge('providesApi', source, target);
      addEdge('apiProvidedBy', target, source);
    });

    entity.relations.consumesApis.forEach((target) => {
      addEdge('consumesApi', source, target);
      addEdge('apiConsumedBy', target, source);
    });

    entity.relations.dependsOn.forEach((target) => {
      addEdge('dependsOn', source, target);
      addEdge('dependencyOf', target, source);
    });
  });

  edges.sort((left, right) => {
    const sourceOrder = left.source.entityRef.localeCompare(right.source.entityRef);
    if (sourceOrder !== 0) return sourceOrder;
    const typeOrder = left.type.localeCompare(right.type);
    if (typeOrder !== 0) return typeOrder;
    return left.target.entityRef.localeCompare(right.target.entityRef);
  });

  const filterEdges = (
    direction: 'source' | 'target',
    entityRef: string,
    type?: CatalogRelationType,
  ) => edges.filter((edge) => edge[direction].entityRef === entityRef && (type ? edge.type === type : true));

  return {
    edges,
    getOutgoing: (entityRef, type) => filterEdges('source', entityRef, type),
    getIncoming: (entityRef, type) => filterEdges('target', entityRef, type),
  };
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
