import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Activity, ResearchSummary } from '../../../shared/types';
import { api, errorMessage } from '../api';
import { ActivityFeed } from './ActivityFeed';
import { Badge } from './Badge';
import { Button } from './Button';
import { ConfirmDialog, Modal } from './Modal';
import { Dropdown, DropdownItem, DropdownSeparator } from './Dropdown';
import { Icon } from './Icons';
import { useToast } from './Toast';
import { formatRelative } from '../utils/format';
import { useSettings } from '../context/SettingsContext';

interface ResearchHeaderProps {
  research: ResearchSummary;
  refresh: () => Promise<void>;
}

interface EditForm {
  title: string;
  description: string;
  initialContext: string;
  questions: string;
}

export function ResearchHeader({ research, refresh }: ResearchHeaderProps) {
  const navigate = useNavigate();
  const { notify } = useToast();
  const { settings } = useSettings();

  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<EditForm>({ title: '', description: '', initialContext: '', questions: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity[] | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);

  useEffect(() => {
    if (!editOpen) return;
    setForm({
      title: research.title,
      description: research.description,
      initialContext: research.initialContext,
      questions: research.questions.join('\n'),
    });
    setFormError(null);
  }, [editOpen, research]);

  useEffect(() => {
    if (!historyOpen) return;
    let cancelled = false;
    setActivity(null);
    setActivityError(null);
    api
      .getResearchActivity(research.id)
      .then((items) => {
        if (!cancelled) setActivity(items);
      })
      .catch((error) => {
        if (!cancelled) setActivityError(errorMessage(error));
      });
    return () => {
      cancelled = true;
    };
  }, [historyOpen, research.id]);

  const saveEdit = async () => {
    if (!form.title.trim()) {
      setFormError('O título da pesquisa não pode ficar vazio.');
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await api.updateResearch(research.id, {
        title: form.title,
        description: form.description,
        initialContext: form.initialContext,
        questions: form.questions.split('\n').map((line) => line.trim()).filter(Boolean),
      });
      await refresh();
      setEditOpen(false);
      notify('Pesquisa atualizada.', 'success');
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const archive = async () => {
    setBusy(true);
    try {
      await api.archiveResearch(research.id);
      notify('Pesquisa arquivada. Você pode restaurá-la pela Dashboard.', 'success');
      navigate('/');
    } catch (error) {
      notify(errorMessage(error), 'error');
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.deleteResearch(research.id);
      notify('Pesquisa excluída permanentemente.', 'success');
      navigate('/');
    } catch (error) {
      notify(errorMessage(error), 'error');
      setBusy(false);
    }
  };

  const restore = async () => {
    setBusy(true);
    try {
      await api.restoreResearch(research.id);
      await refresh();
      notify('Pesquisa restaurada.', 'success');
    } catch (error) {
      notify(errorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {research.status === 'archived' ? (
        <div className="archived-banner">
          <div className="archived-banner-text">
            <Icon name="archive" size={16} />
            <span>
              Esta pesquisa está arquivada. Ela não aparece na lista principal, mas seus dados permanecem
              preservados.
            </span>
          </div>
          <Button size="sm" icon="refresh" onClick={restore} loading={busy}>
            Restaurar
          </Button>
        </div>
      ) : null}

      <div className="research-header">
        <div className="research-header-main">
          <div className="eyebrow">Pesquisa</div>
          <h1>{research.title}</h1>
          {research.description ? <p className="research-description">{research.description}</p> : null}
          <div className="research-meta">
            <Badge tone={research.status === 'active' ? 'accent' : 'neutral'}>
              {research.status === 'active' ? 'Ativa' : 'Arquivada'}
            </Badge>
            <span>{research.counts.documents} documentos aprovados</span>
            {research.counts.pendingSources > 0 ? (
              <span className="meta-alert">{research.counts.pendingSources} fontes pendentes</span>
            ) : null}
            <span>{research.counts.notes} notas</span>
            <span>Atualizada {formatRelative(research.lastActivityAt)}</span>
          </div>
        </div>
        <div className="research-header-actions">
          <Button icon="edit" onClick={() => setEditOpen(true)}>
            Editar
          </Button>
          <Dropdown label="Mais" icon="dots">
            <DropdownItem icon="history" onClick={() => setHistoryOpen(true)}>
              Histórico de atividades
            </DropdownItem>
            <DropdownItem icon="download" onClick={() => setExportOpen(true)}>
              Exportar pesquisa
            </DropdownItem>
            <DropdownSeparator />
            {research.status === 'active' ? (
              <DropdownItem icon="archive" onClick={() => setArchiveOpen(true)}>
                Arquivar pesquisa
              </DropdownItem>
            ) : (
              <DropdownItem icon="refresh" onClick={restore}>
                Restaurar pesquisa
              </DropdownItem>
            )}
            <DropdownItem icon="trash" danger onClick={() => setDeleteOpen(true)}>
              Excluir permanentemente
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <Modal
        open={editOpen}
        title="Editar pesquisa"
        onClose={() => setEditOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={saveEdit} loading={busy}>
              Salvar alterações
            </Button>
          </>
        }
      >
        <div className="form-stack">
          <label className="field">
            <span className="field-label">Título</span>
            <input
              className="input"
              value={form.title}
              maxLength={200}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </label>
          <label className="field">
            <span className="field-label">Descrição</span>
            <textarea
              className="textarea"
              rows={2}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </label>
          <label className="field">
            <span className="field-label">Perguntas de investigação</span>
            <textarea
              className="textarea"
              rows={3}
              value={form.questions}
              placeholder="Uma pergunta por linha"
              onChange={(event) => setForm({ ...form, questions: event.target.value })}
            />
            <span className="field-hint">Uma pergunta por linha. Elas orientam a investigação.</span>
          </label>
          <label className="field">
            <span className="field-label">Contexto e instruções iniciais</span>
            <textarea
              className="textarea"
              rows={4}
              value={form.initialContext}
              onChange={(event) => setForm({ ...form, initialContext: event.target.value })}
            />
            <span className="field-hint">
              Este contexto orienta a IA, mas não é tratado como evidência documental.
            </span>
          </label>
          {formError ? <div className="form-error">{formError}</div> : null}
        </div>
      </Modal>

      <Modal
        open={historyOpen}
        title="Histórico de atividades"
        size="lg"
        onClose={() => setHistoryOpen(false)}
      >
        {activityError ? (
          <div className="form-error">{activityError}</div>
        ) : activity === null ? (
          <p className="muted">Carregando histórico…</p>
        ) : (
          <ActivityFeed items={activity} />
        )}
      </Modal>

      <Modal
        open={exportOpen}
        title="Exportar pesquisa"
        onClose={() => setExportOpen(false)}
        footer={
          <Button variant="ghost" onClick={() => setExportOpen(false)}>
            Fechar
          </Button>
        }
      >
        <p className="muted">
          A exportação é gerada a partir dos dados locais desta pesquisa. O arquivo é baixado pelo navegador.
        </p>
        <div className="export-options">
          <div className="export-option">
            <div>
              <strong>Backup completo em JSON</strong>
              <p>Inclui metadados, anotações, histórico e o texto extraído das fontes.</p>
            </div>
            <a className="btn btn-secondary btn-sm" href={api.exportUrl(research.id, 'json')} download>
              <Icon name="download" size={14} />
              <span>Baixar JSON</span>
            </a>
          </div>
          <div className="export-option">
            <div>
              <strong>Relatório em Markdown</strong>
              <p>Visão legível com contexto, perguntas, fontes e anotações.</p>
            </div>
            <a className="btn btn-secondary btn-sm" href={api.exportUrl(research.id, 'markdown')} download>
              <Icon name="download" size={14} />
              <span>Baixar Markdown</span>
            </a>
          </div>
        </div>
        {settings?.ai.provider === 'demo' ? (
          <p className="field-hint">
            A exportação não inclui respostas da IA porque elas não são armazenadas automaticamente.
          </p>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={archiveOpen}
        title="Arquivar pesquisa"
        message="A pesquisa deixará de aparecer na lista principal da Dashboard. Nenhum documento, fonte ou anotação será removido. Você poderá restaurá-la depois."
        confirmLabel="Arquivar"
        loading={busy}
        onConfirm={archive}
        onClose={() => setArchiveOpen(false)}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Excluir pesquisa permanentemente"
        message={
          <>
            <p>
              A pesquisa <strong>“{research.title}”</strong> será removida com suas fontes, textos extraídos,
              anotações e histórico de atividades.
            </p>
            <p className="danger-text">Esta ação não poderá ser revertida.</p>
          </>
        }
        confirmLabel="Excluir permanentemente"
        danger
        loading={busy}
        onConfirm={remove}
        onClose={() => setDeleteOpen(false)}
      />
    </>
  );
}
