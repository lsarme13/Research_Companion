import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LibraryDocument } from '../../../shared/types';
import { api, errorMessage } from '../api';
import { EmptyState, PageHeader } from '../components/Layout';
import { ErrorBlock, LoadingBlock } from '../components/Feedback';
import { Icon } from '../components/Icons';
import { Badge } from '../components/Badge';
import { formatDate, sourceTypeLabel } from '../utils/format';

export function Library() {
  const [documents, setDocuments] = useState<LibraryDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [researchFilter, setResearchFilter] = useState('all');

  const load = useCallback(async () => {
    setError(null);
    try {
      setDocuments(await api.getLibraryDocuments());
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const researchOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of documents || []) map.set(item.researchId, item.researchTitle);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));
  }, [documents]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (documents || []).filter((item) => {
      if (researchFilter !== 'all' && item.researchId !== researchFilter) return false;
      if (!term) return true;
      const haystack = [
        item.source.title,
        item.researchTitle,
        item.source.authors,
        item.source.domain,
        item.source.category,
        ...item.source.tags,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [documents, search, researchFilter]);

  return (
    <>
      <PageHeader
        eyebrow="Acervo"
        title="Biblioteca de documentos"
        description="Todos os documentos aprovados nas suas pesquisas, em um único lugar."
      />

      {error ? (
        <ErrorBlock message={error} onRetry={() => void load()} />
      ) : documents === null ? (
        <LoadingBlock label="Carregando biblioteca…" />
      ) : documents.length === 0 ? (
        <EmptyState
          icon="library"
          title="Biblioteca vazia"
          description="Adicione documentos e fontes a uma pesquisa para que eles apareçam aqui."
          action={
            <Link to="/" className="btn btn-primary btn-md">
              Ir para as pesquisas
            </Link>
          }
        />
      ) : (
        <>
          <div className="collection-toolbar">
            <div className="search-field">
              <Icon name="search" size={16} />
              <input
                className="search-input"
                value={search}
                placeholder="Buscar por título, autor, pesquisa ou etiqueta"
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Buscar na biblioteca"
              />
            </div>
            <select
              className="select select-sm"
              value={researchFilter}
              onChange={(event) => setResearchFilter(event.target.value)}
              aria-label="Filtrar por pesquisa"
            >
              <option value="all">Todas as pesquisas</option>
              {researchOptions.map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>
            <span className="list-count">
              {filtered.length} {filtered.length === 1 ? 'documento' : 'documentos'}
            </span>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="search"
              title="Nenhum documento encontrado"
              description="Ajuste a busca ou o filtro de pesquisa."
              compact
            />
          ) : (
            <div className="collection-list">
              {filtered.map((item) => (
                <Link
                  key={`${item.researchId}-${item.source.id}`}
                  to={`/research/${item.researchId}/reader?source=${item.source.id}`}
                  className="collection-row"
                >
                  <span className="collection-icon">
                    <Icon name={item.source.kind === 'url' ? 'globe' : 'file'} size={18} />
                  </span>
                  <div className="collection-main">
                    <div className="collection-title">{item.source.title}</div>
                    <div className="collection-meta">
                      <span>{item.researchTitle}</span>
                      <span>{sourceTypeLabel(item.source)}</span>
                      {item.source.domain ? <span>{item.source.domain}</span> : null}
                      {item.source.authors ? <span>{item.source.authors}</span> : null}
                      <span>Adicionado em {formatDate(item.source.addedAt)}</span>
                    </div>
                  </div>
                  <div className="collection-tags">
                    {item.source.category ? <Badge tone="accent">{item.source.category}</Badge> : null}
                    {item.source.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} tone="neutral">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Icon name="arrow-right" size={16} className="collection-arrow" />
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
