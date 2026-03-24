import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

import { CatalogFilterControls } from '../components/catalog-filter-controls';
import { CatalogFacets } from '../lib/content';

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
    owners: ['platform', 'product'],
    teams: ['platform-team', 'growth'],
    tags: ['frontend', 'backend', 'ops'],
  };

  it('renders All options and facet-derived choices', () => {
    const markup = renderToString(
      <CatalogFilterControls facets={facets} filters={{}} />,
    );

    expect(markup).toContain('All owners');
    expect(markup).toContain('All teams');
    expect(markup).toContain('All tags');

    expect(markup).toContain('platform');
    expect(markup).toContain('product');
    expect(markup).toContain('platform-team');
    expect(markup).toContain('growth');
    expect(markup).toContain('frontend');
    expect(markup).toContain('backend');
    expect(markup).toContain('ops');
  });

  it('emits filter changes and resets to undefined', () => {
    const onOwnerChange = vi.fn();
    const onTeamChange = vi.fn();
    const onTagChange = vi.fn();

    const element = CatalogFilterControls({
      facets,
      filters: { owner: 'platform', team: undefined, tag: undefined },
      onOwnerChange,
      onTeamChange,
      onTagChange,
    });

    const ownerSelect = findByAriaLabel(element, 'Owner filter');
    const teamSelect = findByAriaLabel(element, 'Team filter');
    const tagSelect = findByAriaLabel(element, 'Tag filter');

    expect(ownerSelect?.props.value).toBe('platform');
    ownerSelect?.props.onChange?.({ target: { value: 'product' } });
    expect(onOwnerChange).toHaveBeenCalledWith('product');

    ownerSelect?.props.onChange?.({ target: { value: '' } });
    expect(onOwnerChange).toHaveBeenLastCalledWith(undefined);

    teamSelect?.props.onChange?.({ target: { value: 'growth' } });
    expect(onTeamChange).toHaveBeenCalledWith('growth');

    teamSelect?.props.onChange?.({ target: { value: '' } });
    expect(onTeamChange).toHaveBeenLastCalledWith(undefined);

    tagSelect?.props.onChange?.({ target: { value: 'ops' } });
    expect(onTagChange).toHaveBeenCalledWith('ops');

    tagSelect?.props.onChange?.({ target: { value: '' } });
    expect(onTagChange).toHaveBeenLastCalledWith(undefined);
  });
});
