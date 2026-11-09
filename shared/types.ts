/** Tipos compartilhados entre o cliente e o servidor. */

export type ThemeId = 'editorial' | 'dark' | 'neutral';

export type ResearchStatus = 'active' | 'archived';

export type SourceKind = 'file' | 'url';

export type SourceStatus = 'pending' | 'approved' | 'rejected';

export type AiProviderId = 'demo' | 'ollama' | 'openai-compatible';

export type SearchProviderId = 'duckduckgo' | 'searxng';

export interface Research {
  id: string;
  title: string;
  description: string;
  initialContext: string;
  questions: string[];
  status: ResearchStatus;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  lastSection: string;
  lastSourceId?: string;
  archivedAt?: string;
}

export interface ResearchCounts {
  documents: number;
  pendingSources: number;
  notes: number;
}

export interface ResearchSummary extends Research {
  counts: ResearchCounts;
}

export interface Source {
  id: string;
  researchId: string;
  kind: SourceKind;
  status: SourceStatus;
  title: string;
  url?: string;
  domain?: string;
  authors?: string;
  publication?: string;
  publishedAt?: string;
  excerpt?: string;
  originalFileName?: string;
  sizeBytes?: number;
  category?: string;
  tags: string[];
  addedAt: string;
  updatedAt: string;
  decidedAt?: string;
  searchQuery?: string;
  lastError?: string;
  duplicateOf?: string;
  duplicateOfTitle?: string;
  hasText: boolean;
}

export interface SourceWithText extends Source {
  text: string;
}

export interface Note {
  id: string;
  researchId: string;
  title: string;
  content: string;
  sourceId?: string;
  sourceTitle?: string;
  quote?: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType =
  | 'research.created'
  | 'research.updated'
  | 'research.archived'
  | 'research.restored'
  | 'source.file_added'
  | 'source.url_added'
  | 'source.search_added'
  | 'source.approved'
  | 'source.rejected'
  | 'source.removed'
  | 'source.evaluated'
  | 'note.created'
  | 'note.updated'
  | 'note.removed'
  | 'ai.asked'
  | 'ai.analyzed';

export interface Activity {
  id: string;
  researchId: string;
  type: ActivityType;
  message: string;
  at: string;
  meta?: Record<string, string | number | boolean | null>;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

export interface SearchDuplicate {
  title: string;
  url: string;
  existingId: string;
  existingTitle: string;
}

export interface SearchResponse {
  query: string;
  results: Source[];
  duplicates: SearchDuplicate[];
  added: number;
}

export interface UrlPreview {
  url: string;
  title: string;
  text: string;
  domain: string;
  authors?: string;
  publication?: string;
  publishedAt?: string;
}

export interface AiReference {
  label: string;
  sourceId: string;
  title: string;
  url?: string;
  locator?: string;
}

export interface AiAnswer {
  answer: string;
  provider: AiProviderId;
  model: string;
  demo: boolean;
  references: AiReference[];
  contextSources: AiReference[];
}

export type ReadingAction =
  | 'explain'
  | 'simplify'
  | 'arguments'
  | 'assumptions'
  | 'questions'
  | 'custom';

export type ReadingDepth = 'simples' | 'intermediario' | 'avancado';

export interface ReadingRequest {
  sourceId: string;
  action: ReadingAction;
  selection?: string;
  question?: string;
  depth?: ReadingDepth;
}

export interface SourceEvaluation {
  answer: string;
  provider: AiProviderId;
  model: string;
  demo: boolean;
  sourceId: string;
  sourceTitle: string;
}

export interface PublicAiSettings {
  provider: AiProviderId;
  ollamaBaseUrl: string;
  ollamaModel: string;
  openaiBaseUrl: string;
  openaiModel: string;
  hasApiKey: boolean;
}

export interface PublicSearchSettings {
  provider: SearchProviderId;
  searxngUrl: string;
}

export interface PublicSettings {
  theme: ThemeId;
  ai: PublicAiSettings;
  search: PublicSearchSettings;
  dataDir: string;
}

export interface SettingsUpdate {
  theme?: ThemeId;
  ai?: {
    provider?: AiProviderId;
    ollamaBaseUrl?: string;
    ollamaModel?: string;
    openaiBaseUrl?: string;
    openaiModel?: string;
    apiKey?: string | null;
  };
  search?: {
    provider?: SearchProviderId;
    searxngUrl?: string;
  };
}

export interface LibraryDocument {
  source: Source;
  researchId: string;
  researchTitle: string;
  researchStatus: ResearchStatus;
}

export interface AiTestResult {
  ok: boolean;
  provider: AiProviderId;
  model: string;
  latencyMs: number;
  message: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
