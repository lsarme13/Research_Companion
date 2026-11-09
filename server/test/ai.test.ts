import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
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

describe('assistência de IA em modo demonstração', () => {
  it('usa apenas fontes aprovadas no contexto', async () => {
    const research = await createResearch(context.app);
    const approved = await uploadText(
      context.app,
      research.id,
      'aprovado.txt',
      'O determinismo sustenta que todos os eventos são causados por estados anteriores.',
    );
    const pending = await seedSource(context.repo, research.id, {
      title: 'Fonte pendente',
      status: 'pending',
      excerpt: 'Esta fonte pendente não deve participar da resposta.',
    });

    const response = await request(context.app)
      .post(`/api/research/${research.id}/ai/ask`)
      .send({ question: 'O que o determinismo sustenta?' })
      .expect(200);

    expect(response.body.demo).toBe(true);
    expect(response.body.provider).toBe('demo');
    const contextIds = (response.body.contextSources as Array<{ sourceId: string }>).map(
      (source) => source.sourceId,
    );
    expect(contextIds).toContain(approved.id);
    expect(contextIds).not.toContain(pending.id);
  });

  it('rejeita escopo com fonte pendente e aceita escopo com fonte aprovada', async () => {
    const research = await createResearch(context.app);
    const approved = await uploadText(
      context.app,
      research.id,
      'aprovado.txt',
      'Conteúdo aprovado sobre liberdade e responsabilidade.',
    );
    const pending = await seedSource(context.repo, research.id, {
      title: 'Pendente',
      status: 'pending',
    });

    const invalidScope = await request(context.app)
      .post(`/api/research/${research.id}/ai/ask`)
      .send({ question: 'Qual é o argumento?', sourceIds: [pending.id] });
    expect(invalidScope.status).toBe(422);
    expect(invalidScope.body.error.code).toBe('NO_APPROVED_SOURCES');

    const validScope = await request(context.app)
      .post(`/api/research/${research.id}/ai/ask`)
      .send({ question: 'Qual é o argumento?', sourceIds: [approved.id] })
      .expect(200);
    const contextIds = (validScope.body.contextSources as Array<{ sourceId: string }>).map(
      (source) => source.sourceId,
    );
    expect(contextIds).toEqual([approved.id]);
  });

  it('informa quando não há fontes aprovadas', async () => {
    const research = await createResearch(context.app);
    const response = await request(context.app)
      .post(`/api/research/${research.id}/ai/ask`)
      .send({ question: 'O que dizem as fontes?' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('NO_APPROVED_SOURCES');
    expect(response.body.error.message).toContain('Aprove pelo menos uma fonte');
  });

  it('valida o tamanho da pergunta', async () => {
    const research = await createResearch(context.app);
    const short = await request(context.app)
      .post(`/api/research/${research.id}/ai/ask`)
      .send({ question: 'oi' });
    expect(short.status).toBe(422);

    const long = await request(context.app)
      .post(`/api/research/${research.id}/ai/ask`)
      .send({ question: 'a'.repeat(2001) });
    expect(long.status).toBe(422);
    expect(long.body.error.message).toContain('2.000');
  });

  it('analisa um trecho aprovado e recusa fontes pendentes', async () => {
    const research = await createResearch(context.app);
    const approved = await uploadText(
      context.app,
      research.id,
      'texto.txt',
      'A liberdade exige responsabilidade. O agente responde por seus atos.',
    );
    const pending = await seedSource(context.repo, research.id, {
      title: 'Pendente',
      status: 'pending',
    });

    const analysis = await request(context.app)
      .post(`/api/research/${research.id}/ai/reading`)
      .send({
        sourceId: approved.id,
        action: 'explain',
        selection: 'A liberdade exige responsabilidade.',
        depth: 'simples',
      })
      .expect(200);
    expect(analysis.body.demo).toBe(true);
    expect(analysis.body.answer).toContain('Modo demonstração');
    expect(analysis.body.answer).toContain('A liberdade exige responsabilidade.');

    const blocked = await request(context.app)
      .post(`/api/research/${research.id}/ai/reading`)
      .send({ sourceId: pending.id, action: 'simplify' });
    expect(blocked.status).toBe(422);
    expect(blocked.body.error.code).toBe('SOURCE_NOT_READABLE');
  });

  it('avalia apenas fontes aprovadas e mantém a decisão com o pesquisador', async () => {
    const research = await createResearch(context.app);
    const approved = await uploadText(
      context.app,
      research.id,
      'artigo.txt',
      'Artigo de teste com autoria e referências.',
    );

    const evaluation = await request(context.app)
      .post(`/api/research/${research.id}/ai/evaluate-source`)
      .send({ sourceId: approved.id })
      .expect(200);
    expect(evaluation.body.demo).toBe(true);
    expect(evaluation.body.sourceId).toBe(approved.id);
    expect(evaluation.body.answer).toContain('decisão de aprovar ou rejeitar');
    expect(evaluation.body.answer).toContain('Checklist');

    const pending = await seedSource(context.repo, research.id, {
      title: 'Pendente',
      status: 'pending',
    });
    const blocked = await request(context.app)
      .post(`/api/research/${research.id}/ai/evaluate-source`)
      .send({ sourceId: pending.id });
    expect(blocked.status).toBe(422);
    expect(blocked.body.error.code).toBe('SOURCE_NOT_READABLE');
  });

  it('testa o provedor de demonstração sem chamada externa', async () => {
    const response = await request(context.app).post('/api/ai/test').expect(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.provider).toBe('demo');
    expect(response.body.latencyMs).toBe(0);
  });

  it('não mistura contexto de outra pesquisa', async () => {
    const researchA = await createResearch(context.app, 'A');
    const researchB = await createResearch(context.app, 'B');
    await uploadText(context.app, researchA.id, 'a.txt', 'Conteúdo exclusivo de A.');

    const response = await request(context.app)
      .post(`/api/research/${researchB.id}/ai/ask`)
      .send({ question: 'Do que trata o material?' });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('NO_APPROVED_SOURCES');
  });
});
