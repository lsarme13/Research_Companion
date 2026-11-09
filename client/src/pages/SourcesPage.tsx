import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { SearchResponse, Source, SourceStatus } from '../../../shared/types';
import { api, errorMessage } from '../api';
import { Badge, SourceStatusBadge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState, PageHeader } from '../components/Layout';
import { ErrorBlock, LoadingBlock } from '../components/Feedback';
import { Icon } from '../components/Icons';
import { ConfirmDialog } from '../components/Modal';
import {
  AddUrlDialog,
  EditSourceDialog,
  EvaluateSourceDialog,
  PreviewSourceDialog,
} from '../components/SourceDialogs';
import { useToast } from '../components/Toast';
import { useResearch } from '../context/ResearchContext';
import { formatDate, sourceTypeLabel } from '../utils/format';
import { truncate } from '../utils/text';

type Filter = 'all' | SourceStatus;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'approved', label: 'Aprovadas' },
  { id: 'rejected', label: 'Rejeitadas' },
];

export function SourcesPage() {
  const { research, refresh } = useResearch();
  const { notify } = useToast();

  const [sources, setSources] = useState<Source[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [localSearch, setLocalSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastSearch, setLastSearch] = useState<SearchResponse | null>(null);

  const [addUrlOpen, setAddUrlOpen] = useState(false);
  const [preview, setPreview] = useState<Source | null>(null);
  const [edit, setEdit] = useState<Source | null>(null);
  const [evaluate, setEvaluate] = useState<Source | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Source | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Source | null>(null);
  const [action, setAction] = useState<{ id: string; type: 'approve' | 'reject' | 'remove' } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setSources(await api.listSources(research.id));
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [research.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const base: Record<Filter, number> = { all: sources?.length || 0, pending: 0, approved: 0, rejected: 0 };
    for (const source of sources || []) base[source.status] += 1;
    return base;
  }, [sources]);

  const filtered = useMemo(() => {
    const term = localSearch.trim().toLowerCase();
    return (sources || []).filter((source) => {
      if (filter !== 'all' && source.status !== filter) return false;
      if (!term) return true;
      return [source.title, source.domain, source.authors, source.publication, source.category, ...source.tags]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [sources, filter, localSearch]);

  const runSearch = async (event?: FormEvent) => {
    event?.preventDefault();
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchError('Informe um tema ou pergunta com pelo menos 2 caracteres.');
      return;
    }
    setSearching(true);
    setSearchError(null);
    setLastSearch(null);
    try {
      const result = await api.searchSources(research.id, query);
      setLastSearch(result);
      await load();
      await refresh();
      if (result.added > 0) {
        setFilter('pending');
        notify(
          result.added === 1
            ? '1 fonte nova aguarda aprovação.'
            : `${result.added} fontes novas aguardam aprovação.`,
          'success',
        );
      } else {
        notify('Nenhuma fonte nova foi encontrada além das já existentes.', 'info');
      }
    } catch (err) {
      setSearchError(errorMessage(err));
    } finally {
      setSearching(false);
    }
  };

  const approve = async (source: Source) => {
    setAction({ id: source.id, type: 'approve' });
    try {
      await api.approveSource(research.id, source.id);
      notify(`Fonte “${source.title}” aprovada.`, 'success');
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setAction(null);
      await load();
      await refresh();
    }
  };

  const reject = async () => {
    if (!rejectTarget) return;
    setAction({ id: rejectTarget.id, type: 'reject' });
    try {
      await api.rejectSource(research.id, rejectTarget.id);
      notify('Fonte rejeitada. Ela não participará das análises.', 'success');
      setRejectTarget(null);
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setAction(null);
      await load();
      await refresh();
    }
  };

  const remove = async () => {
    if (!removeTarget) return;
    setAction({ id: removeTarget.id, type: 'remove' });
    try {
      await api.removeSource(research.id, removeTarget.id);
      notify('Fonte removida da pesquisa.', 'success');
      setRemoveTarget(null);
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setAction(null);
      await load();
      await refresh();
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Materiais"
        title="Fontes"
        description="Pesquise, avalie e decida quais fontes podem participar desta investigação. Apenas fontes aprovadas alimentam as análises da IA."
        actions={
          <Button icon="globe" onClick={() => setAddUrlOpen(true)}>
            Adicionar URL
          </Button>
        }
      />

      <section className="search-panel" aria-label="Buscar novas fontes">
        <div className="search-panel-head">
          <div>
            <h2>Buscar novas fontes na internet</h2>
            <p>A busca só é executada quando você solicitar. Nenhuma fonte é adicionada automaticamente.</p>
          </div>
        </div>
        <form className="search-panel-form" onSubmit={runSearch}>
          <div className="search-field search-field-lg">
            <Icon name="search" size={17} />
            <input
              className="search-input"
              value={searchQuery}
              placeholder="Ex.: determinismo filosófico e livre-arbítrio"
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Tema ou pergunta para buscar fontes"
            />
          </div>
          <Button type="submit" variant="primary" icon="search" loading={searching}>
            Pesquisar
          </Button>
        </form>
        <p className="field-hint">
          Os resultados entram como pendentes de aprovação. Encontrar uma fonte não valida sua
          credibilidade: verifique autoria, data, referências e relevância.
        </p>
        {searchError ? <div className="form-error">{searchError}</div> : null}
        {lastSearch ? <SearchSummary result={lastSearch} onDismiss={() => setLastSearch(null)} /> : null}
      </section>

      {error ? (
        <ErrorBlock message={error} onRetry={() => void load()} />
      ) : sources === null ? (
        <LoadingBlock label="Carregando fontes…" />
      ) : (
        <>
          <div className="collection-toolbar sources-toolbar">
            <div className="filter-tabs" role="tablist" aria-label="Filtrar fontes por estado">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === item.id}
                  className={`filter-tab ${filter === item.id ? 'filter-tab-active' : ''}`}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                  <span className="filter-count">{counts[item.id]}</span>
                </button>
              ))}
            </div>
            <div className="search-field search-field-sm">
              <Icon name="search" size={15} />
              <input
                className="search-input"
                value={localSearch}
                placeholder="Filtrar fontes"
                onChange={(event) => setLocalSearch(event.target.value)}
                aria-label="Filtrar fontes na lista"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={filter === 'pending' ? 'clock' : filter === 'rejected' ? 'x' : 'globe'}
              title={
                filter === 'pending'
                  ? 'Nenhuma fonte pendente'
                  : filter === 'approved'
                    ? 'Nenhuma fonte aprovada'
                    : filter === 'rejected'
                      ? 'Nenhuma fonte rejeitada'
                      : 'Nenhuma fonte encontrada'
              }
              description={
                filter === 'pending'
                  ? 'Use a busca acima ou aguarde resultados de uma próxima pesquisa.'
                  : filter === 'approved'
                    ? 'Aprove fontes pendentes ou adicione documentos e URLs para começar.'
                    : 'Ajuste o filtro ou o termo de busca.'
              }
              compact
            />
          ) : (
            <div className="source-list">
              {filtered.map((source) => (
                <SourceRow
                  key={source.id}
                  source={source}
                  researchId={research.id}
                  action={action}
                  onApprove={() => void approve(source)}
                  onReject={() => setRejectTarget(source)}
                  onRemove={() => setRemoveTarget(source)}
                  onPreview={() => setPreview(source)}
                  onEdit={() => setEdit(source)}
                  onEvaluate={() => setEvaluate(source)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <AddUrlDialog
        open={addUrlOpen}
        researchId={research.id}
        onClose={() => setAddUrlOpen(false)}
        onAdded={() => {
          void load();
          void refresh();
        }}
      />

      <PreviewSourceDialog
        open={preview !== null}
        researchId={research.id}
        source={preview}
        onClose={() => setPreview(null)}
      />

      <EditSourceDialog
        open={edit !== null}
        researchId={research.id}
        source={edit}
        onClose={() => setEdit(null)}
        onUpdated={() => {
          void load();
          void refresh();
        }}
      />

      <EvaluateSourceDialog
        open={evaluate !== null}
        researchId={research.id}
        source={evaluate}
        onClose={() => setEvaluate(null)}
      />

      <ConfirmDialog
        open={rejectTarget !== null}
        title="Rejeitar fonte"
        message={
          <p>
            A fonte <strong>“{rejectTarget?.title}”</strong> não será usada nas análises desta pesquisa.
            Ela continuará registrada como rejeitada no histórico de fontes.
          </p>
        }
        confirmLabel="Rejeitar"
        loading={action?.type === 'reject'}
        onConfirm={() => void reject()}
        onClose={() => setRejectTarget(null)}
      />

      <ConfirmDialog
        open={removeTarget !== null}
        title="Remover fonte"
        message={
          <p>
            A fonte <strong>“{removeTarget?.title}”</strong> será removida da pesquisa, junto com seu texto
            extraído. As notas já criadas preservam o trecho citado, mas não poderão mais abrir o
            documento original.
          </p>
        }
        confirmLabel="Remover fonte"
        danger
        loading={action?.type === 'remove'}
        onConfirm={() => void remove()}
        onClose={() => setRemoveTarget(null)}
      />
    </>
  );
}

function SearchSummary({ result, onDismiss }: { result: SearchResponse; onDismiss: () => void }) {
  if (!result.added && !result.duplicates.length) {
    return (
      <div className="callout callout-info search-summary">
        <Icon name="info" size={16} />
        <p>Nenhum resultado utilizável foi encontrado para esta busca.</p>
        <button type="button" className="icon-button" onClick={onDismiss} aria-label="Dispensar">
          <Icon name="close" size={14} />
        </button>
      </div>
    );
  }
  return (
    <div className="callout callout-info search-summary">
      <Icon name="info" size={16} />
      <div>
        <p>
          {result.added > 0
            ? `${result.added} ${result.added === 1 ? 'fonte nova foi adicionada como pendente' : 'fontes novas foram adicionadas como pendentes'}.`
            : 'Nenhuma fonte nova foi adicionada.'}
        </p>
        {result.duplicates.length > 0 ? (
          <div className="duplicate-list">
            <strong>
              {result.duplicates.length}{' '}
              {result.duplicates.length === 1 ? 'resultado já estava' : 'resultados já estavam'} nesta pesquisa:
            </strong>
            <ul>
              {result.duplicates.map((duplicate) => (
                <li key={duplicate.url}>
                  {duplicate.title} — já registrada como “{duplicate.existingTitle}”
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <button type="button" className="icon-button" onClick={onDismiss} aria-label="Dispensar resumo da busca">
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}

interface SourceRowProps {
  source: Source;
  researchId: string;
  action: { id: string; type: 'approve' | 'reject' | 'remove' } | null;
  onApprove: () => void;
  onReject: () => void;
  onRemove: () => void;
  onPreview: () => void;
  onEdit: () => void;
  onEvaluate: () => void;
}

function SourceRow({
  source,
  researchId,
  action,
  onApprove,
  onReject,
  onRemove,
  onPreview,
  onEdit,
  onEvaluate,
}: SourceRowProps) {
  const busy = action?.id === source.id;
  return (
    <article className={`source-row source-row-${source.status}`}>
      <div className="source-row-top">
        <span className="source-icon">
          <Icon name={source.kind === 'url' ? 'globe' : 'file'} size={17} />
        </span>
        <div className="source-main">
          <div className="source-title-line">
            <h3>{source.title}</h3>
            <SourceStatusBadge status={source.status} />
            <Badge tone="neutral">{sourceTypeLabel(source)}</Badge>
            {source.category ? <Badge tone="accent">{source.category}</Badge> : null}
            {source.duplicateOfTitle ? (
              <Badge tone="warning">Possível duplicata</Badge>
            ) : null}
          </div>
          <div className="source-meta">
            {source.domain ? <span>{source.domain}</span> : null}
            {source.originalFileName ? <span>{source.originalFileName}</span> : null}
            {source.authors ? <span>{source.authors}</span> : null}
            {source.publication ? <span>{source.publication}</span> : null}
            {source.publishedAt ? <span>Publicado em {formatDate(source.publishedAt)}</span> : null}
            <span>Adicionada em {formatDate(source.addedAt)}</span>
            {source.tags.length ? <span>{source.tags.map((tag) => `#${tag}`).join(' ')}</span> : null}
          </div>
          {source.excerpt ? <p className="source-excerpt">{truncate(source.excerpt, 360)}</p> : null}
          {source.duplicateOfTitle ? (
            <p className="source-warning">
              <Icon name="alert" size={14} /> Semelhante à fonte já registrada “{source.duplicateOfTitle}”.
            </p>
          ) : null}
          {source.lastError ? (
            <div className="source-error">
              <Icon name="alert" size={14} />
              <span>{source.lastError}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="source-actions">
        {source.url ? (
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer noopener"
            className="btn btn-ghost btn-sm"
          >
            <Icon name="external" size={14} />
            <span>Abrir original</span>
          </a>
        ) : null}
        <Button variant="ghost" size="sm" onClick={onPreview}>
          Pré-visualizar
        </Button>

        {source.status === 'pending' ? (
          <>
            <Button variant="ghost" size="sm" onClick={onReject} disabled={busy}>
              Rejeitar
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="check"
              onClick={onApprove}
              loading={busy && action?.type === 'approve'}
              disabled={busy && action?.type !== 'approve'}
            >
              Aprovar
            </Button>
          </>
        ) : null}

        {source.status === 'approved' ? (
          <>
            <Button variant="ghost" size="sm" icon="edit" onClick={onEdit}>
              Editar
            </Button>
            <Button variant="ghost" size="sm" icon="sparkles" onClick={onEvaluate}>
              Avaliar com IA
            </Button>
            <Button variant="ghost" size="sm" icon="trash" onClick={onRemove} disabled={busy}>
              Remover
            </Button>
            <Link
              to={`/research/${researchId}/reader?source=${source.id}`}
              className="btn btn-secondary btn-sm"
            >
              <Icon name="reader" size={14} />
              <span>Ler</span>
            </Link>
          </>
        ) : null}

        {source.status === 'rejected' ? (
          <>
            <Button variant="ghost" size="sm" icon="edit" onClick={onEdit}>
              Editar
            </Button>
            <Button variant="ghost" size="sm" icon="trash" onClick={onRemove} disabled={busy}>
              Remover
            </Button>
          </>
        ) : null}
      </div>
    </article>
  );
}
