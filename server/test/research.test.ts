import crypto from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Note, ResearchSummary } from '../../shared/types.js';
import {
  createResearch,
  createTestContext,
  destroyTestContext,
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

describe('pesquisas', () => {
  it('cria, lista e atualiza uma pesquisa', async () => {
    const created = await createResearch(context.app, 'Filosofia da mente');
    expect(created.title).toBe('Filosofia da mente');
    expect(created.status).toBe('active');
    expect(created.lastSection).toBe('documents');

    const updated = await request(context.app)
      .patch(`/api/research/${created.id}`)
      .send({ title: 'Filosofia da mente e consciência', questions: ['O que é consciência?'] })
      .expect(200);
    expect(updated.body.title).toBe('Filosofia da mente e consciência');
    expect(updated.body.questions).toEqual(['O que é consciência?']);

    const list = await request(context.app).get('/api/research').expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].id).toBe(created.id);
  });

  it('rejeita pesquisa sem título', async () => {
    const response = await request(context.app).post('/api/research').send({ title: '   ' });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('arquiva, restaura e exige confirmação para excluir', async () => {
    const created = await createResearch(context.app);

    const archived = await request(context.app)
      .post(`/api/research/${created.id}/archive`)
      .expect(200);
    expect(archived.body.status).toBe('archived');

    const activeList = await request(context.app).get('/api/research').expect(200);
    expect(activeList.body).toHaveLength(0);

    const completeList = await request(context.app)
      .get('/api/research?includeArchived=true')
      .expect(200);
    expect(completeList.body).toHaveLength(1);

    const restored = await request(context.app)
      .post(`/api/research/${created.id}/restore`)
      .expect(200);
    expect(restored.body.status).toBe('active');

    const withoutConfirmation = await request(context.app).delete(`/api/research/${created.id}`);
    expect(withoutConfirmation.status).toBe(400);
    expect(withoutConfirmation.body.error.code).toBe('CONFIRMATION_REQUIRED');

    await request(context.app)
      .delete(`/api/research/${created.id}?confirm=true`)
      .expect(204);

    await request(context.app).get(`/api/research/${created.id}`).expect(404);
  });

  it('mantém fontes, notas e atividades isoladas entre pesquisas', async () => {
    const researchA = await createResearch(context.app, 'Pesquisa A');
    const researchB = await createResearch(context.app, 'Pesquisa B');

    await uploadText(context.app, researchA.id, 'a.txt', 'Conteúdo exclusivo da pesquisa A.');
    await request(context.app)
      .post(`/api/research/${researchA.id}/notes`)
      .send({ title: 'Nota A', content: 'Anotação da pesquisa A.' })
      .expect(201);

    const sourcesB = await request(context.app)
      .get(`/api/research/${researchB.id}/sources`)
      .expect(200);
    expect(sourcesB.body).toEqual([]);

    const notesB = await request(context.app)
      .get(`/api/research/${researchB.id}/notes`)
      .expect(200);
    expect(notesB.body).toEqual([]);

    const activityB = await request(context.app)
      .get(`/api/research/${researchB.id}/activity`)
      .expect(200);
    expect(activityB.body).toHaveLength(1);
    expect(activityB.body[0].type).toBe('research.created');
    expect(activityB.body[0].message).toContain('Pesquisa B');

    await request(context.app)
      .post(`/api/research/${researchB.id}/ai/ask`)
      .send({ question: 'Sobre o que trata o material?' })
      .expect(422);

    const summaryA = await request(context.app).get(`/api/research/${researchA.id}`).expect(200);
    expect(summaryA.body.counts.documents).toBe(1);
    expect(summaryA.body.counts.notes).toBe(1);

    const summaryB = await request(context.app).get(`/api/research/${researchB.id}`).expect(200);
    expect(summaryB.body.counts.documents).toBe(0);
    expect(summaryB.body.counts.notes).toBe(0);
  });

  it('não permite excluir com identificador fora do formato esperado', async () => {
    const response = await request(context.app).delete('/api/research/not-a-uuid?confirm=true');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');

    const weird = await request(context.app).get('/api/research');
    expect(weird.status).toBe(200);
    expect(weird.body).toEqual([]);
  });
});

describe('notas', () => {
  it('cria, lista, atualiza e exclui notas', async () => {
    const research = await createResearch(context.app);
    const source = await uploadText(
      context.app,
      research.id,
      'texto.txt',
      'Trecho citado que sustenta a nota.',
    );

    const created = await request(context.app)
      .post(`/api/research/${research.id}/notes`)
      .send({
        content: 'Primeira linha da nota\n\nDesenvolvimento.',
        sourceId: source.id,
        quote: 'Trecho citado',
      })
      .expect(201);

    expect(created.body.title).toBe('Primeira linha da nota');
    expect(created.body.sourceTitle).toBe(source.title);
    expect(created.body.quote).toBe('Trecho citado');

    const list = await request(context.app)
      .get(`/api/research/${research.id}/notes`)
      .expect(200);
    expect(list.body).toHaveLength(1);
    expect((list.body[0] as Note).id).toBe(created.body.id);

    const updated = await request(context.app)
      .patch(`/api/research/${research.id}/notes/${created.body.id}`)
      .send({ title: 'Título revisado', content: 'Conteúdo revisado.' })
      .expect(200);
    expect(updated.body.title).toBe('Título revisado');
    expect(updated.body.content).toBe('Conteúdo revisado.');
    expect(updated.body.quote).toBe('Trecho citado');

    await request(context.app)
      .delete(`/api/research/${research.id}/notes/${created.body.id}`)
      .expect(204);

    const empty = await request(context.app)
      .get(`/api/research/${research.id}/notes`)
      .expect(200);
    expect(empty.body).toEqual([]);
  });

  it('valida notas vazias e vínculos com fontes inexistentes', async () => {
    const research = await createResearch(context.app);

    const empty = await request(context.app)
      .post(`/api/research/${research.id}/notes`)
      .send({ title: '   ', content: '   ' });
    expect(empty.status).toBe(422);

    const invalidSource = await request(context.app)
      .post(`/api/research/${research.id}/notes`)
      .send({ content: 'Nota', sourceId: crypto.randomUUID() });
    expect(invalidSource.status).toBe(404);
  });

  it('não acessa notas de outra pesquisa', async () => {
    const researchA = await createResearch(context.app, 'A');
    const researchB = await createResearch(context.app, 'B');
    const note = await request(context.app)
      .post(`/api/research/${researchA.id}/notes`)
      .send({ title: 'Nota privada', content: 'Somente A.' })
      .expect(201);

    await request(context.app)
      .patch(`/api/research/${researchB.id}/notes/${note.body.id}`)
      .send({ title: 'Tentativa' })
      .expect(404);

    await request(context.app)
      .delete(`/api/research/${researchB.id}/notes/${note.body.id}`)
      .expect(404);

    const notesA = await request(context.app)
      .get(`/api/research/${researchA.id}/notes`)
      .expect(200);
    expect(notesA.body).toHaveLength(1);
  });
});

describe('atividades e resumo', () => {
  it('registra atividades e contagens após operações', async () => {
    const research: ResearchSummary = await createResearch(context.app);
    await uploadText(context.app, research.id, 'documento.txt', 'Texto de apoio para a pesquisa.');

    const summary = await request(context.app)
      .get(`/api/research/${research.id}`)
      .expect(200);
    expect(summary.body.counts.documents).toBe(1);

    const activity = await request(context.app)
      .get(`/api/research/${research.id}/activity`)
      .expect(200);
    const types = (activity.body as Array<{ type: string }>).map((item) => item.type);
    expect(types).toContain('research.created');
    expect(types).toContain('source.file_added');

    const global = await request(context.app).get('/api/activity').expect(200);
    expect(
      (global.body as Array<{ researchTitle: string }>).some(
        (item) => item.researchTitle === research.title,
      ),
    ).toBe(true);
  });
});
