import { useEffect, useState } from 'react';
import type {
  AiProviderId,
  SearchProviderId,
  SettingsUpdate,
  ThemeId,
} from '../../../shared/types';
import { api, errorMessage } from '../api';
import { Button } from '../components/Button';
import { Icon } from '../components/Icons';
import { PageHeader } from '../components/Layout';
import { ErrorBlock, LoadingBlock } from '../components/Feedback';
import { useToast } from '../components/Toast';
import { useSettings } from '../context/SettingsContext';

interface FormState {
  provider: AiProviderId;
  ollamaBaseUrl: string;
  ollamaModel: string;
  openaiBaseUrl: string;
  openaiModel: string;
  apiKey: string;
  clearKey: boolean;
  searchProvider: SearchProviderId;
  searxngUrl: string;
}

const THEMES: Array<{ id: ThemeId; name: string; description: string }> = [
  {
    id: 'editorial',
    name: 'Editorial / Acadêmico',
    description: 'Fundos claros, tipografia editorial e aparência de leitura.',
  },
  {
    id: 'dark',
    name: 'Dark / Tecnológico',
    description: 'Tons escuros, contraste controlado e uso prolongado.',
  },
  {
    id: 'neutral',
    name: 'Neutro / Funcional',
    description: 'Paleta sóbria e elementos visuais discretos.',
  },
];

function toForm(settings: NonNullable<ReturnType<typeof useSettings>['settings']>): FormState {
  return {
    provider: settings.ai.provider,
    ollamaBaseUrl: settings.ai.ollamaBaseUrl,
    ollamaModel: settings.ai.ollamaModel,
    openaiBaseUrl: settings.ai.openaiBaseUrl,
    openaiModel: settings.ai.openaiModel,
    apiKey: '',
    clearKey: false,
    searchProvider: settings.search.provider,
    searxngUrl: settings.search.searxngUrl,
  };
}

function buildUpdate(form: FormState): SettingsUpdate {
  return {
    ai: {
      provider: form.provider,
      ollamaBaseUrl: form.ollamaBaseUrl,
      ollamaModel: form.ollamaModel,
      openaiBaseUrl: form.openaiBaseUrl,
      openaiModel: form.openaiModel,
      ...(form.clearKey ? { apiKey: null } : form.apiKey.trim() ? { apiKey: form.apiKey } : {}),
    },
    search: {
      provider: form.searchProvider,
      searxngUrl: form.searxngUrl,
    },
  };
}

export function Settings() {
  const { settings, loading, error, save, reload } = useSettings();
  const { notify } = useToast();
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);
  const [themeBusy, setThemeBusy] = useState<ThemeId | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (settings && !form) setForm(toForm(settings));
  }, [settings, form]);

  if (loading || !form) {
    return (
      <>
        <PageHeader
          eyebrow="Aplicativo"
          title="Configurações"
          description="Preferências visuais, provedores de IA e busca de fontes."
        />
        {error ? <ErrorBlock message={error} onRetry={() => void reload()} /> : <LoadingBlock />}
      </>
    );
  }

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setTestResult(null);
  };

  const persist = async (showToast = true) => {
    if (!form) return null;
    setBusy(true);
    setFormError(null);
    try {
      const next = await save(buildUpdate(form));
      setForm((current) =>
        current ? { ...current, apiKey: '', clearKey: false } : current,
      );
      if (showToast) notify('Configurações salvas.', 'success');
      return next;
    } catch (err) {
      setFormError(errorMessage(err));
      return null;
    } finally {
      setBusy(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const saved = await persist(false);
    if (!saved) {
      setTesting(false);
      return;
    }
    try {
      const result = await api.testAi();
      setTestResult({
        ok: true,
        message: `${result.message} (${result.provider} · ${result.model}${result.latencyMs ? ` · ${result.latencyMs} ms` : ''})`,
      });
      notify('Conexão com o provedor de IA verificada.', 'success');
    } catch (err) {
      setTestResult({ ok: false, message: errorMessage(err) });
    } finally {
      setTesting(false);
    }
  };

  const changeTheme = async (theme: ThemeId) => {
    if (settings?.theme === theme) return;
    setThemeBusy(theme);
    try {
      await save({ theme });
      notify('Tema alterado.', 'success');
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setThemeBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Aplicativo"
        title="Configurações"
        description="Preferências visuais, provedores de IA e busca de fontes. Todas as configurações ficam neste computador."
      />

      <div className="settings-layout">
        <section className="settings-section">
          <div className="settings-section-head">
            <h2>Tema visual</h2>
            <p>A alteração é aplicada imediatamente e preservada entre sessões.</p>
          </div>
          <div className="theme-grid">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className={`theme-card theme-preview-${theme.id} ${settings?.theme === theme.id ? 'theme-card-active' : ''}`}
                onClick={() => void changeTheme(theme.id)}
                disabled={themeBusy !== null}
                aria-pressed={settings?.theme === theme.id}
              >
                <span className="theme-swatch" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="theme-card-text">
                  <strong>{theme.name}</strong>
                  <span>{theme.description}</span>
                </span>
                {settings?.theme === theme.id ? (
                  <span className="theme-check">
                    <Icon name="check" size={14} />
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-head">
            <h2>Inteligência artificial</h2>
            <p>
              O Research Companion não depende de uma API comercial paga. Use o modo demonstração,
              um modelo local no Ollama ou um endpoint compatível com OpenAI.
            </p>
          </div>

          <div className="form-stack">
            <label className="field">
              <span className="field-label">Provedor</span>
              <select
                className="select"
                value={form.provider}
                onChange={(event) => update('provider', event.target.value as AiProviderId)}
              >
                <option value="demo">Modo demonstração (sem IA real)</option>
                <option value="ollama">Ollama local</option>
                <option value="openai-compatible">Endpoint compatível com OpenAI</option>
              </select>
            </label>

            {form.provider === 'demo' ? (
              <div className="callout callout-info">
                <Icon name="info" size={16} />
                <p>
                  No modo demonstração, as telas de IA exibem respostas simuladas e identificadas. Nenhuma
                  chamada externa é feita. A busca de fontes na internet continua funcionando.
                </p>
              </div>
            ) : null}

            {form.provider === 'ollama' ? (
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Endereço do Ollama</span>
                  <input
                    className="input"
                    value={form.ollamaBaseUrl}
                    onChange={(event) => update('ollamaBaseUrl', event.target.value)}
                    placeholder="http://127.0.0.1:11434"
                  />
                </label>
                <label className="field">
                  <span className="field-label">Modelo</span>
                  <input
                    className="input"
                    value={form.ollamaModel}
                    onChange={(event) => update('ollamaModel', event.target.value)}
                    placeholder="llama3.2"
                  />
                  <span className="field-hint">Use um modelo já instalado localmente.</span>
                </label>
              </div>
            ) : null}

            {form.provider === 'openai-compatible' ? (
              <div className="form-stack">
                <div className="form-grid">
                  <label className="field">
                    <span className="field-label">Base URL</span>
                    <input
                      className="input"
                      value={form.openaiBaseUrl}
                      onChange={(event) => update('openaiBaseUrl', event.target.value)}
                      placeholder="http://127.0.0.1:1234/v1"
                    />
                    <span className="field-hint">
                      Ex.: LM Studio, llama.cpp, vLLM ou um provedor com API compatível.
                    </span>
                  </label>
                  <label className="field">
                    <span className="field-label">Modelo</span>
                    <input
                      className="input"
                      value={form.openaiModel}
                      onChange={(event) => update('openaiModel', event.target.value)}
                      placeholder="nome-do-modelo"
                    />
                  </label>
                </div>
                <label className="field">
                  <span className="field-label">Chave de API</span>
                  <input
                    className="input"
                    type="password"
                    autoComplete="off"
                    value={form.apiKey}
                    onChange={(event) => update('apiKey', event.target.value)}
                    placeholder={
                      settings?.ai.hasApiKey
                        ? 'Chave configurada — deixe em branco para manter'
                        : 'Opcional para servidores locais'
                    }
                  />
                  <span className="field-hint">
                    A chave é armazenada apenas no arquivo local de configurações. Ela nunca é
                    incluída nas exportações.
                  </span>
                  {settings?.ai.hasApiKey || form.clearKey ? (
                    <span className="inline-actions">
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => {
                          update('clearKey', !form.clearKey);
                          update('apiKey', '');
                        }}
                      >
                        {form.clearKey ? 'Manter a chave existente' : 'Remover chave salva'}
                      </button>
                    </span>
                  ) : null}
                </label>
              </div>
            ) : null}

            {formError ? <div className="form-error">{formError}</div> : null}

            <div className="inline-actions">
              <Button variant="secondary" icon="refresh" onClick={() => void testConnection()} loading={testing}>
                Salvar e testar conexão
              </Button>
              {testResult ? (
                <span className={testResult.ok ? 'test-result test-result-ok' : 'test-result test-result-error'}>
                  {testResult.message}
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-head">
            <h2>Busca de fontes</h2>
            <p>
              A pesquisa na internet só acontece quando você solicita. O DuckDuckGo é usado por padrão;
              uma instância SearXNG própria também pode ser configurada.
            </p>
          </div>
          <div className="form-stack">
            <label className="field">
              <span className="field-label">Provedor de busca</span>
              <select
                className="select"
                value={form.searchProvider}
                onChange={(event) => update('searchProvider', event.target.value as SearchProviderId)}
              >
                <option value="duckduckgo">DuckDuckGo (gratuito)</option>
                <option value="searxng">SearXNG (instância própria)</option>
              </select>
            </label>
            {form.searchProvider === 'searxng' ? (
              <label className="field">
                <span className="field-label">URL da instância SearXNG</span>
                <input
                  className="input"
                  value={form.searxngUrl}
                  onChange={(event) => update('searxngUrl', event.target.value)}
                  placeholder="http://127.0.0.1:8080"
                />
                <span className="field-hint">
                  A instância precisa permitir respostas no formato JSON.
                </span>
              </label>
            ) : null}
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-head">
            <h2>Dados locais</h2>
            <p>
              Documentos, metadados, anotações e históricos são gravados em arquivos JSON e textos no
              computador. Não há sincronização remota nem telemetria.
            </p>
          </div>
          <div className="data-location">
            <Icon name="folder" size={16} />
            <code>{settings?.dataDir}</code>
          </div>
          <div className="callout callout-warning">
            <Icon name="alert" size={16} />
            <p>
              Faça backups periódicos desta pasta. A exclusão de uma pesquisa remove permanentemente
              seus arquivos e não pode ser desfeita pelo sistema.
            </p>
          </div>
        </section>

        <div className="settings-actions">
          <Button variant="primary" onClick={() => void persist()} loading={busy}>
            Salvar configurações
          </Button>
        </div>
      </div>
    </>
  );
}
