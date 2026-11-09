import crypto from 'node:crypto';
import path from 'node:path';
import type {
  SearchDuplicate,
  SearchResponse,
  Source,
  UrlPreview,
} from '../../shared/types.js';
import { conflict, HttpError, notFound, validationError } from '../errors.js';
import type { Repository } from '../storage/repository.js';
import type { StoredSource } from '../storage/types.js';
import { normalizeUrl, truncate } from '../utils.js';
import { recordActivity } from './activity.js';
import { extractDocument } from './documents.js';
import { searchWeb } from './search.js';
import { fetchWebContent } from './webContent.js';

export interface UpdateSourceInput {
  title?: string;
  category?: string;
  tags?: string[];
}

export interface AddFileInput {
  originalName: string;
  buffer: Buffer;
  size: number;
}

function cleanCategory(value: string | undefined): string | undefined {
  const cleaned = (value || '').trim().slice(0, 80);
  return cleaned || undefined;
}

function cleanTags(tags: string[] | undefined): string[] {
  if (!tags) return [];
  return [...new Set(tags.map((tag) => tag.trim().slice(0, 60)).filter(Boolean))].slice(0, 20);
}

function duplicateTitle(source: StoredSource, all: StoredSource[]): string | undefined {
  if (!source.duplicateOf) return undefined;
  return all.find((item) => item.id === source.duplicateOf)?.title;
}

export function toPublicSource(source: StoredSource, all: StoredSource[]): Source {
  const { textFile: _textFile, storedFileName: _storedFileName, fileHash: _fileHash, ...rest } = source;
  return {
    ...rest,
    hasText: Boolean(source.textFile),
    duplicateOfTitle: duplicateTitle(source, all),
  };
}

function publicSources(sources: StoredSource[]): Source[] {
  return sources.map((source) => toPublicSource(source, sources));
}

function safeNormalizeUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return normalizeUrl(raw);
  } catch {
    return null;
  }
}

function findUrlDuplicate(sources: StoredSource[], normalizedUrl: string): StoredSource | undefined {
  return sources.find((source) => safeNormalizeUrl(source.url) === normalizedUrl);
}

function findHashDuplicate(sources: StoredSource[], hash: string): StoredSource | undefined {
  return sources.find((source) => source.fileHash === hash);
}

async function touchResearch(repo: Repository, researchId: string): Promise<void> {
  const record = await repo.getResearchRecord(researchId);
  const now = new Date().toISOString();
  record.lastActivityAt = now;
  record.updatedAt = now;
  await repo.saveResearchRecord(record);
}

export async function listSources(
  repo: Repository,
  researchId: string,
  options: { status?: string; kind?: string } = {},
): Promise<Source[]> {
  await repo.getResearchRecord(researchId);
  let sources = await repo.getSources(researchId);
  if (options.status) sources = sources.filter((source) => source.status === options.status);
  if (options.kind) sources = sources.filter((source) => source.kind === options.kind);
  return publicSources(
    sources.sort((a, b) => {
      const order = { approved: 0, pending: 1, rejected: 2 } as const;
      const statusDiff = order[a.status] - order[b.status];
      return statusDiff !== 0 ? statusDiff : b.addedAt.localeCompare(a.addedAt);
    }),
  );
}

export async function getSource(repo: Repository, researchId: string, sourceId: string): Promise<Source> {
  const sources = await repo.getSources(researchId);
  const source = sources.find((item) => item.id === sourceId);
  if (!source) throw notFound('Fonte não encontrada.');
  return toPublicSource(source, sources);
}

export async function getSourceText(
  repo: Repository,
  researchId: string,
  sourceId: string,
): Promise<string> {
  const sources = await repo.getSources(researchId);
  const source = sources.find((item) => item.id === sourceId);
  if (!source) throw notFound('Fonte não encontrada.');
  if (source.status !== 'approved') {
    throw new HttpError(
      403,
      'SOURCE_NOT_APPROVED',
      'Esta fonte ainda não foi aprovada e não pode ser lida no contexto da pesquisa.',
    );
  }
  const text = await repo.getSourceText(researchId, source);
  if (!text) throw notFound('O texto desta fonte não está disponível. Tente reimportá-la.');
  return text;
}

export async function addFileSource(
  repo: Repository,
  researchId: string,
  input: AddFileInput,
  metadata: { category?: string; tags?: string[] } = {},
): Promise<Source> {
  await repo.getResearchRecord(researchId);
  const extracted = await extractDocument(input.originalName, input.buffer);
  const hash = crypto.createHash('sha256').update(input.buffer).digest('hex');
  const sourceId = crypto.randomUUID();
  const now = new Date().toISOString();
  const title = truncate(
    path
      .parse(input.originalName)
      .name.replace(/[_-]+/g, ' ')
      .trim() || input.originalName,
    300,
  );

  const textFile = await repo.writeSourceText(researchId, sourceId, extracted.text);
  let storedFileName: string | undefined;
  try {
    storedFileName = await repo.writeSourceDocument(
      researchId,
      sourceId,
      extracted.extension,
      input.buffer,
    );
  } catch (error) {
    await repo.deleteSourceText(researchId, {
      id: sourceId,
      textFile,
    } as StoredSource);
    throw error;
  }

  const source: StoredSource = {
    id: sourceId,
    researchId,
    kind: 'file',
    status: 'approved',
    title,
    originalFileName: input.originalName,
    sizeBytes: input.size,
    category: cleanCategory(metadata.category),
    tags: cleanTags(metadata.tags),
    addedAt: now,
    updatedAt: now,
    decidedAt: now,
    textFile,
    storedFileName,
    fileHash: hash,
  };

  try {
    await repo.updateSources(researchId, (current) => {
      const duplicate = findHashDuplicate(current, hash);
      if (duplicate) {
        throw conflict(`Este documento já foi adicionado à pesquisa como “${duplicate.title}”.`);
      }
      return [...current, source];
    });
  } catch (error) {
    await repo.deleteSourceText(researchId, source);
    await repo.deleteSourceDocument(researchId, source);
    throw error;
  }

  await touchResearch(repo, researchId);
  await recordActivity(
    repo,
    researchId,
    'source.file_added',
    `Documento “${source.title}” adicionado à pesquisa.`,
    { sourceId },
  );
  return toPublicSource(source, await repo.getSources(researchId));
}

export async function addUrlSource(
  repo: Repository,
  researchId: string,
  rawUrl: string,
  metadata: { category?: string; tags?: string[] } = {},
): Promise<Source> {
  await repo.getResearchRecord(researchId);
  let normalized: string;
  try {
    normalized = normalizeUrl(rawUrl);
  } catch {
    throw new HttpError(422, 'INVALID_URL', 'Informe uma URL http ou https válida.');
  }

  const before = await repo.getSources(researchId);
  const existing = findUrlDuplicate(before, normalized);
  if (existing) {
    throw conflict(`Esta URL já pertence à pesquisa como “${existing.title}”.`);
  }

  const content = await fetchWebContent(rawUrl);
  const finalNormalized = normalizeUrl(content.url);
  const sourceId = crypto.randomUUID();
  const textFile = await repo.writeSourceText(researchId, sourceId, content.text);
  const now = new Date().toISOString();
  const source: StoredSource = {
    id: sourceId,
    researchId,
    kind: 'url',
    status: 'approved',
    title: content.title || content.domain || rawUrl,
    url: content.url,
    domain: content.domain,
    authors: content.authors,
    publication: content.publication,
    publishedAt: content.publishedAt,
    category: cleanCategory(metadata.category),
    tags: cleanTags(metadata.tags),
    addedAt: now,
    updatedAt: now,
    decidedAt: now,
    textFile,
  };

  try {
    await repo.updateSources(researchId, (current) => {
      const duplicate =
        findUrlDuplicate(current, finalNormalized) || findUrlDuplicate(current, normalized);
      if (duplicate) {
        throw conflict(`Esta URL já pertence à pesquisa como “${duplicate.title}”.`);
      }
      return [...current, source];
    });
  } catch (error) {
    await repo.deleteSourceText(researchId, source);
    throw error;
  }

  await touchResearch(repo, researchId);
  await recordActivity(
    repo,
    researchId,
    'source.url_added',
    `Fonte “${source.title}” importada de ${source.domain || 'URL'}.`,
    { sourceId },
  );
  return toPublicSource(source, await repo.getSources(researchId));
}

export async function searchSources(
  repo: Repository,
  researchId: string,
  query: string,
  settings: Awaited<ReturnType<Repository['getSettings']>>,
): Promise<SearchResponse> {
  await repo.getResearchRecord(researchId);
  const cleaned = query.trim();
  if (cleaned.length < 2) {
    throw validationError('Informe um tema ou pergunta com pelo menos 2 caracteres.');
  }

  const results = await searchWeb(cleaned, settings);
  const added: StoredSource[] = [];
  const duplicates: SearchDuplicate[] = [];
  const now = new Date().toISOString();

  await repo.updateSources(researchId, (current) => {
    for (const result of results) {
      const normalized = safeNormalizeUrl(result.url);
      if (!normalized) continue;
      const duplicate = findUrlDuplicate(current, normalized);
      if (duplicate) {
        duplicates.push({
          title: result.title,
          url: result.url,
          existingId: duplicate.id,
          existingTitle: duplicate.title,
        });
        continue;
      }
      const source: StoredSource = {
        id: crypto.randomUUID(),
        researchId,
        kind: 'url',
        status: 'pending',
        title: result.title,
        url: result.url,
        domain: result.domain,
        excerpt: result.snippet,
        tags: [],
        addedAt: now,
        updatedAt: now,
        searchQuery: cleaned,
      };
      current.push(source);
      added.push(source);
    }
    return current;
  });

  if (added.length > 0) {
    await touchResearch(repo, researchId);
    await recordActivity(
      repo,
      researchId,
      'source.search_added',
      `Busca por “${cleaned}” retornou ${added.length} fonte(s) pendente(s) de aprovação.`,
      { query: cleaned, count: added.length },
    );
  }

  const all = await repo.getSources(researchId);
  return {
    query: cleaned,
    results: added.map((source) => toPublicSource(source, all)),
    duplicates,
    added: added.length,
  };
}

export async function previewUrl(rawUrl: string): Promise<UrlPreview> {
  const content = await fetchWebContent(rawUrl);
  return {
    url: content.url,
    title: content.title,
    text: truncate(content.text, 30_000),
    domain: content.domain,
    authors: content.authors,
    publication: content.publication,
    publishedAt: content.publishedAt,
  };
}

export async function approveSource(
  repo: Repository,
  researchId: string,
  sourceId: string,
): Promise<Source> {
  await repo.getResearchRecord(researchId);
  const sources = await repo.getSources(researchId);
  const source = sources.find((item) => item.id === sourceId);
  if (!source) throw notFound('Fonte não encontrada.');
  if (source.status === 'approved') return toPublicSource(source, sources);
  if (source.status === 'rejected') {
    throw validationError('Esta fonte foi rejeitada e não pode ser aprovada.');
  }

  let text = await repo.getSourceText(researchId, source);
  let contentMeta: Partial<StoredSource> = {};
  if (!text) {
    if (source.kind !== 'url' || !source.url) {
      throw validationError('Esta fonte não possui conteúdo aprovado.');
    }
    try {
      const content = await fetchWebContent(source.url);
      text = content.text;
      contentMeta = {
        url: content.url,
        domain: content.domain,
        authors: content.authors,
        publication: content.publication,
        publishedAt: content.publishedAt,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível acessar a fonte.';
      await repo.updateSources(researchId, (current) =>
        current.map((item) =>
          item.id === sourceId ? { ...item, lastError: message, updatedAt: new Date().toISOString() } : item,
        ),
      );
      if (error instanceof HttpError) {
        throw new HttpError(error.status, error.code, error.message, {
          source: await getSource(repo, researchId, sourceId),
        });
      }
      throw new HttpError(422, 'SOURCE_UNAVAILABLE', message, {
        source: await getSource(repo, researchId, sourceId),
      });
    }
  }

  const textFile = await repo.writeSourceText(researchId, sourceId, text);
  const now = new Date().toISOString();
  const updated = await repo.updateSources(researchId, (current) =>
    current.map((item) => {
      if (item.id !== sourceId) return item;
      if (item.status !== 'pending') return item;
      return {
        ...item,
        ...contentMeta,
        status: 'approved',
        decidedAt: now,
        updatedAt: now,
        textFile,
        lastError: undefined,
      };
    }),
  );

  const result = updated.find((item) => item.id === sourceId)!;
  await touchResearch(repo, researchId);
  await recordActivity(repo, researchId, 'source.approved', `Fonte “${result.title}” aprovada.`, {
    sourceId,
  });
  return toPublicSource(result, updated);
}

export async function rejectSource(
  repo: Repository,
  researchId: string,
  sourceId: string,
): Promise<Source> {
  await repo.getResearchRecord(researchId);
  const sources = await repo.getSources(researchId);
  const source = sources.find((item) => item.id === sourceId);
  if (!source) throw notFound('Fonte não encontrada.');
  if (source.status === 'rejected') return toPublicSource(source, sources);
  if (source.status === 'approved') {
    throw validationError(
      'Esta fonte já foi aprovada. Para retirá-la da pesquisa, use a opção de remoção.',
    );
  }

  const now = new Date().toISOString();
  const updated = await repo.updateSources(researchId, (current) =>
    current.map((item) =>
      item.id === sourceId
        ? {
            ...item,
            status: 'rejected',
            decidedAt: now,
            updatedAt: now,
            textFile: undefined,
            lastError: undefined,
          }
        : item,
    ),
  );
  await repo.deleteSourceText(researchId, source);
  await touchResearch(repo, researchId);
  await recordActivity(repo, researchId, 'source.rejected', `Fonte “${source.title}” rejeitada.`, {
    sourceId,
  });
  return toPublicSource(updated.find((item) => item.id === sourceId)!, updated);
}

export async function updateSource(
  repo: Repository,
  researchId: string,
  sourceId: string,
  input: UpdateSourceInput,
): Promise<Source> {
  const sources = await repo.getSources(researchId);
  const source = sources.find((item) => item.id === sourceId);
  if (!source) throw notFound('Fonte não encontrada.');

  const updated = await repo.updateSources(researchId, (current) =>
    current.map((item) => {
      if (item.id !== sourceId) return item;
      const nextTitle = input.title !== undefined ? input.title.trim().slice(0, 300) : item.title;
      if (!nextTitle) throw validationError('O título da fonte não pode ficar vazio.');
      return {
        ...item,
        title: nextTitle,
        category: input.category !== undefined ? cleanCategory(input.category) : item.category,
        tags: input.tags !== undefined ? cleanTags(input.tags) : item.tags,
        updatedAt: new Date().toISOString(),
      };
    }),
  );
  return toPublicSource(updated.find((item) => item.id === sourceId)!, updated);
}

export async function removeSource(
  repo: Repository,
  researchId: string,
  sourceId: string,
): Promise<void> {
  const sources = await repo.getSources(researchId);
  const source = sources.find((item) => item.id === sourceId);
  if (!source) throw notFound('Fonte não encontrada.');
  await repo.updateSources(researchId, (current) => current.filter((item) => item.id !== sourceId));
  await repo.deleteSourceText(researchId, source);
  await repo.deleteSourceDocument(researchId, source);
  await touchResearch(repo, researchId);
  await recordActivity(repo, researchId, 'source.removed', `Fonte “${source.title}” removida.`, {
    sourceId,
  });
}

export async function getSourceDownload(
  repo: Repository,
  researchId: string,
  sourceId: string,
): Promise<{ path: string; fileName: string }> {
  const sources = await repo.getSources(researchId);
  const source = sources.find((item) => item.id === sourceId);
  if (!source) throw notFound('Fonte não encontrada.');
  const filePath = await repo.getSourceDocumentPath(researchId, source);
  if (!filePath) {
    throw notFound('O arquivo original desta fonte não está disponível.');
  }
  return {
    path: filePath,
    fileName: source.originalFileName || path.basename(filePath),
  };
}

export async function getLibraryDocuments(repo: Repository) {
  const research = await repo.listResearchRecords();
  const entries = await Promise.all(
    research.map(async (record) => {
      const sources = await repo.getSources(record.id);
      return sources
        .filter((source) => source.status === 'approved')
        .map((source) => ({
          source: toPublicSource(source, sources),
          researchId: record.id,
          researchTitle: record.title,
          researchStatus: record.status,
        }));
    }),
  );
  return entries.flat().sort((a, b) => b.source.addedAt.localeCompare(a.source.addedAt));
}

export async function getSourceForAi(
  repo: Repository,
  researchId: string,
  sourceId: string,
): Promise<{ source: StoredSource; text: string } | null> {
  const sources = await repo.getSources(researchId);
  const source = sources.find((item) => item.id === sourceId);
  if (!source) return null;
  if (source.status !== 'approved') return null;
  const text = await repo.getSourceText(researchId, source);
  if (!text) return null;
  return { source, text };
}

export async function getApprovedSourcesWithText(
  repo: Repository,
  researchId: string,
  options: { sourceIds?: string[] } = {},
): Promise<Array<{ source: StoredSource; text: string }>> {
  const sources = await repo.getSources(researchId);
  const allowed = options.sourceIds ? new Set(options.sourceIds) : null;
  const approved = sources.filter(
    (source) =>
      source.status === 'approved' &&
      Boolean(source.textFile) &&
      (!allowed || allowed.has(source.id)),
  );
  const results: Array<{ source: StoredSource; text: string }> = [];
  for (const source of approved) {
    const text = await repo.getSourceText(researchId, source);
    if (text) results.push({ source, text });
  }
  return results;
}
