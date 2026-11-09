import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Source } from '../../../shared/types';
import { api, errorMessage } from '../api';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState, PageHeader } from '../components/Layout';
import { ErrorBlock, LoadingBlock } from '../components/Feedback';
import { Icon } from '../components/Icons';
import { AddUrlDialog, PreviewSourceDialog } from '../components/SourceDialogs';
import { useToast } from '../components/Toast';
import { useResearch } from '../context/ResearchContext';
import { formatDate, sourceTypeLabel } from '../utils/format';

export function DocumentsPage() {
  const { research, refresh } = useResearch();
  const { notify } = useToast();
  const [documents, setDocuments] = useState<Source[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [addUrlOpen, setAddUrlOpen] = useState(false);
  const [preview, setPreview] = useState<Source | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setDocuments(await api.listSources(research.id, 'approved'));
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [research.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return documents || [];
    return (documents || []).filter((source) =>
      [source.title, source.authors, source.domain, source.category, ...source.tags]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [documents, search]);

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);
    setUploading(true);
    let added = 0;
    const failures: string[] = [];
    for (const file of list) {
      try {
        await api.addFile(research.id, file);
        added += 1;
      } catch (err) {
        failures.push(`${file.name}: ${errorMessage(err)}`);
      }
    }
    await load();
    await refresh();
    setUploading(false);
    if (added > 0) {
      notify(added === 1 ? 'Documento adicionado.' : `${added} documentos adicionados.`, 'success');
    }
    if (failures.length > 0) {
      notify(failures.join(' '), 'error');
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <>
      <PageHeader
        eyebrow="Materiais"
        title="Documentos"
        description="Arquivos e páginas aprovados que podem ser lidos e usados como evidência nesta pesquisa."
        actions={
          <>
            <Button
              variant="primary"
              icon="upload"
              loading={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? 'Adicionando…' : 'Adicionar arquivo'}
            </Button>
            <Button icon="globe" onClick={() => setAddUrlOpen(true)}>
              Adicionar URL
            </Button>
            <input
              ref={inputRef}
              type="file"
              hidden
              multiple
              accept=".pdf,.txt,.md,.docx"
              onChange={(event) => void uploadFiles(event.target.files)}
            />
          </>
        }
      />

      <div className="callout callout-info docs-hint">
        <Icon name="info" size={16} />
        <p>
          Formatos aceitos: PDF com texto selecionável, TXT, Markdown e DOCX. OCR de documentos
          digitalizados não é suportado nesta versão. Fontes encontradas por busca aguardam aprovação
          em <Link to={`/research/${research.id}/sources`}>Fontes</Link>.
        </p>
      </div>

      {research.counts.pendingSources > 0 ? (
        <div className="inline-notice">
          <Icon name="clock" size={15} />
          <span>
            {research.counts.pendingSources}{' '}
            {research.counts.pendingSources === 1 ? 'fonte aguarda' : 'fontes aguardam'} aprovação.
          </span>
          <Link to={`/research/${research.id}/sources`} className="text-link">
            Revisar fontes
          </Link>
        </div>
      ) : null}

      {error ? (
        <ErrorBlock message={error} onRetry={() => void load()} />
      ) : documents === null ? (
        <LoadingBlock label="Carregando documentos…" />
      ) : documents.length === 0 ? (
        <EmptyState
          icon="file"
          title="Nenhum documento aprovado"
          description="Adicione arquivos locais ou importe uma página da internet para começar a leitura."
          action={
            <div className="inline-actions">
              <Button variant="primary" icon="upload" loading={uploading} onClick={() => inputRef.current?.click()}>
                Adicionar arquivo
              </Button>
              <Button icon="globe" onClick={() => setAddUrlOpen(true)}>
                Adicionar URL
              </Button>
            </div>
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
                placeholder="Buscar por título, autor ou etiqueta"
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Buscar documentos"
              />
            </div>
            <span className="list-count">
              {filtered.length} de {documents.length}{' '}
              {documents.length === 1 ? 'documento' : 'documentos'}
            </span>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="search"
              title="Nenhum documento encontrado"
              description="Ajuste o termo de busca."
              compact
            />
          ) : (
            <div className="document-list">
              {filtered.map((source) => (
                <article className="document-row" key={source.id}>
                  <span className="document-type-icon">
                    <Icon name={source.kind === 'url' ? 'globe' : 'file'} size={18} />
                  </span>
                  <div className="document-main">
                    <div className="document-title-line">
                      <Link to={`/research/${research.id}/reader?source=${source.id}`} className="document-title">
                        {source.title}
                      </Link>
                      <Badge tone="neutral">{sourceTypeLabel(source)}</Badge>
                      {source.category ? <Badge tone="accent">{source.category}</Badge> : null}
                    </div>
                    <div className="document-meta">
                      {source.domain ? <span>{source.domain}</span> : null}
                      {source.authors ? <span>{source.authors}</span> : null}
                      <span>Adicionado em {formatDate(source.addedAt)}</span>
                      {source.tags.length ? <span>{source.tags.map((tag) => `#${tag}`).join(' ')}</span> : null}
                    </div>
                  </div>
                  <div className="document-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setPreview(source)}
                    >
                      Prévia
                    </button>
                    <Link
                      to={`/research/${research.id}/reader?source=${source.id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      <Icon name="reader" size={14} />
                      <span>Ler</span>
                    </Link>
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="icon-button"
                        aria-label="Abrir original"
                        title="Abrir original"
                      >
                        <Icon name="external" size={15} />
                      </a>
                    ) : (
                      <a
                        href={api.sourceDownloadUrl(research.id, source.id)}
                        className="icon-button"
                        aria-label="Baixar arquivo original"
                        title="Baixar arquivo original"
                      >
                        <Icon name="download" size={15} />
                      </a>
                    )}
                  </div>
                </article>
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
    </>
  );
}
