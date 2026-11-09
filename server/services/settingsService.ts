import type {
  AiProviderId,
  PublicSettings,
  SearchProviderId,
  SettingsUpdate,
  ThemeId,
} from '../../shared/types.js';
import { validationError } from '../errors.js';
import type { Repository } from '../storage/repository.js';
import type { AppSettings } from '../storage/types.js';

const THEMES: ThemeId[] = ['editorial', 'dark', 'neutral'];
const AI_PROVIDERS: AiProviderId[] = ['demo', 'ollama', 'openai-compatible'];
const SEARCH_PROVIDERS: SearchProviderId[] = ['duckduckgo', 'searxng'];

function validateOptionalUrl(value: string, label: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw validationError(`O endereço de ${label} é inválido.`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw validationError(`O endereço de ${label} deve usar http ou https.`);
  }
  return trimmed;
}

export async function getPublicSettings(repo: Repository): Promise<PublicSettings> {
  const settings = await repo.getSettings();
  return {
    theme: settings.theme,
    ai: {
      provider: settings.ai.provider,
      ollamaBaseUrl: settings.ai.ollamaBaseUrl,
      ollamaModel: settings.ai.ollamaModel,
      openaiBaseUrl: settings.ai.openaiBaseUrl,
      openaiModel: settings.ai.openaiModel,
      hasApiKey: Boolean(settings.ai.apiKey),
    },
    search: settings.search,
    dataDir: repo.dataDir,
  };
}

export async function updateSettings(
  repo: Repository,
  update: SettingsUpdate,
): Promise<PublicSettings> {
  const current = await repo.getSettings();
  const next: AppSettings = {
    ...current,
    ai: { ...current.ai },
    search: { ...current.search },
  };

  if (update.theme !== undefined) {
    if (!THEMES.includes(update.theme)) throw validationError('Tema inválido.');
    next.theme = update.theme;
  }

  if (update.ai) {
    if (update.ai.provider !== undefined) {
      if (!AI_PROVIDERS.includes(update.ai.provider)) {
        throw validationError('Provedor de IA inválido.');
      }
      next.ai.provider = update.ai.provider;
    }
    if (update.ai.ollamaBaseUrl !== undefined) {
      next.ai.ollamaBaseUrl =
        validateOptionalUrl(update.ai.ollamaBaseUrl, 'Ollama') || current.ai.ollamaBaseUrl;
    }
    if (update.ai.ollamaModel !== undefined) {
      next.ai.ollamaModel = update.ai.ollamaModel.trim().slice(0, 200);
    }
    if (update.ai.openaiBaseUrl !== undefined) {
      next.ai.openaiBaseUrl =
        validateOptionalUrl(update.ai.openaiBaseUrl, 'endpoint compatível com OpenAI') ||
        current.ai.openaiBaseUrl;
    }
    if (update.ai.openaiModel !== undefined) {
      next.ai.openaiModel = update.ai.openaiModel.trim().slice(0, 200);
    }
    if (update.ai.apiKey !== undefined) {
      if (update.ai.apiKey === null) {
        delete next.ai.apiKey;
      } else if (update.ai.apiKey.trim()) {
        next.ai.apiKey = update.ai.apiKey.trim();
      }
    }
  }

  if (update.search) {
    if (update.search.provider !== undefined) {
      if (!SEARCH_PROVIDERS.includes(update.search.provider)) {
        throw validationError('Provedor de busca inválido.');
      }
      next.search.provider = update.search.provider;
    }
    if (update.search.searxngUrl !== undefined) {
      next.search.searxngUrl = validateOptionalUrl(update.search.searxngUrl, 'SearXNG');
    }
  }

  await repo.saveSettings(next);
  return getPublicSettings(repo);
}
