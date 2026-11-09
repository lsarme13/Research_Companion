import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { PublicSettings } from '../../shared/types.js';
import type { ResearchExport } from '../services/exportService.js';
import {
  createResearch,
  createTestContext,
  destroyTestContext,
  seedSource,
  type TestContext,
  uploadText,
} from './helpers.js';

let context: TestContext;

beforeEach(async () => {
  context = await createTestContext();
});

afterEach(async () => {
  await destroyTestContext(context);
});

describe('configurações', () => {
  it('retorna os padrões na primeira leitura', async () => {
    const response = await request(context.app).get('/api/settings').expect(200);
    const settings = response.body as PublicSettings;

    expect(settings.theme).toBe('editorial');
    expect(settings.ai.provider).toBe('demo');
    expect(settings.ai.hasApiKey).toBe(false);
    expect(settings.search.provider).toBe('duckduckgo');
    expect(settings.dataDir).toBe(context.dataDir);
  });

  it('persiste tema, provedor e chave de API sem expor a chave', async () => {
    const updated = await request(context.app)
      .put('/api/settings')
      .send({
        theme: 'dark',
        ai: {
          provider: 'openai-compatible',
          openaiBaseUrl: 'http://127.0.0.1:1234/v1',
          openaiModel: 'modelo-local',
          apiKey: 'chave-secreta',
        },
        search: { provider: 'searxng', searxngUrl: 'http://127.0.0.1:8080' },
      })
      .expect(200);

    expect(updated.body.theme).toBe('dark');
    expect(updated.body.ai.provider).toBe('openai-compatible');
    expect(updated.body.ai.openaiModel).toBe('modelo-local');
    expect(updated.body.ai.hasApiKey).toBe(true);
    expect(updated.body.ai.apiKey).toBeUndefined();

    const stored = await context.repo.getSettings();
    expect(stored.ai.apiKey).toBe('chave-secreta');

    const publicSettings = await request(context.app).get('/api/settings').expect(200);
    expect(publicSettings.body.ai.hasApiKey).toBe(true);
    expect(JSON.stringify(publicSettings.body)).not.toContain('chave-secreta');

    await request(context.app)
      .put('/api/settings')
      .send({ ai: { apiKey: null } })
      .expect(200);

    const cleared = await request(context.app).get('/api/settings').expect(200);
    expect(cleared.body.ai.hasApiKey).toBe(false);
    expect(cleared.body.theme).toBe('dark');
  });

  it('mantém as configurações entre instâncias do servidor', async () => {
    await request(context.app)
      .put('/api/settings')
      .send({ theme: 'neutral', ai: { provider: 'ollama' } })
      .expect(200);

    const { createApp } = await import('../app.js');
    const secondApp = await createApp({ dataDir: context.dataDir });
    const response = await request(secondApp).get('/api/settings').expect(200);
    expect(response.body.theme).toBe('neutral');
    expect(response.body.ai.provider).toBe('ollama');
  });

  it('rejeita tema, provedor e endereços inválidos', async () => {
    const invalidTheme = await request(context.app)
      .put('/api/settings')
      .send({ theme: 'sepia' });
    expect(invalidTheme.status).toBe(422);

    const invalidProvider = await request(context.app)
      .put('/api/settings')
      .send({ ai: { provider: 'servico-pago' } });
    expect(invalidProvider.status).toBe(422);

    const invalidUrl = await request(context.app)
      .put('/api/settings')
      .send({ ai: { ollamaBaseUrl: 'ftp://127.0.0.1:11434' } });
    expect(invalidUrl.status).toBe(422);
    expect(invalidUrl.body.error.code).toBe('VALIDATION_ERROR');

    const invalidSearch = await request(context.app)
      .put('/api/settings')
      .send({ search: { searxngUrl: 'nao-e-uma-url' } });
    expect(invalidSearch.status).toBe(422);

    const settings = await request(context.app).get('/api/settings').expect(200);
    expect(settings.body.theme).toBe('editorial');
    expect(settings.body.ai.ollamaBaseUrl).toBe('http://127.0.0.1:11434');
  });
});

describe('exportação', () => {
  it('exporta JSON com fontes, textos aprovados, notas e atividades', async () => {
    const research = await createResearch(context.app, 'Ética e tecnologia');
    const approved = await uploadText(
      context.app,
      research.id,
      'etica.txt',
      'Texto aprovado sobre ética e tecnologia.',
    );
    await seedSource(context.repo, research.id, {
      title: 'Fonte pendente',
      status: 'pending',
      url: 'https://example.org/pendente',
      textFile: undefined,
    });
    await seedSource(context.repo, research.id, {
      title: 'Fonte rejeitada',
      status: 'rejected',
      url: 'https://example.org/rejeitada',
      textFile: undefined,
    });

    await request(context.app)
      .post(`/api/research/${research.id}/notes`)
      .send({
        title: 'Nota de leitura',
        content: 'Anotação vinculada ao documento.',
        sourceId: approved.id,
        quote: 'Texto aprovado',
      })
      .expect(201);

    const response = await request(context.app)
      .get(`/api/research/${research.id}/export?format=json`)
      .expect(200);

    expect(response.headers['content-type']).toContain('application/json');
    expect(response.headers['content-disposition']).toContain('.json');

    const data = response.body as ResearchExport;
    expect(data.research.title).toBe('Ética e tecnologia');
    expect(data.sources).toHaveLength(3);
    expect(data.notes).toHaveLength(1);
    expect(data.notes[0]?.quote).toBe('Texto aprovado');
    expect(data.activity.some((item) => item.type === 'note.created')).toBe(true);

    const approvedExport = data.sources.find((source) => source.id === approved.id);
    expect(approvedExport?.status).toBe('approved');
    expect(approvedExport?.text).toContain('Texto aprovado sobre ética e tecnologia.');

    const pendingExport = data.sources.find((source) => source.title === 'Fonte pendente');
    expect(pendingExport?.status).toBe('pending');
    expect(pendingExport?.text).toBeUndefined();
  });

  it('exporta Markdown legível com fontes e anotações', async () => {
    const research = await createResearch(context.app, 'Democracia e mídias');
    await uploadText(
      context.app,
      research.id,
      'democracia.txt',
      'Conteúdo sobre democracia e mídias.',
    );
    await seedSource(context.repo, research.id, {
      title: 'Fonte em análise',
      status: 'pending',
      url: 'https://example.org/analise',
      textFile: undefined,
    });
    await request(context.app)
      .post(`/api/research/${research.id}/notes`)
      .send({
        title: 'Hipótese inicial',
        content: 'A esfera pública muda com as plataformas.',
        quote: 'mídias digitais',
      })
      .expect(201);

    const response = await request(context.app)
      .get(`/api/research/${research.id}/export?format=markdown`)
      .expect(200);

    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.headers['content-disposition']).toContain('.md');

    const markdown = response.text;
    expect(markdown).toContain('# Democracia e mídias');
    expect(markdown).toContain('## Fontes aprovadas');
    expect(markdown).toContain('democracia.txt');
    expect(markdown).toContain('## Fontes pendentes');
    expect(markdown).toContain('Fonte em análise');
    expect(markdown).toContain('## Anotações');
    expect(markdown).toContain('Hipótese inicial');
    expect(markdown).toContain('mídias digitais');
    expect(markdown).not.toContain('Conteúdo sobre democracia e mídias.');
    expect(markdown.endsWith('\n')).toBe(true);
  });

  it('não exporta pesquisa inexistente', async () => {
    const missingId = '00000000-0000-4000-8000-000000000000';
    await request(context.app).get(`/api/research/${missingId}/export`).expect(404);
    await request(context.app).get('/api/research/invalido/export').expect(404);
  });
});
