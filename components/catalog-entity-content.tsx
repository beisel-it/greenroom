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
              <p className="muted">View catalog entry</p>
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
          <li key={`${ref.slug}-${ref.field}-${ref.target}`}>
            <strong>{ref.title}</strong> ({ref.kind}) has an unresolved {ref.field} reference to <code>{ref.target}</code>.
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CatalogEntityContent({ entity }: { entity: CatalogEntityWithRelationships }) {
  const isTeam = entity.kind === 'team';
  const isSystem = entity.kind === 'system';

  return (
    <section className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start' }}>
        <div>
          <div className="kicker">{entity.kind}</div>
          <h1>{entity.title}</h1>
          <p className="muted">{entity.summary}</p>
        </div>
        <div className="badge">{entity.slug}</div>
      </div>

      <div className="grid cols-3" style={{ margin: '20px 0' }}>
        <div className="card"><strong>Owner</strong><div className="muted">{entity.owner ?? '—'}</div></div>
        <div className="card"><strong>Team</strong><div className="muted">{entity.team ?? '—'}</div></div>
        <div className="card"><strong>System</strong><div className="muted">{entity.system ?? '—'}</div></div>
      </div>

      <BrokenReferenceBanner references={entity.brokenReferences} />

      {isTeam && (
        <RelationshipPanel
          title="Linked systems"
          entities={entity.systems}
          emptyMessage="No systems are linked to this team yet."
        />
      )}

      {isSystem && (
        <RelationshipPanel
          title="Linked components"
          entities={entity.components}
          emptyMessage="No components are linked to this system yet."
        />
      )}

      <Markdown content={entity.body} />
    </section>
  );
}
