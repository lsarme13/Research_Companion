import fs from 'node:fs/promises';
import path from 'node:path';
import type { Activity, Note, Research } from '../../shared/types.js';
import { notFound } from '../errors.js';
import { getJsonStore, JsonStore } from './jsonStore.js';
import { AppSettings, defaultSettings, StoredSource } from './types.js';

const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function assertEntityId(id: string): void {
  if (!ID_PATTERN.test(id)) {
    throw notFound('Identificador inválido.');
  }
}

function assertSafeRelativeFile(value: string): string {
  if (!value || value.includes('..') || value.includes('/') || value.includes('\\')) {
    throw new Error(`Caminho de arquivo inválido no armazenamento: ${value}`);
  }
  return value;
}

export class Repository {
  readonly researchRoot: string;

  constructor(public readonly dataDir: string) {
    this.researchRoot = path.join(dataDir, 'research');
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.researchRoot, { recursive: true });
  }

  private settingsStore(): JsonStore<AppSettings> {
    return getJsonStore(path.join(this.dataDir, 'settings.json'), defaultSettings);
  }

  async getSettings(): Promise<AppSettings> {
    return this.settingsStore().read();
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await this.settingsStore().write(settings);
  }

  private researchDir(researchId: string): string {
    assertEntityId(researchId);
    return path.join(this.researchRoot, researchId);
  }

  private researchFile(researchId: string): string {
    return path.join(this.researchDir(researchId), 'research.json');
  }

  private sourcesFile(researchId: string): string {
    return path.join(this.researchDir(researchId), 'sources.json');
  }

  private notesFile(researchId: string): string {
    return path.join(this.researchDir(researchId), 'notes.json');
  }

  private activityFile(researchId: string): string {
    return path.join(this.researchDir(researchId), 'activity.json');
  }

  private researchStore(researchId: string): JsonStore<Research | null> {
    return getJsonStore(this.researchFile(researchId), () => null);
  }

  private sourcesStore(researchId: string): JsonStore<StoredSource[]> {
    return getJsonStore(this.sourcesFile(researchId), () => []);
  }

  private notesStore(researchId: string): JsonStore<Note[]> {
    return getJsonStore(this.notesFile(researchId), () => []);
  }

  private activityStore(researchId: string): JsonStore<Activity[]> {
    return getJsonStore(this.activityFile(researchId), () => []);
  }

  async listResearchRecords(): Promise<Research[]> {
    await this.initialize();
    const entries = await fs.readdir(this.researchRoot, { withFileTypes: true });
    const records: Research[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || !ID_PATTERN.test(entry.name)) continue;
      const record = await this.researchStore(entry.name).read();
      if (record) records.push(record);
    }
    return records.sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
  }

  async getResearchRecord(researchId: string): Promise<Research> {
    assertEntityId(researchId);
    const record = await this.researchStore(researchId).read();
    if (!record) throw notFound('Pesquisa não encontrada.');
    return record;
  }

  async saveResearchRecord(record: Research): Promise<void> {
    await fs.mkdir(this.researchDir(record.id), { recursive: true });
    await this.researchStore(record.id).write(record);
  }

  async deleteResearchRecord(researchId: string): Promise<void> {
    await fs.rm(this.researchDir(researchId), { recursive: true, force: true });
  }

  async getSources(researchId: string): Promise<StoredSource[]> {
    return this.sourcesStore(researchId).read();
  }

  async saveSources(researchId: string, sources: StoredSource[]): Promise<void> {
    await this.sourcesStore(researchId).write(sources);
  }

  async updateSources(
    researchId: string,
    mutator: (sources: StoredSource[]) => StoredSource[] | Promise<StoredSource[]>,
  ): Promise<StoredSource[]> {
    return this.sourcesStore(researchId).update(mutator);
  }

  async getNotes(researchId: string): Promise<Note[]> {
    return this.notesStore(researchId).read();
  }

  async saveNotes(researchId: string, notes: Note[]): Promise<void> {
    await this.notesStore(researchId).write(notes);
  }

  async getActivity(researchId: string): Promise<Activity[]> {
    return this.activityStore(researchId).read();
  }

  async appendActivity(researchId: string, activity: Activity): Promise<void> {
    await this.activityStore(researchId).update((current) => [activity, ...current].slice(0, 400));
  }

  async getSourceText(researchId: string, source: StoredSource): Promise<string | null> {
    if (!source.textFile) return null;
    const fileName = assertSafeRelativeFile(source.textFile);
    try {
      return await fs.readFile(path.join(this.researchDir(researchId), 'texts', fileName), 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  async writeSourceText(researchId: string, sourceId: string, text: string): Promise<string> {
    const fileName = `${sourceId}.txt`;
    const directory = path.join(this.researchDir(researchId), 'texts');
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, fileName), text, 'utf8');
    return fileName;
  }

  async deleteSourceText(researchId: string, source: StoredSource): Promise<void> {
    if (!source.textFile) return;
    const fileName = assertSafeRelativeFile(source.textFile);
    await fs.rm(path.join(this.researchDir(researchId), 'texts', fileName), { force: true });
  }

  async writeSourceDocument(
    researchId: string,
    sourceId: string,
    extension: string,
    data: Buffer,
  ): Promise<string> {
    const fileName = `${sourceId}${extension}`;
    const directory = path.join(this.researchDir(researchId), 'documents');
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, fileName), data);
    return fileName;
  }

  async getSourceDocumentPath(researchId: string, source: StoredSource): Promise<string | null> {
    if (!source.storedFileName) return null;
    const fileName = assertSafeRelativeFile(source.storedFileName);
    const fullPath = path.join(this.researchDir(researchId), 'documents', fileName);
    try {
      await fs.access(fullPath);
      return fullPath;
    } catch {
      return null;
    }
  }

  async deleteSourceDocument(researchId: string, source: StoredSource): Promise<void> {
    if (!source.storedFileName) return;
    const fileName = assertSafeRelativeFile(source.storedFileName);
    await fs.rm(path.join(this.researchDir(researchId), 'documents', fileName), { force: true });
  }
}
