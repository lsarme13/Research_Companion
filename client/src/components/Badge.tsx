import type { ReactNode } from 'react';
import type { SourceStatus } from '../../../shared/types';
import { Icon, IconName } from './Icons';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

const SOURCE_STATUS: Record<SourceStatus, { tone: Tone; label: string }> = {
  pending: { tone: 'warning', label: 'Pendente' },
  approved: { tone: 'success', label: 'Aprovada' },
  rejected: { tone: 'danger', label: 'Rejeitada' },
};

export function SourceStatusBadge({ status }: { status: SourceStatus }) {
  const config = SOURCE_STATUS[status];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}

export function DemoBadge() {
  return (
    <span className="badge badge-neutral demo-badge">
      <Icon name="sparkles" size={12} />
      Modo demonstração
    </span>
  );
}

export function IconBadge({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <span className="icon-badge">
      <Icon name={icon} size={13} />
      {children}
    </span>
  );
}
