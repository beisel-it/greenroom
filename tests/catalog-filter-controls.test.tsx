import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

import { CatalogFilterControls } from '../components/catalog-filter-controls';
import type { CatalogFacets } from '../lib/catalog-core';

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
    systems: ['dev-portal', 'data-plane'],
    domains: ['Domain:default/developer-experience'],
    lifecycles: ['experimental', 'production'],
  };

  it('renders All options and facet-derived choices', () => {
    const markup = renderToString(
      <CatalogFilterControls facets={facets} filters={{}} resultCount={6} totalCount={10} />,
    );

    expect(markup).toContain('Search');
    expect(markup).toContain('All owners');
    expect(markup).toContain('All tags');
    expect(markup).toContain('All kinds');
    expect(markup).toContain('All namespaces');
    expect(markup).toContain('All systems');
    expect(markup).toContain('6');
    expect(markup).toContain('10');
    expect(markup).toContain('entities');
    expect(markup).toContain('No active filters.');

    expect(markup).toContain('platform-team');
    expect(markup).toContain('beisel-it');
    expect(markup).toContain('api');
    expect(markup).toContain('web');
    expect(markup).toContain('platform');
    expect(markup).toContain('Component');
    expect(markup).toContain('API');
    expect(markup).toContain('dev-portal');
  });

  it('emits filter changes and resets to undefined', () => {
    const onOwnerChange = vi.fn();
    const onTagChange = vi.fn();
    const onKindChange = vi.fn();
    const onNamespaceChange = vi.fn();
    const onSystemChange = vi.fn();
    const onQueryChange = vi.fn();
    const onReset = vi.fn();

    const element = CatalogFilterControls({
      facets,
      filters: { query: 'portal', owner: 'platform-team', tag: undefined, kind: 'Component', namespace: 'default', system: 'dev-portal' },
      onQueryChange,
      onOwnerChange,
      onTagChange,
      onKindChange,
      onNamespaceChange,
      onSystemChange,
      onReset,
    });

    const queryInput = findByAriaLabel(element, 'Search filter');
    const ownerSelect = findByAriaLabel(element, 'Owner filter');
    const tagSelect = findByAriaLabel(element, 'Tag filter');
    const kindSelect = findByAriaLabel(element, 'Kind filter');
    const namespaceSelect = findByAriaLabel(element, 'Namespace filter');
    const systemSelect = findByAriaLabel(element, 'System filter');

    expect(queryInput?.props.value).toBe('portal');
    queryInput?.props.onChange?.({ target: { value: 'greenroom' } });
    expect(onQueryChange).toHaveBeenCalledWith('greenroom');
    queryInput?.props.onChange?.({ target: { value: '' } });
    expect(onQueryChange).toHaveBeenLastCalledWith(undefined);

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

    systemSelect?.props.onChange?.({ target: { value: 'data-plane' } });
    expect(onSystemChange).toHaveBeenCalledWith('data-plane');
    systemSelect?.props.onChange?.({ target: { value: '' } });
    expect(onSystemChange).toHaveBeenLastCalledWith(undefined);

    const footerChildren = React.Children.toArray((element as React.ReactElement<any>).props.children).at(-1) as React.ReactElement<any>;
    const resetButton = React.Children.toArray(footerChildren.props.children).at(-1) as React.ReactElement<any>;
    resetButton.props.onClick?.();
    expect(onReset).toHaveBeenCalledOnce();
  });
});
