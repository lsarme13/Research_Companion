import { FormEvent, useEffect, useState } from 'react';
import type { Source } from '../../../shared/types';
import { api, errorMessage } from '../api';
import { DemoBadge } from './Badge';
import { Button } from './Button';
import { Icon } from './Icons';
import { Markdown } from './Markdown';
import { Modal } from './Modal';
import { useToast } from './Toast';

function splitTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

interface AddUrlDialogProps {
  open: boolean;
  researchId: string;
  onClose: () => void;
  onAdded: (source: Source) => void;
}

export function AddUrlDialog({ open, researchId, onClose, onAdded }: AddUrlDialogProps) {
  const { notify } = useToast();
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setUrl('');
    setCategory('');
    setTags('');
    setError(null);
    setBusy(false);
  }, [open]);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!url.trim()) {
      setError('Informe a URL da fonte.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const source = await api.addUrl(researchId, url.trim(), {
        category: category.trim() || undefined,
        tags: splitTags(tags),
      });
      notify(`Fonte “${source.title}” adicionada.`, 'success');
      onAdded(source);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Adicionar fonte por URL"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => void submit()} loading={busy}>
            Adicionar fonte
          </Button>
        </>
      }
    >
      <form className="form-stack" onSubmit={submit}>
        <label className="field">
          <span className="field-label">URL da fonte *</span>
          <input
            className="input"
            type="url"
            value={url}
            placeholder="https://exemplo.org/artigo"
            onChange={(event) => setUrl(event.target.value)}
          />
          <span className="field-hint">
            A fonte é acessada uma única vez para extrair o texto. Páginas que exigem autenticação ou
            conteúdo dinâmico podem não ser importadas.
          </span>
        </label>
        <div className="form-grid">
          <label className="field">
            <span className="field-label">Categoria</span>
            <input
              className="input"
              value={category}
              placeholder="Ex.: Filosofia"
              onChange={(event) => setCategory(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Etiquetas</span>
            <input
              className="input"
              value={tags}
              placeholder="separadas por vírgula"
              onChange={(event) => setTags(event.target.value)}
            />
          </label>
        </div>
        {error ? <div className="form-error">{error}</div> : null}
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}

interface SourceDialogProps {
  open: boolean;
  researchId: string;
  source: Source | null;
  onClose: () => void;
  onUpdated?: (source: Source) => void;
}

export function PreviewSourceDialog({ open, researchId, source, onClose }: SourceDialogProps) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !source) return;
    let cancelled = false;
    setText(null);
    setError(null);
    const load = async () => {
      try {
        if (source.status === 'approved') {
          const result = await api.getSourceText(researchId, source.id);
          if (!cancelled) setText(result.text);
        } else if (source.url) {
          const preview = await api.previewUrl(researchId, source.url);
          if (!cancelled) setText(preview.text);
        } else {
          throw new Error('Esta fonte não possui conteúdo para pré-visualizar.');
        }
      } catch (err) {
        if (!cancelled) setError(errorMessage(err));
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, researchId, source]);

  return (
    <Modal open={open} title="Pré-visualizar fonte" size="lg" onClose={onClose}>
      {source ? (
        <>
          <div className="source-preview-meta">
            <h3>{source.title}</h3>
            <p>
              {[source.authors, source.publication, source.domain, source.url]
                .filter(Boolean)
                .join(' · ') || source.originalFileName}
            </p>
            <div className="callout callout-info">
              <Icon name="info" size={16} />
              <p>
                O conteúdo é exibido como foi extraído. Encontrar uma fonte não valida sua
                credibilidade; avalie autoria, data, referências e relevância antes de aprovar.
              </p>
            </div>
          </div>
          <div className="preview-scroll">
            {error ? (
              <div className="form-error">{error}</div>
            ) : text === null ? (
              <p className="muted">Obtendo conteúdo…</p>
            ) : (
              <>
                {text
                  .slice(0, 60_000)
                  .split(/\n{2,}/)
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                {text.length > 60_000 ? (
                  <p className="muted">Prévia limitada aos primeiros 60.000 caracteres.</p>
                ) : null}
              </>
            )}
          </div>
        </>
      ) : null}
    </Modal>
  );
}

export function EditSourceDialog({
  open,
  researchId,
  source,
  onClose,
  onUpdated,
}: SourceDialogProps) {
  const { notify } = useToast();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !source) return;
    setTitle(source.title);
    setCategory(source.category || '');
    setTags(source.tags.join(', '));
    setError(null);
    setBusy(false);
  }, [open, source]);

  const save = async () => {
    if (!source) return;
    if (!title.trim()) {
      setError('O título não pode ficar vazio.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await api.updateSource(researchId, source.id, {
        title,
        category: category.trim(),
        tags: splitTags(tags),
      });
      notify('Fonte atualizada.', 'success');
      onUpdated?.(updated);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Editar fonte"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => void save()} loading={busy}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="form-stack">
        <label className="field">
          <span className="field-label">Título</span>
          <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <div className="form-grid">
          <label className="field">
            <span className="field-label">Categoria</span>
            <input
              className="input"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Ex.: História"
            />
          </label>
          <label className="field">
            <span className="field-label">Etiquetas</span>
            <input
              className="input"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="separadas por vírgula"
            />
          </label>
        </div>
        {error ? <div className="form-error">{error}</div> : null}
      </div>
    </Modal>
  );
}

export function EvaluateSourceDialog({ open, researchId, source, onClose }: SourceDialogProps) {
  const [answer, setAnswer] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [provider, setProvider] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !source) return;
    let cancelled = false;
    setAnswer(null);
    setError(null);
    api
      .evaluateSource(researchId, source.id)
      .then((result) => {
        if (cancelled) return;
        setAnswer(result.answer);
        setDemo(result.demo);
        setProvider(`${result.provider} · ${result.model}`);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [open, researchId, source]);

  return (
    <Modal open={open} title="Avaliação orientativa da fonte" size="lg" onClose={onClose}>
      <div className="source-preview-meta">
        <h3>{source?.title}</h3>
        <div className="inline-actions">
          {demo ? <DemoBadge /> : <span className="badge badge-accent">{provider}</span>}
        </div>
        <div className="callout callout-warning">
          <Icon name="alert" size={16} />
          <p>
            Esta avaliação é orientativa e não garante a confiabilidade da fonte. A decisão de aprovar
            ou rejeitar é exclusivamente sua.
          </p>
        </div>
      </div>
      <div className="preview-scroll">
        {error ? (
          <div className="form-error">{error}</div>
        ) : answer === null ? (
          <p className="muted">Analisando a fonte…</p>
        ) : (
          <Markdown>{answer}</Markdown>
        )}
      </div>
    </Modal>
  );
}
