import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ENTITY_KIND,
  DEFAULT_ENTITY_NAMESPACE,
  formatEntityRef,
  parseEntityRef,
  validateCatalogEntityEnvelope,
} from '../lib/catalog-shared';

describe('validateCatalogEntityEnvelope', () => {
  it('validates Backstage envelopes and normalizes kind/namespace defaults', () => {
    const envelope = {
      apiVersion: 'backstage.io/v1beta1',
      kind: 'component',
      metadata: {
        name: 'greenroom-web',
      },
      spec: {
        type: 'service',
        lifecycle: 'production',
        owner: 'platform',
      },
    };

    const validated = validateCatalogEntityEnvelope(envelope);

    expect(validated.kind).toBe('Component');
    expect(validated.metadata.namespace).toBe(DEFAULT_ENTITY_NAMESPACE);
    expect(validated.metadata.name).toBe('greenroom-web');
    expect(validated.spec).toMatchObject({
      type: 'service',
      lifecycle: 'production',
      owner: 'platform',
    });
  });

  it('rejects missing metadata.name with a descriptive error', () => {
    const invalidEnvelope = {
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Component',
      metadata: {},
      spec: {
        type: 'service',
        lifecycle: 'production',
        owner: 'platform',
      },
    } as unknown;

    expect(() => validateCatalogEntityEnvelope(invalidEnvelope)).toThrow(/metadata\.name is required/);
  });

  it('rejects missing spec payload', () => {
    const invalidEnvelope = {
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Location',
      metadata: { name: 'greenroom' },
    } as unknown;

    expect(() => validateCatalogEntityEnvelope(invalidEnvelope)).toThrow(/spec must be an object/);
  });

  it('rejects invalid apiVersions and missing required spec fields', () => {
    const invalidVersion = {
      apiVersion: 'backstage.io/v1alpha0',
      kind: 'Component',
      metadata: { name: 'greenroom-web' },
      spec: { type: 'service', lifecycle: 'production', owner: 'platform' },
    } as unknown;

    expect(() => validateCatalogEntityEnvelope(invalidVersion)).toThrow(/Unsupported apiVersion/);

    const missingOwner = {
      apiVersion: 'backstage.io/v1beta1',
      kind: 'API',
      metadata: { name: 'docs-api' },
      spec: { type: 'openapi', lifecycle: 'production' },
    } as unknown;

    expect(() => validateCatalogEntityEnvelope(missingOwner)).toThrow(/spec.owner is required/);
  });

  it('canonicalizes entity-ref fields using the entity namespace and Backstage kind defaults', () => {
    const component = validateCatalogEntityEnvelope({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Component',
      metadata: { name: 'checkout-ui', namespace: 'platform' },
      spec: {
        type: 'website',
        lifecycle: 'production',
        owner: 'platform',
        system: 'checkout',
        domain: 'commerce',
        subcomponentOf: 'shell',
        providesApis: ['public-api'],
        consumesApis: ['default/identity-api'],
        dependsOn: ['Resource:shared/cache', 'worker'],
        dependencyOf: ['frontend'],
      },
    });

    const domain = validateCatalogEntityEnvelope({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Domain',
      metadata: { name: 'payments', namespace: 'platform' },
      spec: { owner: 'platform', subdomainOf: 'commerce' },
    });

    expect(component.spec).toMatchObject({
      system: 'System:platform/checkout',
      domain: 'Domain:platform/commerce',
      subcomponentOf: 'Component:platform/shell',
      providesApis: ['API:platform/public-api'],
      consumesApis: ['API:default/identity-api'],
      dependsOn: ['Resource:shared/cache', 'Component:platform/worker'],
      dependencyOf: ['Component:platform/frontend'],
    });
    expect(domain.spec).toMatchObject({
      subdomainOf: 'Domain:platform/commerce',
    });
  });

  it('supports MVP kind-specific spec fields for Domain, Component, and Location', () => {
    const domain = validateCatalogEntityEnvelope({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Domain',
      metadata: { name: 'payments' },
      spec: { owner: 'platform', subdomainOf: 'commerce' },
    });

    const component = validateCatalogEntityEnvelope({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Component',
      metadata: { name: 'checkout-ui' },
      spec: {
        type: 'website',
        lifecycle: 'production',
        owner: 'platform',
        subcomponentOf: 'checkout-shell',
      },
    });

    const location = validateCatalogEntityEnvelope({
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Location',
      metadata: { name: 'catalog-source' },
      spec: {
        type: 'url',
        targets: ['https://example.com/catalog-info.yaml'],
        presence: 'optional',
      },
    });

    expect(domain.spec).toMatchObject({ owner: 'platform', subdomainOf: 'Domain:default/commerce' });
    expect(component.spec).toMatchObject({ subcomponentOf: 'Component:default/checkout-shell' });
    expect(location.spec).toMatchObject({
      type: 'url',
      targets: ['https://example.com/catalog-info.yaml'],
      presence: 'optional',
    });
  });

  it.each([
    [
      'Component',
      {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Component',
        metadata: { name: 'greenroom-web' },
        spec: { owner: 'platform', type: 'service' },
      },
      /spec\.lifecycle is required/,
    ],
    [
      'API',
      {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'API',
        metadata: { name: 'docs-api' },
        spec: { lifecycle: 'production', owner: 'platform' },
      },
      /spec\.type is required/,
    ],
    [
      'System',
      {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'System',
        metadata: { name: 'dev-portal' },
        spec: {},
      },
      /spec\.owner is required/,
    ],
    [
      'Resource',
      {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Resource',
        metadata: { name: 'platform-db' },
        spec: { owner: 'platform' },
      },
      /spec\.type is required/,
    ],
    [
      'Domain',
      {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Domain',
        metadata: { name: 'commerce' },
        spec: {},
      },
      /spec\.owner is required/,
    ],
    [
      'Location',
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Location',
        metadata: { name: 'catalog-source' },
        spec: { type: 'url' },
      },
      /spec\.target or spec\.targets is required/,
    ],
  ])('rejects invalid required fields for %s entities', (_kind, envelope, expected) => {
    expect(() => validateCatalogEntityEnvelope(envelope)).toThrow(expected);
  });
});

describe('entity ref parsing', () => {
  it('defaults kind and namespace when omitted', () => {
    const ref = parseEntityRef('artist-service');

    expect(ref).toEqual({
      kind: DEFAULT_ENTITY_KIND,
      namespace: DEFAULT_ENTITY_NAMESPACE,
      name: 'artist-service',
    });
    expect(formatEntityRef('artist-service')).toBe('Component:default/artist-service');
  });

  it('uses the provided namespace and kind context for relative refs', () => {
    const ref = parseEntityRef('artist-service', { defaultNamespace: 'platform', defaultKind: 'System' });

    expect(ref).toEqual({
      kind: 'System',
      namespace: 'platform',
      name: 'artist-service',
    });
    expect(formatEntityRef('artist-service', { defaultNamespace: 'platform', defaultKind: 'System' })).toBe(
      'System:platform/artist-service',
    );
  });

  it('normalizes provided kinds and namespaces', () => {
    expect(parseEntityRef('api:Team/Identity')).toEqual({
      kind: 'API',
      namespace: 'team',
      name: 'identity',
    });

    expect(formatEntityRef({ name: 'identity', namespace: 'Team', kind: 'API' })).toBe('API:team/identity');
  });

  it('rejects invalid references with clear messaging', () => {
    expect(() => parseEntityRef('Component:bad namespace/name')).toThrow(/namespace segment/);
    expect(() => parseEntityRef('Component:default/invalid!')).toThrow(/Invalid name segment/);
    expect(() => parseEntityRef('')).toThrow(/name.*(required|expected)|Invalid entity reference/i);
  });
});
