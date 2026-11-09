import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import type { ResearchSummary } from '../../../shared/types';
import { Icon, IconName } from './Icons';
import { Badge } from './Badge';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
}

const GLOBAL_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/library', label: 'Biblioteca de documentos', icon: 'library' },
  { to: '/settings', label: 'Configurações', icon: 'settings' },
];

const GROUPS: Array<{ id: string; label: string; items: NavItem[] }> = [
  {
    id: 'materials',
    label: 'Materiais',
    items: [
      { to: 'documents', label: 'Documentos', icon: 'file' },
      { to: 'sources', label: 'Fontes', icon: 'globe' },
    ],
  },
  {
    id: 'investigation',
    label: 'Investigação',
    items: [
      { to: 'reader', label: 'Leitor Inteligente', icon: 'reader' },
      { to: 'notes', label: 'Notas', icon: 'notes' },
    ],
  },
];

const GROUP_KEY = 'rc:nav-groups';

function readCollapsedGroups(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(GROUP_KEY);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    // Usa o padrão: todos os grupos expandidos.
  }
  return {};
}

export function Sidebar({ research }: { research: ResearchSummary | null }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(readCollapsedGroups);

  useEffect(() => {
    try {
      localStorage.setItem(GROUP_KEY, JSON.stringify(collapsed));
    } catch {
      // Preferência apenas visual.
    }
  }, [collapsed]);

  const toggleGroup = (id: string) => {
    setCollapsed((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          RC
        </div>
        <div>
          <div className="brand-name">Research Companion</div>
          <div className="brand-tagline">Ambiente de investigação</div>
        </div>
      </div>

      <div className="sidebar-scroll">
        <nav className="nav-section" aria-label="Navegação global">
          <div className="nav-label">Aplicativo</div>
          {GLOBAL_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {research ? (
          <div className="research-nav">
            <div className="research-nav-divider" />
            <NavLink to="/" className="back-link">
              <Icon name="arrow-left" size={14} />
              <span>Todas as pesquisas</span>
            </NavLink>
            <div className="research-nav-title">
              <span className="research-nav-name" title={research.title}>
                {research.title}
              </span>
              {research.status === 'archived' ? <Badge tone="neutral">Arquivada</Badge> : null}
            </div>

            {GROUPS.map((group) => {
              const isCollapsed = Boolean(collapsed[group.id]);
              return (
                <div className="nav-group" key={group.id}>
                  <button
                    type="button"
                    className={`nav-group-toggle ${isCollapsed ? 'is-collapsed' : ''}`}
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={!isCollapsed}
                  >
                    <span>{group.label}</span>
                    <Icon name="chevron-down" size={13} />
                  </button>
                  {!isCollapsed ? (
                    <div className="nav-group-items">
                      {group.items.map((item) => {
                        const to = `/research/${research.id}/${item.to}`;
                        return (
                          <NavLink
                            key={item.to}
                            to={to}
                            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                          >
                            <Icon name={item.icon} size={16} />
                            <span>{item.label}</span>
                            {item.to === 'sources' && research.counts.pendingSources > 0 ? (
                              <span className="nav-count" aria-label={`${research.counts.pendingSources} pendentes`}>
                                {research.counts.pendingSources}
                              </span>
                            ) : null}
                          </NavLink>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <footer className="sidebar-footer">
        <Icon name="lock" size={13} />
        <span>Dados armazenados localmente</span>
      </footer>
    </aside>
  );
}
