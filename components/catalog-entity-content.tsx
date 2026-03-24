import Link from 'next/link';
import type { BrokenReference, CatalogEntityWithRelationships, EntityReference } from '@/lib/content';
import { Markdown } from './markdown';

type RelationshipPanelProps = {
  title: string;
  entities: EntityReference[];
  emptyMessage: string;
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
    <div className="card"><strong>{label}</strong><div className="muted">{value ?? '—'}</div></div>
  );
}

export function CatalogEntityContent({ entity }: { entity: CatalogEntityWithRelationships }) {
  const { relations } = entity;
  const owner = 'owner' in entity.spec ? (entity.spec as { owner?: string }).owner : undefined;
  const system = relations.system?.title ?? relations.system?.entityRef;
  const domain = relations.domain?.title ?? relations.domain?.entityRef;

  const showBody = Boolean(entity.summary || entity.metadata.description || entity.metadata.links?.length);

  return (
    <section className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start' }}>
        <div>
          <div className="kicker">{entity.kind}</div>
          <h1>{entity.title}</h1>
          <p className="muted">{entity.summary}</p>
        </div>
        <div className="badge">{entity.entityRef}</div>
      </div>

      <div className="grid cols-3" style={{ margin: '20px 0' }}>
        <SummaryCard label="Owner" value={owner}
        />
        <SummaryCard label="Domain" value={domain} />
        <SummaryCard label="System" value={system} />
      </div>

      <BrokenReferenceBanner references={entity.brokenReferences} />

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

      {showBody && <Markdown content={entity.metadata.description ?? entity.summary ?? ''} />}
    </section>
  );
}
