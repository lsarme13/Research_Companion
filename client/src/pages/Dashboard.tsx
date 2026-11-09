import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Activity, ResearchSummary } from '../../../shared/types';
import { api, errorMessage } from '../api';
import { ActivityFeed } from '../components/ActivityFeed';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState, PageHeader, SectionTitle } from '../components/Layout';
import { ErrorBlock, LoadingBlock } from '../components/Feedback';
import { Modal } from '../components/Modal';
import { Icon } from '../components/Icons';
import { useToast } from '../components/Toast';
import { formatRelative } from '../utils/format';

type SortKey = 'activity' | 'title' | 'created-desc' | 'created-asc';

const SORT_KEY = 'rc:research-sort';

function readSort(): SortKey {
  const stored = localStorage.getItem(SORT_KEY);
  return stored === 'title' || stored === 'created-desc' || stored === 'created-asc' ? stored : 'activity';
}

export function Dashboard() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [research, setResearch] = useState<ResearchSummary[] | null>(null);
  const [activity, setActivity] = useState<Array<Activity & { researchTitle?: string }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>(readSort);
  const [showArchived, setShowArchived] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [items, recent] = await Promise.all([api.listResearch(true), api.getGlobalActivity()]);
      setResearch(items);
      setActivity(recent as Array<Activity & { researchTitle?: string }>);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    try {
      localStorage.setItem(SORT_KEY, sort);
    } catch {
      // A ordenação é apenas uma preferência local.
    }
  }, [sort]);

  const active = useMemo(() => (research || []).filter((item) => item.status === 'active'), [research]);
  const archived = useMemo(() => (research || []).filter((item) => item.status === 'archived'), [research]);

  const sortedActive = useMemo(() => sortResearch(active, sort), [active, sort]);
  const sortedArchived = useMemo(() => sortResearch(archived, 'activity'), [archived]);

  return (
    <>
      <PageHeader
        eyebrow="Ambiente de investigação"
        title="Pesquisas"
        description="Retome uma investigação ou comece uma nova. Cada pesquisa mantém seu próprio contexto, fontes e anotações."
        actions={
          <Button variant="primary" icon="plus" onClick={() => setCreateOpen(true)}>
            Nova pesquisa
          </Button>
        }
      />

      {error ? (
        <ErrorBlock message={error} onRetry={() => void load()} />
      ) : research === null ? (
        <LoadingBlock label="Carregando pesquisas…" />
      ) : (
        <div className="dashboard-grid">
          <section className="dashboard-main" aria-label="Pesquisas">
            <div className="list-toolbar">
              <span className="list-count">
                {active.length === 1 ? '1 pesquisa ativa' : `${active.length} pesquisas ativas`}
              </span>
              <label className="select-inline">
                <span>Ordenar por</span>
                <select
                  className="select select-sm"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                >
                  <option value="activity">Atividade recente</option>
                  <option value="title">Título</option>
                  <option value="created-desc">Criação: mais novas</option>
                  <option value="created-asc">Criação: mais antigas</option>
                </select>
              </label>
            </div>

            {active.length === 0 ? (
              <EmptyState
                icon="folder"
                title="Nenhuma pesquisa ativa"
                description="Crie um espaço para reunir fontes, registrar perguntas e construir suas interpretações."
                action={
                  <Button variant="primary" icon="plus" onClick={() => setCreateOpen(true)}>
                    Criar primeira pesquisa
                  </Button>
                }
              />
            ) : (
              <div className="research-grid">
                {sortedActive.map((item) => (
                  <ResearchCard key={item.id} research={item} />
                ))}
              </div>
            )}

            {archived.length > 0 ? (
              <section className="archived-section">
                <button
                  type="button"
                  className="archived-toggle"
                  onClick={() => setShowArchived((value) => !value)}
                  aria-expanded={showArchived}
                >
                  <Icon name={showArchived ? 'chevron-down' : 'chevron-right'} size={14} />
                  <span>Pesquisas arquivadas</span>
                  <Badge tone="neutral">{archived.length}</Badge>
                </button>
                {showArchived ? (
                  <div className="research-grid archived-grid">
                    {sortedArchived.map((item) => (
                      <ResearchCard key={item.id} research={item} />
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}
          </section>

          <aside className="dashboard-aside">
            <div className="panel">
              <SectionTitle>Atividade recente</SectionTitle>
              {activity === null ? (
                <p className="muted">Carregando…</p>
              ) : (
                <ActivityFeed items={activity} showResearch emptyText="As atividades das suas pesquisas aparecerão aqui." />
              )}
            </div>
            <div className="dashboard-note">
              <Icon name="lock" size={14} />
              <p>
                Documentos, notas e históricos permanecem neste computador. Nenhum dado é enviado
                automaticamente para serviços externos.
              </p>
            </div>
          </aside>
        </div>
      )}

      <CreateResearchModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(created) => {
          setCreateOpen(false);
          notify('Pesquisa criada.', 'success');
          navigate(`/research/${created.id}`);
        }}
      />
    </>
  );
}

function sortResearch(items: ResearchSummary[], sort: SortKey): ResearchSummary[] {
  const copy = [...items];
  switch (sort) {
    case 'title':
      return copy.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
    case 'created-desc':
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'created-asc':
      return copy.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case 'activity':
    default:
      return copy.sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
  }
}

function ResearchCard({ research }: { research: ResearchSummary }) {
  const pending = research.counts.pendingSources;
  return (
    <Link to={`/research/${research.id}`} className={`research-card ${research.status === 'archived' ? 'research-card-archived' : ''}`}>
      <div className="research-card-top">
        <h2>{research.title}</h2>
        <Icon name="arrow-right" size={16} className="research-card-arrow" />
      </div>
      {research.description ? (
        <p className="research-card-description">{research.description}</p>
      ) : (
        <p className="research-card-description muted">Sem descrição.</p>
      )}
      <div className="research-card-footer">
        <span>Atividade {formatRelative(research.lastActivityAt)}</span>
        <span className="research-card-stats">
          <span>{research.counts.documents} docs</span>
          <span>{research.counts.notes} notas</span>
          {pending > 0 ? <span className="stat-warning">{pending} pendentes</span> : null}
        </span>
      </div>
      {research.status === 'archived' ? (
        <div className="research-card-archived-badge">
          <Badge tone="neutral">Arquivada</Badge>
        </div>
      ) : null}
    </Link>
  );
}

interface CreateResearchModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (research: ResearchSummary) => void;
}

function CreateResearchModal({ open, onClose, onCreated }: CreateResearchModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [initialContext, setInitialContext] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setDescription('');
    setInitialContext('');
    setError(null);
    setBusy(false);
  }, [open]);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!title.trim()) {
      setError('Informe um título para a pesquisa.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await api.createResearch({ title, description, initialContext });
      onCreated(created);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Nova pesquisa"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => void submit()} loading={busy}>
            Criar pesquisa
          </Button>
        </>
      }
    >
      <form className="form-stack" onSubmit={submit}>
        <label className="field">
          <span className="field-label">Nome da pesquisa *</span>
          <input
            className="input"
            value={title}
            maxLength={200}
            placeholder="Ex.: Determinismo e livre-arbítrio"
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Descrição</span>
          <textarea
            className="textarea"
            rows={2}
            value={description}
            maxLength={2000}
            placeholder="O que você pretende investigar?"
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Instruções ou contexto inicial para a IA</span>
          <textarea
            className="textarea"
            rows={4}
            value={initialContext}
            maxLength={20000}
            placeholder="Opcional. Contexto, recortes ou orientações que devem acompanhar esta pesquisa."
            onChange={(event) => setInitialContext(event.target.value)}
          />
          <span className="field-hint">
            Este contexto orienta as respostas, mas não é usado como evidência documental.
          </span>
        </label>
        {error ? <div className="form-error">{error}</div> : null}
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}
