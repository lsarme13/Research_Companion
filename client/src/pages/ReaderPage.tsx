import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type {
  AiAnswer,
  ReadingAction,
  ReadingDepth,
  Source,
} from '../../../shared/types';
import { api, errorMessage } from '../api';
import { AiAnswerView } from '../components/AiAnswerView';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState, PageHeader } from '../components/Layout';
import { ErrorBlock, LoadingBlock } from '../components/Feedback';
import { Icon, IconName } from '../components/Icons';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { useResearch } from '../context/ResearchContext';
import { useSettings } from '../context/SettingsContext';
import { formatDate, sourceTypeLabel } from '../utils/format';
import { splitParagraphs, truncate } from '../utils/text';

const PARAGRAPH_PAGE = 120;

interface SelectionState {
  text: string;
  top: number;
  left: number;
}

interface SelectionAction {
  action: ReadingAction;
  label: string;
  icon: IconName;
}

const SELECTION_ACTIONS: SelectionAction[] = [
  { action: 'explain', label: 'Explicar', icon: 'reader' },
  { action: 'simplify', label: 'Simplificar', icon: 'edit' },
  { action: 'arguments', label: 'Argumentos', icon: 'quote' },
  { action: 'assumptions', label: 'Pressupostos', icon: 'alert' },
  { action: 'questions', label: 'Perguntas', icon: 'info' },
];

const ANALYSIS_ACTIONS: SelectionAction[] = [
  ...SELECTION_ACTIONS,
];

export function ReaderPage() {
  const { research, refresh } = useResearch();
  const { settings } = useSettings();
  const { notify } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [sources, setSources] = useState<Source[] | null>(null);
  const [sourcesError, setSourcesError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [textError, setTextError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PARAGRAPH_PAGE);
  const [selection, setSelection] = useState<SelectionState | null>(null);

  const [aiTab, setAiTab] = useState<'ask' | 'analyze'>('ask');
  const [askQuestion, setAskQuestion] = useState('');
  const [askScope, setAskScope] = useState<'document' | 'library'>('document');
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [askResult, setAskResult] = useState<AiAnswer | null>(null);

  const [analysisAction, setAnalysisAction] = useState<ReadingAction>('explain');
  const [analysisDepth, setAnalysisDepth] = useState<ReadingDepth>('intermediario');
  const [analysisSelection, setAnalysisSelection] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AiAnswer | null>(null);

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteSaving, setNoteSaving] = useState(false);

  const articleRef = useRef<HTMLElement>(null);
  const scrollTimer = useRef<number | null>(null);

  const selectedSource = useMemo(
    () => sources?.find((source) => source.id === selectedId) || null,
    [sources, selectedId],
  );
  const previewTop = research.lastSourceId;
  const isDemo = settings?.ai.provider === 'demo';

  const loadSources = useCallback(async () => {
    setSourcesError(null);
    try {
      const all = await api.listSources(research.id, 'approved');
      const available = all.filter((source) => source.hasText);
      setSources(available);
      setSelectedId((current) => {
        if (current && available.some((source) => source.id === current)) return current;
        const param = searchParams.get('source');
        const fromParam = available.find((source) => source.id === param);
        if (fromParam) return fromParam.id;
        const last = available.find((source) => source.id === previewTop);
        return last?.id || available[0]?.id || null;
      });
    } catch (err) {
      setSourcesError(errorMessage(err));
    }
  }, [research.id, searchParams, previewTop]);

  useEffect(() => {
    void loadSources();
    // A seleção inicial só precisa ser recalculada quando a pesquisa muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [research.id]);

  useEffect(() => {
    if (!selectedId) {
      setText(null);
      return;
    }
    let cancelled = false;
    setText(null);
    setTextError(null);
    setVisibleCount(PARAGRAPH_PAGE);
    api
      .getSourceText(research.id, selectedId)
      .then((result) => {
        if (!cancelled) setText(result.text);
      })
      .catch((err) => {
        if (!cancelled) setTextError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [research.id, selectedId]);

  const paragraphs = useMemo(() => (text ? splitParagraphs(text) : []), [text]);
  const visibleParagraphs = paragraphs.slice(0, visibleCount);
  const scrollKey = selectedId ? `rc:scroll:${research.id}:${selectedId}` : null;

  useEffect(() => {
    if (!scrollKey || text === null) return;
    const saved = Number(localStorage.getItem(scrollKey) || 0);
    if (saved > 0) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: saved, behavior: 'auto' });
      });
    }
    const onScroll = () => {
      setSelection(null);
      if (scrollTimer.current) window.clearTimeout(scrollTimer.current);
      scrollTimer.current = window.setTimeout(() => {
        try {
          localStorage.setItem(scrollKey, String(window.scrollY));
        } catch {
          // A posição é apenas uma conveniência.
        }
      }, 250);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollTimer.current) window.clearTimeout(scrollTimer.current);
    };
  }, [scrollKey, text]);

  const selectSource = (source: Source) => {
    if (source.id === selectedId) return;
    setSelectedId(source.id);
    setSearchParams({ source: source.id }, { replace: true });
    setSelection(null);
    setAskResult(null);
    setAskError(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setAnalysisSelection('');
    api.updateResearch(research.id, { lastSourceId: source.id }).catch(() => {
      // Falha ao registrar a continuidade não impede a leitura.
    });
  };

  const captureSelection = () => {
    const selectionObject = window.getSelection();
    if (!selectionObject || selectionObject.isCollapsed || selectionObject.rangeCount === 0) {
      return;
    }
    const range = selectionObject.getRangeAt(0);
    if (!articleRef.current?.contains(range.commonAncestorContainer)) return;
    const selectedText = selectionObject.toString().trim();
    if (!selectedText) return;
    const rect = range.getBoundingClientRect();
    setSelection({
      text: selectedText,
      top: Math.max(74, rect.top - 48),
      left: Math.min(Math.max(rect.left + rect.width / 2, 190), window.innerWidth - 190),
    });
  };

  const runAnalysis = async (
    action: ReadingAction,
    selectedText: string,
    depth: ReadingDepth = analysisDepth,
  ) => {
    if (!selectedId) return;
    setAiTab('analyze');
    setAnalysisAction(action);
    setAnalysisSelection(selectedText);
    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    try {
      const result = await api.analyzeReading(research.id, {
        sourceId: selectedId,
        action,
        selection: selectedText.trim() ? selectedText : undefined,
        depth: action === 'explain' ? depth : undefined,
      });
      setAnalysisResult(result);
      await refresh();
    } catch (err) {
      setAnalysisError(errorMessage(err));
    } finally {
      setAnalysisLoading(false);
    }
  };

  const ask = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!askQuestion.trim()) {
      setAskError('Escreva uma pergunta sobre o material.');
      return;
    }
    setAskLoading(true);
    setAskError(null);
    setAskResult(null);
    try {
      const result = await api.ask(
        research.id,
        askQuestion,
        askScope === 'document' && selectedId ? [selectedId] : undefined,
      );
      setAskResult(result);
      await refresh();
    } catch (err) {
      setAskError(errorMessage(err));
    } finally {
      setAskLoading(false);
    }
  };

  const openNote = () => {
    setNoteTitle('');
    setNoteContent('');
    setNoteError(null);
    setNoteOpen(true);
  };

  const saveNote = async () => {
    if (!noteContent.trim()) {
      setNoteError('Escreva o conteúdo da nota.');
      return;
    }
    setNoteSaving(true);
    setNoteError(null);
    try {
      await api.createNote(research.id, {
        title: noteTitle.trim() || undefined,
        content: noteContent,
        sourceId: selectedId || undefined,
        quote: selection?.text,
      });
      await refresh();
      setNoteOpen(false);
      notify('Nota criada a partir do trecho selecionado.', 'success');
    } catch (err) {
      setNoteError(errorMessage(err));
    } finally {
      setNoteSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Investigação"
        title="Leitor Inteligente"
        description="Leia os documentos aprovados, selecione trechos e peça explicações fundamentadas no contexto desta pesquisa."
        actions={
          <Link to={`/research/${research.id}/documents`} className="btn btn-secondary btn-md">
            <Icon name="file" size={15} />
            <span>Gerenciar documentos</span>
          </Link>
        }
      />

      {sourcesError ? (
        <ErrorBlock message={sourcesError} onRetry={() => void loadSources()} />
      ) : sources === null ? (
        <LoadingBlock label="Carregando documentos…" />
      ) : sources.length === 0 ? (
        <EmptyState
          icon="reader"
          title="Nenhum documento disponível para leitura"
          description="Adicione e aprove fontes para abrir o leitor e solicitar análises à IA."
          action={
            <Link to={`/research/${research.id}/documents`} className="btn btn-primary btn-md">
              Adicionar documentos
            </Link>
          }
        />
      ) : (
        <div className="reader-layout">
          <aside className="reader-sources" aria-label="Documentos disponíveis">
            <div className="reader-sources-head">
              <span>Documentos</span>
              <span className="list-count">{sources.length}</span>
            </div>
            <div className="reader-source-list">
              {sources.map((source) => (
                <button
                  key={source.id}
                  type="button"
                  className={`reader-source-item ${source.id === selectedId ? 'reader-source-active' : ''}`}
                  onClick={() => selectSource(source)}
                >
                  <Icon name={source.kind === 'url' ? 'globe' : 'file'} size={15} />
                  <span className="reader-source-title">{source.title}</span>
                </button>
              ))}
            </div>
            <Link to={`/research/${research.id}/documents`} className="reader-add-link">
              <Icon name="plus" size={14} />
              Adicionar documentos
            </Link>
          </aside>

          <section className="reader-document" aria-label="Documento em leitura">
            {textError ? (
              <ErrorBlock message={textError} />
            ) : text === null ? (
              <LoadingBlock label="Abrindo documento…" />
            ) : selectedSource ? (
              <>
                <header className="reader-document-head">
                  <div>
                    <div className="document-meta">
                      <Badge tone="neutral">{sourceTypeLabel(selectedSource)}</Badge>
                      {selectedSource.category ? <Badge tone="accent">{selectedSource.category}</Badge> : null}
                      {selectedSource.domain ? <span>{selectedSource.domain}</span> : null}
                      {selectedSource.authors ? <span>{selectedSource.authors}</span> : null}
                      {selectedSource.publishedAt ? (
                        <span>Publicado em {formatDate(selectedSource.publishedAt)}</span>
                      ) : null}
                    </div>
                    <h2>{selectedSource.title}</h2>
                    {selectedSource.tags.length ? (
                      <div className="reader-tags">
                        {selectedSource.tags.map((tag) => (
                          <Badge key={tag} tone="neutral">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="reader-document-actions">
                    {selectedSource.url ? (
                      <a
                        href={selectedSource.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="icon-button"
                        aria-label="Abrir original"
                        title="Abrir original"
                      >
                        <Icon name="external" size={16} />
                      </a>
                    ) : (
                      <a
                        href={api.sourceDownloadUrl(research.id, selectedSource.id)}
                        className="icon-button"
                        aria-label="Baixar arquivo original"
                        title="Baixar arquivo original"
                      >
                        <Icon name="download" size={16} />
                      </a>
                    )}
                  </div>
                </header>

                <p className="reader-hint">
                  Selecione um trecho com o mouse para explicar, simplificar ou anotar.
                </p>

                <article
                  className="reader-text"
                  ref={articleRef}
                  onMouseUp={captureSelection}
                  onKeyUp={captureSelection}
                >
                  {visibleParagraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </article>

                {visibleCount < paragraphs.length ? (
                  <div className="reader-more">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setVisibleCount((count) => count + PARAGRAPH_PAGE)}
                    >
                      Mostrar mais ({paragraphs.length - visibleCount} parágrafos restantes)
                    </Button>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="muted">Selecione um documento para começar.</p>
            )}

            {selection ? (
              <div
                className="selection-toolbar"
                style={{ top: selection.top, left: selection.left }}
                onMouseDown={(event) => event.preventDefault()}
              >
                {SELECTION_ACTIONS.map((item) => (
                  <button
                    key={item.action}
                    type="button"
                    className="selection-action"
                    onClick={() => void runAnalysis(item.action, selection.text)}
                  >
                    <Icon name={item.icon} size={13} />
                    <span>{item.label}</span>
                  </button>
                ))}
                <span className="selection-divider" />
                <button type="button" className="selection-action" onClick={openNote}>
                  <Icon name="notes" size={13} />
                  <span>Anotar</span>
                </button>
              </div>
            ) : null}
          </section>

          <aside className="reader-ai" aria-label="Assistência de IA">
            <div className="ai-tabs" role="tablist" aria-label="Modo de assistência">
              <button
                type="button"
                role="tab"
                aria-selected={aiTab === 'ask'}
                className={`ai-tab ${aiTab === 'ask' ? 'ai-tab-active' : ''}`}
                onClick={() => setAiTab('ask')}
              >
                <Icon name="sparkles" size={14} />
                Perguntar
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={aiTab === 'analyze'}
                className={`ai-tab ${aiTab === 'analyze' ? 'ai-tab-active' : ''}`}
                onClick={() => setAiTab('analyze')}
              >
                <Icon name="reader" size={14} />
                Analisar
              </button>
            </div>

            {isDemo ? (
              <div className="ai-mode-note">
                <Icon name="info" size={13} />
                <span>Modo demonstração ativo. As respostas serão simuladas e identificadas.</span>
              </div>
            ) : null}

            {aiTab === 'ask' ? (
              <div className="ai-panel">
                <label className="field">
                  <span className="field-label">Escopo da pergunta</span>
                  <select
                    className="select select-sm"
                    value={askScope}
                    onChange={(event) => setAskScope(event.target.value as 'document' | 'library')}
                  >
                    <option value="document">Somente o documento atual</option>
                    <option value="library">Todas as fontes aprovadas da pesquisa</option>
                  </select>
                </label>
                <form className="ai-ask-form" onSubmit={ask}>
                  <textarea
                    className="textarea"
                    rows={3}
                    value={askQuestion}
                    placeholder="Pergunte algo sobre o material…"
                    onChange={(event) => setAskQuestion(event.target.value)}
                  />
                  <Button type="submit" variant="primary" icon="sparkles" loading={askLoading} disabled={!selectedId}>
                    Perguntar à IA
                  </Button>
                </form>
                <p className="field-hint">
                  As respostas usam apenas fontes aprovadas. As referências são exibidas abaixo.
                </p>
                {askError ? (
                  <div className="form-error">
                    {askError}{' '}
                    <Link to="/settings" className="text-link">
                      Abrir configurações
                    </Link>
                  </div>
                ) : null}
                {askResult ? (
                  <AiAnswerView result={askResult} researchId={research.id} label="Resposta fundamentada" />
                ) : null}
              </div>
            ) : (
              <div className="ai-panel">
                <div className="analysis-scope">
                  <div className="field-label">Análise do texto</div>
                  <div className="analysis-actions">
                    {ANALYSIS_ACTIONS.map((item) => (
                      <button
                        key={item.action}
                        type="button"
                        className={`analysis-action ${analysisAction === item.action ? 'analysis-action-active' : ''}`}
                        onClick={() => void runAnalysis(item.action, analysisSelection)}
                      >
                        <Icon name={item.icon} size={14} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                  {analysisAction === 'explain' ? (
                    <label className="field">
                      <span className="field-label">Nível da explicação</span>
                      <select
                        className="select select-sm"
                        value={analysisDepth}
                        onChange={(event) => setAnalysisDepth(event.target.value as ReadingDepth)}
                      >
                        <option value="simples">Simples</option>
                        <option value="intermediario">Intermediário</option>
                        <option value="avancado">Avançado</option>
                      </select>
                    </label>
                  ) : null}
                  <div className="analysis-selection">
                    {analysisSelection ? (
                      <>
                        <span>
                          Trecho selecionado: {analysisSelection.length.toLocaleString('pt-BR')} caracteres
                        </span>
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => setAnalysisSelection('')}
                        >
                          Limpar
                        </button>
                      </>
                    ) : (
                      <span className="muted">Nenhum trecho selecionado — será usado o início do documento.</span>
                    )}
                  </div>
                  {analysisSelection ? (
                    <blockquote className="analysis-quote">{truncate(analysisSelection, 260)}</blockquote>
                  ) : null}
                  <Button
                    variant="primary"
                    icon="sparkles"
                    loading={analysisLoading}
                    disabled={!selectedId}
                    onClick={() => void runAnalysis(analysisAction, analysisSelection)}
                  >
                    {analysisSelection ? 'Analisar seleção' : 'Analisar início do documento'}
                  </Button>
                </div>
                {analysisError ? (
                  <div className="form-error">
                    {analysisError}{' '}
                    <Link to="/settings" className="text-link">
                      Abrir configurações
                    </Link>
                  </div>
                ) : null}
                {analysisResult ? (
                  <AiAnswerView result={analysisResult} researchId={research.id} label="Análise do trecho" />
                ) : null}
              </div>
            )}
          </aside>
        </div>
      )}

      <Modal
        open={noteOpen}
        title="Nova nota a partir do trecho"
        onClose={() => setNoteOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setNoteOpen(false)} disabled={noteSaving}>
              Cancelar
            </Button>
            <Button variant="primary" icon="notes" onClick={() => void saveNote()} loading={noteSaving}>
              Salvar nota
            </Button>
          </>
        }
      >
        <div className="form-stack">
          {selection ? (
            <blockquote className="note-quote">{truncate(selection.text, 700)}</blockquote>
          ) : null}
          <label className="field">
            <span className="field-label">Título</span>
            <input
              className="input"
              value={noteTitle}
              placeholder="Opcional — será derivado do conteúdo"
              onChange={(event) => setNoteTitle(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Sua anotação</span>
            <textarea
              className="textarea"
              rows={6}
              value={noteContent}
              placeholder="Registre sua interpretação, dúvida ou relação com outros materiais."
              onChange={(event) => setNoteContent(event.target.value)}
            />
          </label>
          {noteError ? <div className="form-error">{noteError}</div> : null}
        </div>
      </Modal>
    </>
  );
}
