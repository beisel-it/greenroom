import Link from 'next/link';
import type { Route } from 'next';
import type { BrokenReference, CatalogEntityWithRelationships, EntityReference } from '@/lib/content';
import { CatalogEntityGraph } from './catalog-entity-graph';
import { Markdown } from './markdown';

type RelationshipPanelProps = {
  title: string;
  entities: EntityReference[];
  emptyMessage: string;
};

type BreadcrumbItem = {
  label: string;
  title: string;
  href?: string;
};

function RelationshipPanel({ title, entities, emptyMessage }: RelationshipPanelProps) {
  return (
    <div className="card">
      <div className="kicker">{title}</div>
      {entities.length === 0 ? (
        <p className="muted" style={{ marginTop: 12 }}>{emptyMessage}</p>
      ) : (
        <div className="list" style={{ marginTop: 12 }}>
          {entities.map((ref) => (
            <Link key={ref.slug} href={`/catalog/${ref.slug}`} className="entity-link">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <strong>{ref.title}</strong>
                <span className="badge">{ref.kind}</span>
              </div>
              <p className="muted">{ref.entityRef}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function BrokenReferenceBanner({ references }: { references: BrokenReference[] }) {
  if (references.length === 0) return null;

  return (
    <div className="card warning" role="alert">
      <div className="kicker">Broken references</div>
      <ul className="warning-list">
        {references.map((ref) => (
          <li key={`${ref.source.entityRef}-${ref.field}-${ref.target}`}>
            <strong>{ref.source.title}</strong> ({ref.source.kind}) has an unresolved {ref.field} reference to <code>{ref.target}</code> at {ref.location.file} (doc {ref.location.document}).
          </li>
        ))}
      </ul>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value?: string }) {
  return (
    <div className="card catalog-summary-card"><strong>{label}</strong><div className="muted">{value ?? '—'}</div></div>
  );
}

function MetadataLinks({ links }: { links: NonNullable<CatalogEntityWithRelationships['metadata']['links']> }) {
  if (links.length === 0) return null;

  return (
    <div className="card">
      <div className="kicker">References</div>
      <div className="list" style={{ marginTop: 12 }}>
        {links.map((link, index) => (
          <a
            key={`${link.url}:${index}`}
            href={link.url}
            className="entity-link"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <strong>{link.title ?? link.url}</strong>
              {link.type ? <span className="badge">{link.type}</span> : null}
            </div>
            <p className="muted">{link.url}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

function getExplorerBreadcrumbs(entity: CatalogEntityWithRelationships): BreadcrumbItem[] {
  const { relations } = entity;
  const breadcrumbs: BreadcrumbItem[] = [];

  if (entity.kind === 'Domain') {
    return [{ label: 'Domain', title: entity.title }];
  }

  if (relations.domain) {
    breadcrumbs.push({
      label: 'Domain',
      title: relations.domain.title,
      href: `/catalog/${relations.domain.slug}`,
    });
  }

  if (entity.kind === 'System') {
    breadcrumbs.push({ label: 'System', title: entity.title });
    return breadcrumbs;
  }

  if (relations.system) {
    breadcrumbs.push({
      label: 'System',
      title: relations.system.title,
      href: `/catalog/${relations.system.slug}`,
    });
  }

  breadcrumbs.push({ label: entity.kind, title: entity.title });
  return breadcrumbs;
}

function ExplorerBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Catalog path" className="entity-breadcrumbs">
      {items.map((item, index) => (
        <div key={`${item.label}:${item.title}`} className="entity-breadcrumb-item">
          <span className="entity-breadcrumb-label">{item.label}</span>
          {item.href ? (
            <Link href={item.href as Route} className="entity-breadcrumb-link">
              {item.title}
            </Link>
          ) : (
            <span className="entity-breadcrumb-current">{item.title}</span>
          )}
          {index < items.length - 1 ? <span className="entity-breadcrumb-separator">/</span> : null}
        </div>
      ))}
    </nav>
  );
}

export function CatalogEntityContent({ entity }: { entity: CatalogEntityWithRelationships }) {
  const { relations } = entity;
  const owner = 'owner' in entity.spec ? (entity.spec as { owner?: string }).owner : undefined;
  const system = relations.system?.title ?? relations.system?.entityRef;
  const domain = relations.domain?.title ?? relations.domain?.entityRef;
  const breadcrumbs = getExplorerBreadcrumbs(entity);
  const metadataLinks = entity.metadata.links ?? [];

  const showBody = Boolean(entity.summary || entity.metadata.description);

  return (
    <section className="panel catalog-workbench">
      <aside className="catalog-workbench-rail">
        <ExplorerBreadcrumbs items={breadcrumbs} />

        <div className="catalog-workbench-hero">
          <div>
            <div className="kicker">{entity.kind}</div>
            <h1>{entity.title}</h1>
            <p className="muted">{entity.summary}</p>
          </div>
          <div className="badge">{entity.entityRef}</div>
        </div>

        <div className="catalog-summary-grid">
          <SummaryCard label="Owner" value={owner} />
          <SummaryCard label="Domain" value={domain} />
          <SummaryCard label="System" value={system} />
        </div>

        <div className="catalog-entity-actions">
          <Link href="/catalog" className="entity-link">
            <strong>Back to catalog</strong>
            <p className="muted" style={{ marginBottom: 0 }}>Return to the grouped discovery view.</p>
          </Link>
          <Link href="/docs" className="entity-link">
            <strong>Browse docs</strong>
            <p className="muted" style={{ marginBottom: 0 }}>Open the docs index for ADRs, guides, and implementation notes.</p>
          </Link>
        </div>

        <BrokenReferenceBanner references={entity.brokenReferences} />

        {entity.metadata.links?.length ? <MetadataLinks links={entity.metadata.links} /> : null}
      </aside>

      <div className="catalog-workbench-main">
        <CatalogEntityGraph entity={entity} />

        <section className="catalog-workbench-support">
          {entity.kind === 'Domain' && (
            <RelationshipPanel
              title="Systems in domain"
              entities={relations.systemsInDomain}
              emptyMessage="No systems are linked to this domain yet."
            />
          )}

          {entity.kind === 'System' && (
            <div className="grid cols-3" style={{ gap: 16 }}>
              <RelationshipPanel
                title="Components"
                entities={relations.componentsInSystem}
                emptyMessage="No components linked to this system."
              />
              <RelationshipPanel
                title="APIs"
                entities={relations.apisInSystem}
                emptyMessage="No APIs linked to this system."
              />
              <RelationshipPanel
                title="Resources"
                entities={relations.resourcesInSystem}
                emptyMessage="No resources linked to this system."
              />
            </div>
          )}

          {entity.kind === 'API' && (
            <div className="grid cols-2" style={{ gap: 16 }}>
              <RelationshipPanel
                title="Providing components"
                entities={relations.providingComponents}
                emptyMessage="No components provide this API yet."
              />
              <RelationshipPanel
                title="Consuming components"
                entities={relations.consumingComponents}
                emptyMessage="No consumers detected."
              />
            </div>
          )}

          {entity.kind === 'Component' && (
            <div className="grid cols-3" style={{ gap: 16 }}>
              <RelationshipPanel
                title="Provides APIs"
                entities={relations.providesApis}
                emptyMessage="No provided APIs declared."
              />
              <RelationshipPanel
                title="Consumes APIs"
                entities={relations.consumesApis}
                emptyMessage="No consumed APIs declared."
              />
              <RelationshipPanel
                title="Depends on"
                entities={relations.dependsOn}
                emptyMessage="No dependencies declared."
              />
            </div>
          )}

          {relations.dependents.length > 0 && (
            <RelationshipPanel
              title="Dependents"
              entities={relations.dependents}
              emptyMessage=""
            />
          )}
          {showBody ? (
            <div className="card catalog-workbench-body">
              <div className="kicker">Narrative</div>
              <Markdown content={entity.metadata.description ?? entity.summary ?? ''} />
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
