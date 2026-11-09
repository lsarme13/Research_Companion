import type {
  AiProviderId,
  Research,
  SearchProviderId,
  SourceKind,
  SourceStatus,
  ThemeId,
} from '../../shared/types.js';

export interface StoredSource {
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
  textFile?: string;
  storedFileName?: string;
  fileHash?: string;
}

export type StoredResearch = Research;

export interface AppSettings {
  theme: ThemeId;
  ai: {
    provider: AiProviderId;
    ollamaBaseUrl: string;
    ollamaModel: string;
    openaiBaseUrl: string;
    openaiModel: string;
    apiKey?: string;
  };
  search: {
    provider: SearchProviderId;
    searxngUrl: string;
  };
}

export function defaultSettings(): AppSettings {
  return {
    theme: 'editorial',
    ai: {
      provider: 'demo',
      ollamaBaseUrl: 'http://127.0.0.1:11434',
      ollamaModel: 'llama3.2',
      openaiBaseUrl: 'http://127.0.0.1:1234/v1',
      openaiModel: '',
    },
    search: {
      provider: 'duckduckgo',
      searxngUrl: '',
    },
  };
}
