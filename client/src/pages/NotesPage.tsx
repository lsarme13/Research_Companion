import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Note } from '../../../shared/types';
import { api, errorMessage } from '../api';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState, PageHeader } from '../components/Layout';
import { ErrorBlock, LoadingBlock } from '../components/Feedback';
import { Icon } from '../components/Icons';
import { ConfirmDialog, Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { useResearch } from '../context/ResearchContext';
import { formatDateTime } from '../utils/format';
import { truncate } from '../utils/text';

export function NotesPage() {
  const { research, refresh } = useResearch();
  const { notify } = useToast();

  const [notes, setNotes] = useState<Note[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setNotes(await api.listNotes(research.id));
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [research.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return notes || [];
    return (notes || []).filter((note) =>
      [note.title, note.content, note.quote, note.sourceTitle]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [notes, search]);

  const linkedCount = useMemo(
    () => (notes || []).filter((note) => note.sourceId).length,
    [notes],
  );

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setContent('');
    setFormError(null);
    setEditorOpen(true);
  };

  const openEdit = (note: Note) => {
    setEditing(note);
    setTitle(note.title);
    setContent(note.content);
    setFormError(null);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving) return;
    setEditorOpen(false);
  };

  const save = async () => {
    if (!title.trim() && !content.trim()) {
      setFormError('Escreva ao menos um título ou o conteúdo da nota.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await api.updateNote(research.id, editing.id, { title, content });
        notify('Nota atualizada.', 'success');
      } else {
        await api.createNote(research.id, { title: title.trim() || undefined, content });
        notify('Nota criada.', 'success');
      }
      setEditorOpen(false);
      await load();
      await refresh();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteNote(research.id, deleteTarget.id);
      notify('Nota excluída.', 'success');
      setDeleteTarget(null);
      await load();
      await refresh();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Investigação"
        title="Notas"
        description="Registre interpretações, dúvidas e relações entre materiais. As notas pertencem apenas a esta pesquisa."
        actions={
          <Button variant="primary" icon="plus" onClick={openCreate}>
            Nova nota
          </Button>
        }
      />

      {error ? (
        <ErrorBlock message={error} onRetry={() => void load()} />
      ) : notes === null ? (
        <LoadingBlock label="Carregando notas…" />
      ) : notes.length === 0 ? (
        <EmptyState
          icon="notes"
          title="Nenhuma nota registrada"
          description="Crie uma nota independente ou selecione um trecho no leitor para anotar com vínculo à fonte."
          action={
            <div className="inline-actions">
              <Button variant="primary" icon="plus" onClick={openCreate}>
                Criar primeira nota
              </Button>
              <Link to={`/research/${research.id}/reader`} className="btn btn-secondary btn-md">
                <Icon name="reader" size={15} />
                <span>Abrir leitor</span>
              </Link>
            </div>
          }
        />
      ) : (
        <>
          <div className="collection-toolbar notes-toolbar">
            <div className="search-field">
              <Icon name="search" size={16} />
              <input
                className="search-input"
                value={search}
                placeholder="Buscar por título, conteúdo ou fonte"
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Buscar notas"
              />
            </div>
            <div className="notes-summary">
              <span className="list-count">
                {filtered.length} de {notes.length} {notes.length === 1 ? 'nota' : 'notas'}
              </span>
              <Badge tone="neutral">
                {linkedCount} {linkedCount === 1 ? 'vinculada a fonte' : 'vinculadas a fontes'}
              </Badge>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="search"
              title="Nenhuma nota encontrada"
              description="Ajuste o termo de busca."
              compact
            />
          ) : (
            <div className="notes-grid">
              {filtered.map((note) => (
                <article className="note-card" key={note.id}>
                  <header className="note-card-head">
                    <div>
                      <h2 className="note-card-title">{note.title}</h2>
                      <span className="note-card-date">
                        <Icon name="clock" size={13} />
                        Atualizada em {formatDateTime(note.updatedAt)}
                      </span>
                    </div>
                    <div className="note-card-actions">
                      <button
                        type="button"
                        className="icon-button"
                        title="Editar nota"
                        aria-label={`Editar nota ${note.title}`}
                        onClick={() => openEdit(note)}
                      >
                        <Icon name="edit" size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button-danger"
                        title="Excluir nota"
                        aria-label={`Excluir nota ${note.title}`}
                        onClick={() => setDeleteTarget(note)}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </header>

                  {note.content ? (
                    <p className="note-card-content">{truncate(note.content, 420)}</p>
                  ) : (
                    <p className="note-card-content muted">Nota sem conteúdo escrito.</p>
                  )}

                  {note.quote ? (
                    <blockquote className="note-card-quote">
                      <Icon name="quote" size={13} />
                      <span>{truncate(note.quote, 260)}</span>
                    </blockquote>
                  ) : null}

                  {note.sourceId && note.sourceTitle ? (
                    <Link
                      to={`/research/${research.id}/reader?source=${note.sourceId}`}
                      className="note-card-source"
                    >
                      <Icon name="link" size={14} />
                      <span>{note.sourceTitle}</span>
                      <Icon name="arrow-right" size={14} />
                    </Link>
                  ) : (
                    <span className="note-card-source note-card-source-empty">
                      <Icon name="notes" size={14} />
                      <span>Nota independente</span>
                    </span>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        open={editorOpen}
        title={editing ? 'Editar nota' : 'Nova nota'}
        size="lg"
        onClose={closeEditor}
        footer={
          <>
            <Button variant="ghost" onClick={closeEditor} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" icon="notes" loading={saving} onClick={() => void save()}>
              {editing ? 'Salvar alterações' : 'Criar nota'}
            </Button>
          </>
        }
      >
        <div className="form-stack">
          {editing?.quote ? (
            <div className="note-editor-quote">
              <span className="field-label">Trecho vinculado</span>
              <blockquote className="note-quote">{truncate(editing.quote, 700)}</blockquote>
              {editing.sourceTitle ? (
                <span className="field-hint">Fonte: {editing.sourceTitle}</span>
              ) : null}
            </div>
          ) : null}
          <label className="field">
            <span className="field-label">Título</span>
            <input
              className="input"
              value={title}
              maxLength={200}
              placeholder="Opcional — será derivado do conteúdo"
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Conteúdo</span>
            <textarea
              className="textarea note-editor-textarea"
              rows={12}
              value={content}
              placeholder="Registre sua interpretação, uma dúvida, uma relação entre autores ou um próximo passo da investigação."
              onChange={(event) => setContent(event.target.value)}
            />
            <span className="field-hint">
              {content.length.toLocaleString('pt-BR')} caracteres. A nota é salva apenas nesta pesquisa.
            </span>
          </label>
          {formError ? <div className="form-error">{formError}</div> : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Excluir nota"
        message={
          <p>
            A nota <strong>“{deleteTarget?.title}”</strong> será removida permanentemente desta pesquisa.
            Esta ação não poderá ser revertida.
          </p>
        }
        confirmLabel="Excluir nota"
        danger
        loading={deleting}
        onConfirm={() => void remove()}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
