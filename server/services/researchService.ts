import crypto from 'node:crypto';
import type { Research, ResearchSummary } from '../../shared/types.js';
import { validationError } from '../errors.js';
import type { Repository } from '../storage/repository.js';
import { recordActivity } from './activity.js';

const SECTIONS = new Set(['documents', 'sources', 'reader', 'notes']);

export interface CreateResearchInput {
  title: string;
  description?: string;
  initialContext?: string;
  questions?: string[];
}

export interface UpdateResearchInput {
  title?: string;
  description?: string;
  initialContext?: string;
  questions?: string[];
  lastSection?: string;
  lastSourceId?: string | null;
}

function cleanText(value: string | undefined, maxLength: number): string {
  return (value || '').trim().slice(0, maxLength);
}

function cleanQuestions(questions: string[] | undefined): string[] {
  if (!questions) return [];
  return questions
    .map((question) => cleanText(question, 500))
    .filter(Boolean)
    .slice(0, 40);
}

function validateTitle(title: string | undefined): string {
  const cleaned = cleanText(title, 200);
  if (!cleaned) throw validationError('Informe um título para a pesquisa.');
  return cleaned;
}

export async function createResearch(repo: Repository, input: CreateResearchInput): Promise<Research> {
  const now = new Date().toISOString();
  const record: Research = {
    id: crypto.randomUUID(),
    title: validateTitle(input.title),
    description: cleanText(input.description, 2000),
    initialContext: cleanText(input.initialContext, 20000),
    questions: cleanQuestions(input.questions),
    status: 'active',
    createdAt: now,
    updatedAt: now,
    lastActivityAt: now,
    lastSection: 'documents',
  };
  await repo.saveResearchRecord(record);
  await recordActivity(repo, record.id, 'research.created', `Pesquisa “${record.title}” criada.`);
  return record;
}

export async function listResearchSummaries(
  repo: Repository,
  options: { includeArchived?: boolean } = {},
): Promise<ResearchSummary[]> {
  const records = await repo.listResearchRecords();
  const filtered = options.includeArchived
    ? records
    : records.filter((record) => record.status === 'active');
  return Promise.all(filtered.map((record) => toSummary(repo, record)));
}

export async function getResearchSummary(repo: Repository, researchId: string): Promise<ResearchSummary> {
  const record = await repo.getResearchRecord(researchId);
  return toSummary(repo, record);
}

async function toSummary(repo: Repository, record: Research): Promise<ResearchSummary> {
  const [sources, notes] = await Promise.all([
    repo.getSources(record.id),
    repo.getNotes(record.id),
  ]);
  return {
    ...record,
    counts: {
      documents: sources.filter((source) => source.status === 'approved').length,
      pendingSources: sources.filter((source) => source.status === 'pending').length,
      notes: notes.length,
    },
  };
}

export async function updateResearch(
  repo: Repository,
  researchId: string,
  input: UpdateResearchInput,
): Promise<Research> {
  const record = await repo.getResearchRecord(researchId);
  const now = new Date().toISOString();
  let contentChanged = false;

  if (input.title !== undefined) {
    const title = validateTitle(input.title);
    if (title !== record.title) {
      record.title = title;
      contentChanged = true;
    }
  }
  if (input.description !== undefined) {
    const description = cleanText(input.description, 2000);
    if (description !== record.description) {
      record.description = description;
      contentChanged = true;
    }
  }
  if (input.initialContext !== undefined) {
    const initialContext = cleanText(input.initialContext, 20000);
    if (initialContext !== record.initialContext) {
      record.initialContext = initialContext;
      contentChanged = true;
    }
  }
  if (input.questions !== undefined) {
    const questions = cleanQuestions(input.questions);
    if (JSON.stringify(questions) !== JSON.stringify(record.questions)) {
      record.questions = questions;
      contentChanged = true;
    }
  }
  if (input.lastSection !== undefined) {
    record.lastSection = SECTIONS.has(input.lastSection) ? input.lastSection : 'documents';
  }
  if (input.lastSourceId !== undefined) {
    record.lastSourceId = input.lastSourceId || undefined;
  }

  record.updatedAt = now;
  if (contentChanged) {
    record.lastActivityAt = now;
    await recordActivity(repo, researchId, 'research.updated', 'Dados da pesquisa atualizados.');
  }
  await repo.saveResearchRecord(record);
  return record;
}

export async function archiveResearch(repo: Repository, researchId: string): Promise<Research> {
  const record = await repo.getResearchRecord(researchId);
  if (record.status === 'archived') return record;
  const now = new Date().toISOString();
  record.status = 'archived';
  record.archivedAt = now;
  record.updatedAt = now;
  record.lastActivityAt = now;
  await repo.saveResearchRecord(record);
  await recordActivity(repo, researchId, 'research.archived', 'Pesquisa arquivada.');
  return record;
}

export async function restoreResearch(repo: Repository, researchId: string): Promise<Research> {
  const record = await repo.getResearchRecord(researchId);
  if (record.status === 'active') return record;
  const now = new Date().toISOString();
  record.status = 'active';
  delete record.archivedAt;
  record.updatedAt = now;
  record.lastActivityAt = now;
  await repo.saveResearchRecord(record);
  await recordActivity(repo, researchId, 'research.restored', 'Pesquisa restaurada.');
  return record;
}

export async function deleteResearch(repo: Repository, researchId: string): Promise<void> {
  await repo.getResearchRecord(researchId);
  await repo.deleteResearchRecord(researchId);
}

export async function getResearchActivity(repo: Repository, researchId: string) {
  await repo.getResearchRecord(researchId);
  return repo.getActivity(researchId);
}

export async function getGlobalActivity(repo: Repository, limit = 12) {
  const records = await repo.listResearchRecords();
  const entries = await Promise.all(
    records
      .filter((record) => record.status === 'active')
      .map(async (record) => {
        const activity = await repo.getActivity(record.id);
        return activity.map((item) => ({ ...item, researchTitle: record.title }));
      }),
  );
  return entries
    .flat()
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}
