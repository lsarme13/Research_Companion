import crypto from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { Express } from 'express';
import request from 'supertest';
import type { ResearchSummary, Source } from '../../shared/types.js';
import { createApp } from '../app.js';
import { Repository } from '../storage/repository.js';
import type { StoredSource } from '../storage/types.js';

export interface TestContext {
  app: Express;
  dataDir: string;
  repo: Repository;
}

export async function createTestContext(): Promise<TestContext> {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'research-companion-test-'));
  const app = await createApp({ dataDir });
  return { app, dataDir, repo: new Repository(dataDir) };
}

export async function destroyTestContext(context: TestContext): Promise<void> {
  await rm(context.dataDir, { recursive: true, force: true });
}

export async function createResearch(
  app: Express,
  title = 'Pesquisa de teste',
): Promise<ResearchSummary> {
  const response = await request(app)
    .post('/api/research')
    .send({ title, description: 'Descrição de teste' })
    .expect(201);
  return response.body as ResearchSummary;
}

export async function uploadText(
  app: Express,
  researchId: string,
  filename: string,
  content: string,
): Promise<Source> {
  const response = await request(app)
    .post(`/api/research/${researchId}/sources/file`)
    .attach('file', Buffer.from(content, 'utf8'), {
      filename,
      contentType: 'text/plain',
    })
    .expect(201);
  return response.body as Source;
}

/**
 * Insere uma fonte diretamente no armazenamento para simular estados que
 * dependem de busca na internet, sem realizar chamadas de rede nos testes.
 */
export async function seedSource(
  repo: Repository,
  researchId: string,
  overrides: Partial<StoredSource> & { title: string },
): Promise<StoredSource> {
  const now = new Date().toISOString();
  const id = overrides.id || crypto.randomUUID();
  const textFile =
    overrides.textFile !== undefined
      ? overrides.textFile
      : await repo.writeSourceText(
          researchId,
          id,
          overrides.excerpt || 'Texto semeado para o teste.',
        );
  const source: StoredSource = {
    id,
    researchId,
    kind: 'url',
    status: 'pending',
    url: 'https://example.org/artigo',
    domain: 'example.org',
    tags: [],
    addedAt: now,
    updatedAt: now,
    textFile,
    ...overrides,
  };
  await repo.updateSources(researchId, (current) => [...current, source]);
  return source;
}
