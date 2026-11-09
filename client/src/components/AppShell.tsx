import { useCallback, useEffect, useState } from 'react';
import { Link, Outlet, useMatch } from 'react-router-dom';
import type { ResearchSummary } from '../../../shared/types';
import { api, errorMessage } from '../api';
import { ResearchOutletContext } from '../context/ResearchContext';
import { useSettings } from '../context/SettingsContext';
import { Sidebar } from './Sidebar';
import { ResearchHeader } from './ResearchHeader';
import { ErrorBlock, LoadingBlock } from './Feedback';
import { EmptyState } from './Layout';
import { Button } from './Button';

const SECTIONS = new Set(['documents', 'sources', 'reader', 'notes']);

export function AppShell() {
  const researchMatch = useMatch('/research/:id/*');
  const sectionMatch = useMatch('/research/:id/:section');
  const researchId = researchMatch?.params.id || null;
  const section = sectionMatch?.params.section || null;

  const [research, setResearch] = useState<ResearchSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const settings = useSettings();

  const refresh = useCallback(async () => {
    if (!researchId) return;
    const loaded = await api.getResearch(researchId);
    setResearch(loaded);
  }, [researchId]);

  useEffect(() => {
    if (!researchId) {
      setResearch(null);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResearch(null);
    api
      .getResearch(researchId)
      .then((loaded) => {
        if (!cancelled) setResearch(loaded);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [researchId]);

  useEffect(() => {
    const lastSection = research?.lastSection;
    if (!researchId || !lastSection || !section || !SECTIONS.has(section)) return;
    if (lastSection === section) return;
    let cancelled = false;
    api
      .updateResearch(researchId, { lastSection: section })
      .then((updated) => {
        if (!cancelled) setResearch(updated);
      })
      .catch(() => {
        // A navegação não deve ser interrompida por uma falha ao registrar a seção.
      });
    return () => {
      cancelled = true;
    };
  }, [researchId, research?.lastSection, section]);

  const outletContext: ResearchOutletContext | null = research
    ? { research, refresh }
    : null;

  return (
    <div className="app-shell">
      <Sidebar research={research} />
      <div className="app-main">
        {settings.error ? (
          <div className="offline-banner" role="alert">
            <span>Não foi possível conectar ao servidor local. {settings.error}</span>
            <Button size="sm" variant="secondary" onClick={() => void settings.reload()}>
              Tentar novamente
            </Button>
          </div>
        ) : null}

        {researchId ? (
          loading ? (
            <div className="page">
              <LoadingBlock label="Abrindo pesquisa…" />
            </div>
          ) : error ? (
            <div className="page">
              <EmptyState
                icon="alert"
                title="Pesquisa não encontrada"
                description={error}
                action={
                  <Link to="/" className="btn btn-secondary btn-md">
                    Voltar para a Dashboard
                  </Link>
                }
              />
            </div>
          ) : research ? (
            <>
              <ResearchHeader research={research} refresh={refresh} />
              <main className="page page-research">
                <Outlet context={outletContext} />
              </main>
            </>
          ) : (
            <div className="page">
              <ErrorBlock message="Não foi possível carregar a pesquisa." onRetry={() => void refresh()} />
            </div>
          )
        ) : (
          <main className="page">
            <Outlet context={outletContext} />
          </main>
        )}
      </div>
    </div>
  );
}
