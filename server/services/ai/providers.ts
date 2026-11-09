import { HttpError } from '../../errors.js';
import type { AppSettings } from '../../storage/types.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionResult {
  content: string;
  provider: AppSettings['ai']['provider'];
  model: string;
}

const AI_TIMEOUT_MS = 180_000;

function normalizeBaseUrl(raw: string, label: string): string {
  const trimmed = (raw || '').trim().replace(/\/+$/, '');
  if (!trimmed) {
    throw new HttpError(422, 'AI_NOT_CONFIGURED', `Configure o endereço do provedor ${label}.`);
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new HttpError(422, 'AI_NOT_CONFIGURED', `O endereço do provedor ${label} é inválido.`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new HttpError(422, 'AI_NOT_CONFIGURED', `O endereço do provedor ${label} deve usar http ou https.`);
  }
  return trimmed;
}

export async function runCompletion(
  settings: AppSettings,
  messages: ChatMessage[],
): Promise<CompletionResult> {
  if (settings.ai.provider === 'ollama') {
    return runOllama(settings, messages);
  }
  if (settings.ai.provider === 'openai-compatible') {
    return runOpenAiCompatible(settings, messages);
  }
  throw new HttpError(
    422,
    'AI_NOT_CONFIGURED',
    'O modo demonstração não produz respostas de um modelo real. Configure um provedor em Configurações.',
  );
}

async function runOllama(settings: AppSettings, messages: ChatMessage[]): Promise<CompletionResult> {
  const baseUrl = normalizeBaseUrl(settings.ai.ollamaBaseUrl, 'Ollama');
  const model = settings.ai.ollamaModel.trim();
  if (!model) {
    throw new HttpError(422, 'AI_NOT_CONFIGURED', 'Configure o modelo do Ollama nas configurações.');
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: false, options: { temperature: 0.2 } }),
    });
  } catch (error) {
    if ((error as Error).name === 'TimeoutError') {
      throw new HttpError(504, 'AI_TIMEOUT', 'O modelo demorou demais para responder.');
    }
    throw new HttpError(
      502,
      'AI_UNAVAILABLE',
      `Não foi possível conectar ao Ollama em ${baseUrl}. Verifique se ele está em execução e se o endereço está correto.`,
    );
  }

  const payload = (await readJson(response)) as {
    message?: { content?: string };
    error?: string;
  };

  if (!response.ok) {
    const detail = payload.error || `status ${response.status}`;
    if (response.status === 404) {
      throw new HttpError(
        502,
        'AI_MODEL_NOT_FOUND',
        `O modelo “${model}” não foi encontrado no Ollama. Execute “ollama pull ${model}” ou ajuste o modelo nas configurações. Detalhe: ${detail}`,
      );
    }
    throw new HttpError(502, 'AI_ERROR', `O Ollama retornou um erro: ${detail}`);
  }

  const content = payload.message?.content?.trim();
  if (!content) {
    throw new HttpError(502, 'AI_EMPTY_RESPONSE', 'O Ollama retornou uma resposta vazia.');
  }
  return { content, provider: 'ollama', model };
}

async function runOpenAiCompatible(
  settings: AppSettings,
  messages: ChatMessage[],
): Promise<CompletionResult> {
  const baseUrl = normalizeBaseUrl(settings.ai.openaiBaseUrl, 'compatível com OpenAI');
  const model = settings.ai.openaiModel.trim();
  if (!model) {
    throw new HttpError(
      422,
      'AI_NOT_CONFIGURED',
      'Configure o identificador do modelo do endpoint compatível com OpenAI.',
    );
  }

  const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (settings.ai.apiKey) {
    headers.authorization = `Bearer ${settings.ai.apiKey}`;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
      headers,
      body: JSON.stringify({ model, messages, temperature: 0.2, stream: false }),
    });
  } catch (error) {
    if ((error as Error).name === 'TimeoutError') {
      throw new HttpError(504, 'AI_TIMEOUT', 'O modelo demorou demais para responder.');
    }
    throw new HttpError(
      502,
      'AI_UNAVAILABLE',
      `Não foi possível conectar ao endpoint ${endpoint}. Verifique o endereço e se o servidor está em execução.`,
    );
  }

  const payload = (await readJson(response)) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string } | string;
  };

  if (!response.ok) {
    const detail =
      typeof payload.error === 'string'
        ? payload.error
        : payload.error?.message || `status ${response.status}`;
    if (response.status === 401 || response.status === 403) {
      throw new HttpError(
        502,
        'AI_AUTH_ERROR',
        `O provedor recusou a autenticação. Verifique a chave de API configurada. Detalhe: ${detail}`,
      );
    }
    if (response.status === 404) {
      throw new HttpError(
        502,
        'AI_MODEL_NOT_FOUND',
        `O modelo “${model}” ou o endpoint não foi encontrado no provedor. Detalhe: ${detail}`,
      );
    }
    throw new HttpError(502, 'AI_ERROR', `O provedor de IA retornou um erro: ${detail}`);
  }

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new HttpError(502, 'AI_EMPTY_RESPONSE', 'O provedor de IA retornou uma resposta vazia.');
  }
  return { content, provider: 'openai-compatible', model };
}

async function readJson(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
