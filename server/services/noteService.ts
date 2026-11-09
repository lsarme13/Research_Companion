import crypto from 'node:crypto';
import type { Note } from '../../shared/types.js';
import { notFound, validationError } from '../errors.js';
import type { Repository } from '../storage/repository.js';
import { recordActivity } from './activity.js';

export interface NoteInput {
  title?: string;
  content: string;
  sourceId?: string;
  quote?: string;
}

function deriveTitle(content: string): string {
  const firstLine = content
    .split('\n')
    .map((line) => line.replace(/^#+\s*/, '').trim())
    .find(Boolean);
  return (firstLine || 'Nota sem título').slice(0, 100);
}

function normalizeInput(input: NoteInput): { title: string; content: string; quote?: string } {
  const content = (input.content || '').trim();
  const title = (input.title || '').trim().slice(0, 200);
  if (!content && !title) {
    throw validationError('Escreva um título ou o conteúdo da nota.');
  }
  if (content.length > 200_000) {
    throw validationError('A nota excede o limite de tamanho suportado.');
  }
  const quote = (input.quote || '').trim().slice(0, 10_000) || undefined;
  return {
    title: title || deriveTitle(content),
    content,
    quote,
  };
}

export async function listNotes(repo: Repository, researchId: string): Promise<Note[]> {
  await repo.getResearchRecord(researchId);
  const notes = await repo.getNotes(researchId);
  return notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createNote(
  repo: Repository,
  researchId: string,
  input: NoteInput,
): Promise<Note> {
  await repo.getResearchRecord(researchId);
  const normalized = normalizeInput(input);
  let sourceTitle: string | undefined;
  if (input.sourceId) {
    const source = (await repo.getSources(researchId)).find((item) => item.id === input.sourceId);
    if (!source) throw notFound('A fonte vinculada à nota não foi encontrada.');
    sourceTitle = source.title;
  }
  const now = new Date().toISOString();
  const note: Note = {
    id: crypto.randomUUID(),
    researchId,
    title: normalized.title,
    content: normalized.content,
    quote: normalized.quote,
    sourceId: input.sourceId,
    sourceTitle,
    createdAt: now,
    updatedAt: now,
  };
  await repo.saveNotes(researchId, [...(await repo.getNotes(researchId)), note]);
  await recordActivity(repo, researchId, 'note.created', `Nota “${note.title}” criada.`, {
    noteId: note.id,
  });
  return note;
}

export async function updateNote(
  repo: Repository,
  researchId: string,
  noteId: string,
  input: { title?: string; content?: string },
): Promise<Note> {
  await repo.getResearchRecord(researchId);
  const notes = await repo.getNotes(researchId);
  const existing = notes.find((note) => note.id === noteId);
  if (!existing) throw notFound('Nota não encontrada.');

  const merged = normalizeInput({
    title: input.title !== undefined ? input.title : existing.title,
    content: input.content !== undefined ? input.content : existing.content,
    quote: existing.quote,
  });
  const updated: Note = {
    ...existing,
    title: merged.title,
    content: merged.content,
    updatedAt: new Date().toISOString(),
  };
  await repo.saveNotes(
    researchId,
    notes.map((note) => (note.id === noteId ? updated : note)),
  );
  await recordActivity(repo, researchId, 'note.updated', `Nota “${updated.title}” atualizada.`, {
    noteId,
  });
  return updated;
}

export async function deleteNote(
  repo: Repository,
  researchId: string,
  noteId: string,
): Promise<void> {
  await repo.getResearchRecord(researchId);
  const notes = await repo.getNotes(researchId);
  const existing = notes.find((note) => note.id === noteId);
  if (!existing) throw notFound('Nota não encontrada.');
  await repo.saveNotes(
    researchId,
    notes.filter((note) => note.id !== noteId),
  );
  await recordActivity(repo, researchId, 'note.removed', `Nota “${existing.title}” excluída.`, {
    noteId,
  });
}
