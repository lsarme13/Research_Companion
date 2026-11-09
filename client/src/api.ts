import type {
  Activity,
  AiAnswer,
  AiTestResult,
  LibraryDocument,
  Note,
  PublicSettings,
  ReadingRequest,
  Research,
  ResearchSummary,
  SearchResponse,
  SettingsUpdate,
  Source,
  SourceEvaluation,
  UrlPreview,
} from '../../shared/types';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData) && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Não foi possível conectar ao servidor local. Verifique se ele está em execução.',
    );
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? ((await response.json()) as unknown)
    : await response.text();

  if (!response.ok) {
    const error = body as { error?: { code?: string; message?: string; details?: unknown } };
    throw new ApiError(
      response.status,
      error?.error?.code || 'REQUEST_ERROR',
      error?.error?.message || `A requisição falhou (status ${response.status}).`,
      error?.error?.details,
    );
  }
  return body as T;
}

function jsonBody(value: unknown): string {
  return JSON.stringify(value);
}

export interface ResearchInput {
  title?: string;
  description?: string;
  initialContext?: string;
  questions?: string[];
  lastSection?: string;
  lastSourceId?: string | null;
}

export const api = {
  listResearch: (includeArchived = false) =>
    request<ResearchSummary[]>(`/research?includeArchived=${includeArchived}`),
  getResearch: (id: string) => request<ResearchSummary>(`/research/${id}`),
  createResearch: (input: { title: string; description?: string; initialContext?: string }) =>
    request<ResearchSummary>('/research', { method: 'POST', body: jsonBody(input) }),
  updateResearch: (id: string, input: ResearchInput) =>
    request<ResearchSummary>(`/research/${id}`, { method: 'PATCH', body: jsonBody(input) }),
  deleteResearch: (id: string) =>
    request<void>(`/research/${id}?confirm=true`, { method: 'DELETE' }),
  archiveResearch: (id: string) =>
    request<ResearchSummary>(`/research/${id}/archive`, { method: 'POST' }),
  restoreResearch: (id: string) =>
    request<ResearchSummary>(`/research/${id}/restore`, { method: 'POST' }),
  getResearchActivity: (id: string) => request<Activity[]>(`/research/${id}/activity`),
  getGlobalActivity: () => request<Activity[]>('/activity'),
  exportUrl: (id: string, format: 'json' | 'markdown') =>
    `/api/research/${id}/export?format=${format}`,

  listSources: (id: string, status?: string) =>
    request<Source[]>(`/research/${id}/sources${status ? `?status=${status}` : ''}`),
  getSource: (id: string, sourceId: string) =>
    request<Source>(`/research/${id}/sources/${sourceId}`),
  getSourceText: (id: string, sourceId: string) =>
    request<{ text: string }>(`/research/${id}/sources/${sourceId}/text`),
  addFile: (id: string, file: File, metadata?: { category?: string; tags?: string[] }) => {
    const form = new FormData();
    form.append('file', file);
    if (metadata?.category) form.append('category', metadata.category);
    if (metadata?.tags?.length) form.append('tags', JSON.stringify(metadata.tags));
    return request<Source>(`/research/${id}/sources/file`, { method: 'POST', body: form });
  },
  addUrl: (
    id: string,
    url: string,
    metadata?: { category?: string; tags?: string[] },
  ) =>
    request<Source>(`/research/${id}/sources/url`, {
      method: 'POST',
      body: jsonBody({ url, ...metadata }),
    }),
  searchSources: (id: string, query: string) =>
    request<SearchResponse>(`/research/${id}/sources/search`, {
      method: 'POST',
      body: jsonBody({ query }),
    }),
  previewUrl: (id: string, url: string) =>
    request<UrlPreview>(`/research/${id}/sources/preview-url`, {
      method: 'POST',
      body: jsonBody({ url }),
    }),
  approveSource: (id: string, sourceId: string) =>
    request<Source>(`/research/${id}/sources/${sourceId}/approve`, { method: 'POST' }),
  rejectSource: (id: string, sourceId: string) =>
    request<Source>(`/research/${id}/sources/${sourceId}/reject`, { method: 'POST' }),
  updateSource: (
    id: string,
    sourceId: string,
    input: { title?: string; category?: string; tags?: string[] },
  ) =>
    request<Source>(`/research/${id}/sources/${sourceId}`, {
      method: 'PATCH',
      body: jsonBody(input),
    }),
  removeSource: (id: string, sourceId: string) =>
    request<void>(`/research/${id}/sources/${sourceId}`, { method: 'DELETE' }),
  sourceDownloadUrl: (id: string, sourceId: string) =>
    `/api/research/${id}/sources/${sourceId}/download`,

  listNotes: (id: string) => request<Note[]>(`/research/${id}/notes`),
  createNote: (
    id: string,
    input: { title?: string; content: string; sourceId?: string; quote?: string },
  ) => request<Note>(`/research/${id}/notes`, { method: 'POST', body: jsonBody(input) }),
  updateNote: (id: string, noteId: string, input: { title?: string; content?: string }) =>
    request<Note>(`/research/${id}/notes/${noteId}`, {
      method: 'PATCH',
      body: jsonBody(input),
    }),
  deleteNote: (id: string, noteId: string) =>
    request<void>(`/research/${id}/notes/${noteId}`, { method: 'DELETE' }),

  ask: (id: string, question: string, sourceIds?: string[]) =>
    request<AiAnswer>(`/research/${id}/ai/ask`, {
      method: 'POST',
      body: jsonBody({ question, sourceIds }),
    }),
  analyzeReading: (id: string, input: ReadingRequest) =>
    request<AiAnswer>(`/research/${id}/ai/reading`, {
      method: 'POST',
      body: jsonBody(input),
    }),
  evaluateSource: (id: string, sourceId: string) =>
    request<SourceEvaluation>(`/research/${id}/ai/evaluate-source`, {
      method: 'POST',
      body: jsonBody({ sourceId }),
    }),
  testAi: () => request<AiTestResult>('/ai/test', { method: 'POST' }),

  getSettings: () => request<PublicSettings>('/settings'),
  saveSettings: (input: SettingsUpdate) =>
    request<PublicSettings>('/settings', { method: 'PUT', body: jsonBody(input) }),
  getLibraryDocuments: () => request<LibraryDocument[]>('/library/documents'),
};

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ocorreu um erro inesperado.';
}

export type ResearchRecord = Research;
