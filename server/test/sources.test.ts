import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Source } from '../../shared/types.js';
import {
  createResearch,
  createTestContext,
  destroyTestContext,
  seedSource as seedStoredSource,
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

async function seedSource(
  research: { id: string },
  overrides: Parameters<typeof seedStoredSource>[2],
) {
  return seedStoredSource(context.repo, research.id, overrides);
}

describe('documentos e fontes', () => {
  it('adiciona um arquivo como fonte aprovada e permite ler e baixar', async () => {
    const research = await createResearch(context.app);
    const content = 'Primeiro parágrafo.\n\nSegundo parágrafo com detalhes.';

    const created = await uploadText(context.app, research.id, 'meu-documento.txt', content);
    expect(created.status).toBe('approved');
    expect(created.kind).toBe('file');
    expect(created.hasText).toBe(true);
    expect(created.title).toBe('meu documento');

    const text = await request(context.app)
      .get(`/api/research/${research.id}/sources/${created.id}/text`)
      .expect(200);
    expect(text.body.text).toBe(content);

    const download = await request(context.app)
      .get(`/api/research/${research.id}/sources/${created.id}/download`)
      .expect(200);
    expect(download.headers['content-disposition']).toContain('meu-documento.txt');
    expect(download.text).toBe(content);

    const list = await request(context.app)
      .get(`/api/research/${research.id}/sources?status=approved`)
      .expect(200);
    expect(list.body).toHaveLength(1);
  });

  it('impede documento duplicado pelo conteúdo, mesmo com outro nome', async () => {
    const research = await createResearch(context.app);
    await uploadText(context.app, research.id, 'original.txt', 'Conteúdo idêntico.');
    const duplicate = await request(context.app)
      .post(`/api/research/${research.id}/sources/file`)
      .attach('file', Buffer.from('Conteúdo idêntico.', 'utf8'), {
        filename: 'copia.txt',
        contentType: 'text/plain',
      });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('CONFLICT');
    expect(duplicate.body.error.message).toContain('original');

    const list = await request(context.app)
      .get(`/api/research/${research.id}/sources`)
      .expect(200);
    expect(list.body).toHaveLength(1);
  });

  it('rejeita formato não suportado e documento sem texto', async () => {
    const research = await createResearch(context.app);

    const unsupported = await request(context.app)
      .post(`/api/research/${research.id}/sources/file`)
      .attach('file', Buffer.from('conteúdo'), {
        filename: 'arquivo.exe',
        contentType: 'application/octet-stream',
      });
    expect(unsupported.status).toBe(422);
    expect(unsupported.body.error.code).toBe('VALIDATION_ERROR');

    const empty = await request(context.app)
      .post(`/api/research/${research.id}/sources/file`)
      .attach('file', Buffer.from('   \n\n  '), {
        filename: 'vazio.txt',
        contentType: 'text/plain',
      });
    expect(empty.status).toBe(422);
    expect(empty.body.error.message).toContain('OCR');
  });

  it('remove uma fonte e seus arquivos associados', async () => {
    const research = await createResearch(context.app);
    const source = await uploadText(context.app, research.id, 'remover.txt', 'Conteúdo a remover.');

    await request(context.app)
      .delete(`/api/research/${research.id}/sources/${source.id}`)
      .expect(204);

    const list = await request(context.app)
      .get(`/api/research/${research.id}/sources`)
      .expect(200);
    expect(list.body).toEqual([]);

    await request(context.app)
      .get(`/api/research/${research.id}/sources/${source.id}/text`)
      .expect(404);

    await request(context.app)
      .get(`/api/research/${research.id}/sources/${source.id}/download`)
      .expect(404);
  });

  it('aprova e rejeita fontes pendentes, preservando as regras de estado', async () => {
    const research = await createResearch(context.app);
    const pending = await seedSource(research, { title: 'Fonte pendente' });

    const approved = await request(context.app)
      .post(`/api/research/${research.id}/sources/${pending.id}/approve`)
      .expect(200);
    expect(approved.body.status).toBe('approved');
    expect(approved.body.hasText).toBe(true);

    const rejectApproved = await request(context.app)
      .post(`/api/research/${research.id}/sources/${pending.id}/reject`);
    expect(rejectApproved.status).toBe(422);

    const second = await seedSource(research, { title: 'Outra pendente' });
    const rejected = await request(context.app)
      .post(`/api/research/${research.id}/sources/${second.id}/reject`)
      .expect(200);
    expect(rejected.body.status).toBe('rejected');
    expect(rejected.body.hasText).toBe(false);

    const approveRejected = await request(context.app)
      .post(`/api/research/${research.id}/sources/${second.id}/approve`);
    expect(approveRejected.status).toBe(422);

    const text = await request(context.app)
      .get(`/api/research/${research.id}/sources/${second.id}/text`);
    expect(text.status).toBe(403);
    expect(text.body.error.code).toBe('SOURCE_NOT_APPROVED');
  });

  it('detecta URLs duplicadas sem acessar a rede', async () => {
    const research = await createResearch(context.app);
    await seedSource(research, {
      title: 'Artigo existente',
      status: 'approved',
      url: 'https://www.example.org/artigo/?utm_source=newsletter',
      domain: 'www.example.org',
      textFile: undefined,
    });

    const duplicate = await request(context.app)
      .post(`/api/research/${research.id}/sources/url`)
      .send({ url: 'https://example.org/artigo' });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.message).toContain('Artigo existente');

    const list = await request(context.app)
      .get(`/api/research/${research.id}/sources`)
      .expect(200);
    expect(list.body).toHaveLength(1);
  });

  it('bloqueia URLs privadas e inválidas antes de qualquer acesso', async () => {
    const research = await createResearch(context.app);

    const privateUrl = await request(context.app)
      .post(`/api/research/${research.id}/sources/url`)
      .send({ url: 'http://127.0.0.1:4317/api/health' });
    expect(privateUrl.status).toBe(422);
    expect(privateUrl.body.error.code).toBe('PRIVATE_URL');

    const localhost = await request(context.app)
      .post(`/api/research/${research.id}/sources/preview-url`)
      .send({ url: 'http://localhost:8080/segredo' });
    expect(localhost.status).toBe(422);
    expect(localhost.body.error.code).toBe('PRIVATE_URL');

    const invalid = await request(context.app)
      .post(`/api/research/${research.id}/sources/url`)
      .send({ url: 'não é uma url' });
    expect(invalid.status).toBe(422);
    expect(invalid.body.error.code).toBe('INVALID_URL');
  });

  it('exige configuração válida da busca e consulta com pelo menos dois caracteres', async () => {
    const research = await createResearch(context.app);

    const short = await request(context.app)
      .post(`/api/research/${research.id}/sources/search`)
      .send({ query: 'a' });
    expect(short.status).toBe(422);

    await request(context.app)
      .put('/api/settings')
      .send({ search: { provider: 'searxng', searxngUrl: '' } })
      .expect(200);

    const unconfigured = await request(context.app)
      .post(`/api/research/${research.id}/sources/search`)
      .send({ query: 'filosofia' });
    expect(unconfigured.status).toBe(422);
    expect(unconfigured.body.error.code).toBe('SEARCH_NOT_CONFIGURED');
  });

  it('não acessa fontes de outra pesquisa', async () => {
    const researchA = await createResearch(context.app, 'A');
    const researchB = await createResearch(context.app, 'B');
    const source = await uploadText(context.app, researchA.id, 'a.txt', 'Somente A.');

    await request(context.app)
      .get(`/api/research/${researchB.id}/sources/${source.id}/text`)
      .expect(404);

    await request(context.app)
      .delete(`/api/research/${researchB.id}/sources/${source.id}`)
      .expect(404);

    const kept: Source[] = (
      await request(context.app).get(`/api/research/${researchA.id}/sources`).expect(200)
    ).body;
    expect(kept).toHaveLength(1);
  });
});
