import type { Activity } from '../../../shared/types';
import { formatRelative } from '../utils/format';
import { Icon, IconName } from './Icons';

const TYPE_ICON: Partial<Record<string, IconName>> = {
  'research.created': 'folder',
  'research.updated': 'edit',
  'research.archived': 'archive',
  'research.restored': 'refresh',
  'source.file_added': 'file',
  'source.url_added': 'link',
  'source.search_added': 'search',
  'source.approved': 'check',
  'source.rejected': 'x',
  'source.removed': 'trash',
  'source.evaluated': 'sparkles',
  'note.created': 'notes',
  'note.updated': 'edit',
  'note.removed': 'trash',
  'ai.asked': 'sparkles',
  'ai.analyzed': 'reader',
};

export function ActivityFeed({
  items,
  showResearch = false,
  emptyText = 'Nenhuma atividade registrada ainda.',
}: {
  items: Array<Activity & { researchTitle?: string }>;
  showResearch?: boolean;
  emptyText?: string;
}) {
  if (!items.length) {
    return <p className="activity-empty">{emptyText}</p>;
  }
  return (
    <ol className="activity-feed">
      {items.map((item) => (
        <li key={item.id} className="activity-item">
          <span className="activity-icon">
            <Icon name={TYPE_ICON[item.type] || 'info'} size={13} />
          </span>
          <div className="activity-content">
            {showResearch && item.researchTitle ? (
              <div className="activity-research">{item.researchTitle}</div>
            ) : null}
            <div className="activity-message">{item.message}</div>
            <div className="activity-time">{formatRelative(item.at)}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
