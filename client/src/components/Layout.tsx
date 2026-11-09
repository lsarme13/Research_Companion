import type { ReactNode } from 'react';
import { Icon, IconName } from './Icons';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions, meta }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header-text">
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h1>{title}</h1>
        {description ? <div className="page-description">{description}</div> : null}
        {meta ? <div className="page-meta">{meta}</div> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon = 'folder', title, description, action, compact }: EmptyStateProps) {
  return (
    <div className={`empty-state ${compact ? 'empty-state-compact' : ''}`}>
      <span className="empty-state-icon">
        <Icon name={icon} size={22} />
      </span>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <h2>{children}</h2>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
