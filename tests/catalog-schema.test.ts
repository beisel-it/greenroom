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

    expect(formatEntityRef({ name: 'identity', namespace: 'Team', kind: 'api' })).toBe('API:team/identity');
  });

  it('rejects invalid references with clear messaging', () => {
    expect(() => parseEntityRef('Component:bad namespace/name')).toThrow(/namespace segment/);
    expect(() => parseEntityRef('Component:default/invalid!')).toThrow(/Invalid name segment/);
    expect(() => parseEntityRef('')).toThrow(/name.*(required|expected)|Invalid entity reference/i);
  });
});
