import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

import { CatalogFilterControls } from '../components/catalog-filter-controls';
import type { CatalogFacets } from '../lib/content';

function findByAriaLabel(node: React.ReactNode, label: string): React.ReactElement<any> | null {
  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<any>;
    if (element.props && element.props['aria-label'] === label) return element;

    const children = React.Children.toArray(element.props.children);
    for (const child of children) {
      const found = findByAriaLabel(child, label);
      if (found) return found;
    }
  }

  return null;
}

describe('CatalogFilterControls', () => {
  const facets: CatalogFacets = {
    owners: ['platform-team', 'beisel-it'],
    tags: ['api', 'web', 'platform'],
    kinds: ['Component', 'API', 'System', 'Resource', 'Domain', 'Location'],
    namespaces: ['default', 'platform'],
    systems: ['System:default/dev-portal', 'System:platform/data-plane'],
    domains: ['Domain:default/platform'],
  };

  it('renders All options and facet-derived choices', () => {
    const markup = renderToString(
      <CatalogFilterControls facets={facets} filters={{}} />,
    );

    expect(markup).toContain('All owners');
    expect(markup).toContain('All tags');
    expect(markup).toContain('All kinds');
    expect(markup).toContain('All namespaces');
    expect(markup).toContain('All systems');
    expect(markup).toContain('All domains');

    expect(markup).toContain('platform-team');
    expect(markup).toContain('beisel-it');
    expect(markup).toContain('api');
    expect(markup).toContain('web');
    expect(markup).toContain('platform');
    expect(markup).toContain('Component');
    expect(markup).toContain('API');
    expect(markup).toContain('System:default/dev-portal');
    expect(markup).toContain('Domain:default/platform');
  });

  it('emits filter changes and resets to undefined', () => {
    const onOwnerChange = vi.fn();
    const onTagChange = vi.fn();
    const onKindChange = vi.fn();
    const onNamespaceChange = vi.fn();
    const onSystemChange = vi.fn();
    const onDomainChange = vi.fn();

    const element = CatalogFilterControls({
      facets,
      filters: { owner: 'platform-team', tag: undefined, kind: 'Component', namespace: 'default', system: 'System:default/dev-portal', domain: 'Domain:default/platform' },
      onOwnerChange,
      onTagChange,
      onKindChange,
      onNamespaceChange,
      onSystemChange,
      onDomainChange,
    });

    const ownerSelect = findByAriaLabel(element, 'Owner filter');
    const tagSelect = findByAriaLabel(element, 'Tag filter');
    const kindSelect = findByAriaLabel(element, 'Kind filter');
    const namespaceSelect = findByAriaLabel(element, 'Namespace filter');
    const systemSelect = findByAriaLabel(element, 'System filter');
    const domainSelect = findByAriaLabel(element, 'Domain filter');

    expect(ownerSelect?.props.value).toBe('platform-team');
    ownerSelect?.props.onChange?.({ target: { value: 'beisel-it' } });
    expect(onOwnerChange).toHaveBeenCalledWith('beisel-it');
    ownerSelect?.props.onChange?.({ target: { value: '' } });
    expect(onOwnerChange).toHaveBeenLastCalledWith(undefined);

    tagSelect?.props.onChange?.({ target: { value: 'api' } });
    expect(onTagChange).toHaveBeenCalledWith('api');
    tagSelect?.props.onChange?.({ target: { value: '' } });
    expect(onTagChange).toHaveBeenLastCalledWith(undefined);

    kindSelect?.props.onChange?.({ target: { value: 'API' } });
    expect(onKindChange).toHaveBeenCalledWith('API');
    kindSelect?.props.onChange?.({ target: { value: '' } });
    expect(onKindChange).toHaveBeenLastCalledWith(undefined);

    namespaceSelect?.props.onChange?.({ target: { value: 'platform' } });
    expect(onNamespaceChange).toHaveBeenCalledWith('platform');
    namespaceSelect?.props.onChange?.({ target: { value: '' } });
    expect(onNamespaceChange).toHaveBeenLastCalledWith(undefined);

    systemSelect?.props.onChange?.({ target: { value: 'System:platform/data-plane' } });
    expect(onSystemChange).toHaveBeenCalledWith('System:platform/data-plane');
    systemSelect?.props.onChange?.({ target: { value: '' } });
    expect(onSystemChange).toHaveBeenLastCalledWith(undefined);

    domainSelect?.props.onChange?.({ target: { value: 'Domain:default/platform' } });
    expect(onDomainChange).toHaveBeenCalledWith('Domain:default/platform');
    domainSelect?.props.onChange?.({ target: { value: '' } });
    expect(onDomainChange).toHaveBeenLastCalledWith(undefined);
  });
});
