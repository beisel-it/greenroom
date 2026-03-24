import { describe, expect, it } from 'vitest';
import {
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
});

describe('entity ref parsing', () => {
  it('defaults kind and namespace when omitted', () => {
    const ref = parseEntityRef('artist-service');

    expect(ref).toEqual({
      kind: 'Component',
      namespace: DEFAULT_ENTITY_NAMESPACE,
      name: 'artist-service',
    });
    expect(formatEntityRef('artist-service')).toBe('Component:default/artist-service');
  });

  it('rejects invalid references with clear messaging', () => {
    expect(() => parseEntityRef('Component:bad namespace/name')).toThrow(/namespace segment/);
    expect(() => parseEntityRef('Component:default/invalid!')).toThrow(/Invalid name segment/);
  });
});
