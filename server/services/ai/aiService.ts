import type {
  AiAnswer,
  AiTestResult,
  ReadingDepth,
  ReadingRequest,
  SourceEvaluation,
} from '../../../shared/types.js';
import { MAX_AI_CONTEXT_CHARS } from '../../config.js';
import { HttpError, validationError } from '../../errors.js';
import type { Repository } from '../../storage/repository.js';
import type { AppSettings, StoredSource } from '../../storage/types.js';
import { truncate } from '../../utils.js';
import { recordActivity } from '../activity.js';
import { getApprovedSourcesWithText, getSourceForAi } from '../sourceService.js';
import { buildGroundedContext, citationsFromAnswer, GroundedContext } from './context.js';
import { demoAsk, demoEvaluation, demoReading } from './demo.js';
import { ChatMessage, CompletionResult, runCompletion } from './providers.js';

const BASE_SYSTEM_PROMPT = `Você é o Research Companion, um assistente de investigação intelectual para pesquisadores independentes e estudantes autodidatas.

Regras obrigatórias:
1. Responda em português do Brasil, com clareza e sem adornos desnecessários.
2. Baseie afirmações factuais exclusivamente nos trechos de fontes aprovadas fornecidos.
3. Cite as fontes com marcadores no formato [F1], [F2], sempre que usar uma informação de uma fonte.
4. Nunca invente citações, referências, dados ou trechos que não estejam no material fornecido.
5. Se as fontes não sustentarem uma resposta, diga explicitamente o que falta e o que não pode ser concluído.
6. Diferencie information documentada nas fontes de interpretações ou inferências suas.
7. O contexto declarado pelo pesquisador serve para orientar a resposta, mas não é evidência documental.
8. Não apresente uma única fonte como definitiva quando houver divergência entre fontes.
9. Seja conciso, mas preserve as justificativas necessárias.`;

function demoResult(answer: string): AiAnswer {
  return {
    answer,
    provider: 'demo',
    model: 'demonstração',
    demo: true,
    references: [],
    contextSources: [],
  };
}

function researchContextBlock(settings: {
  title: string;
  description: string;
  initialContext: string;
  questions: string[];
}): string {
  const parts = [`Título: ${settings.title}`];
  if (settings.description) parts.push(`Descrição: ${settings.description}`);
  if (settings.questions.length) parts.push(`Perguntas de investigação: ${settings.questions.join(' | ')}`);
  if (settings.initialContext) {
    parts.push(`Instruções/contexto declarados pelo pesquisador (não são evidência):\n${settings.initialContext}`);
  }
  return truncate(parts.join('\n'), 6000);
}

export async function askQuestion(
  repo: Repository,
  settings: AppSettings,
  researchId: string,
  input: { question: string; sourceIds?: string[] },
): Promise<AiAnswer> {
  const question = input.question.trim();
  if (question.length < 3) {
    throw validationError('Escreva uma pergunta para investigar.');
  }
  if (question.length > 2000) {
    throw validationError('A pergunta excede o limite de 2.000 caracteres.');
  }

  const record = await repo.getResearchRecord(researchId);
  const sources = await getApprovedSourcesWithText(repo, researchId, {
    sourceIds: input.sourceIds,
  });
  if (!sources.length) {
    throw new HttpError(
      422,
      'NO_APPROVED_SOURCES',
      input.sourceIds?.length
        ? 'Nenhuma das fontes selecionadas está aprovada e possui texto disponível.'
        : 'Não há fontes aprovadas com texto nesta pesquisa. Aprove pelo menos uma fonte para fazer perguntas fundamentadas.',
    );
  }

  const context = buildGroundedContext(sources, question, MAX_AI_CONTEXT_CHARS);
  if (!context.contextSources.length) {
    throw new HttpError(422, 'EMPTY_CONTEXT', 'Não foi possível preparar o contexto das fontes.');
  }

  if (settings.ai.provider === 'demo') {
    await recordActivity(
      repo,
      researchId,
      'ai.asked',
      `Pergunta registrada em modo demonstração: “${truncate(question, 140)}”`,
      { question },
    );
    return {
      ...demoResult(
        demoAsk(
          question,
          context.contextSources.map((source) => source.title),
          context.text.split('\n\n---\n\n').slice(0, 3),
        ),
      ),
      contextSources: context.contextSources,
    };
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: BASE_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `CONTEXTO DA PESQUISA:\n${researchContextBlock(record)}\n\nFONTES APROVADAS PARA ESTA RESPOSTA:\n\n${context.text}\n\nPERGUNTA DO PESQUISADOR:\n${question}\n\nResponda à pergunta com base nas fontes acima. Cite as fontes usando [F1], [F2] etc.`,
    },
  ];

  const completion = await runCompletion(settings, messages);
  const references = citationsFromAnswer(completion.content, context.contextSources);

  await recordActivity(
    repo,
    researchId,
    'ai.asked',
    `Pergunta à IA: “${truncate(question, 140)}”`,
    { question, provider: completion.provider },
  );

  return {
    answer: completion.content,
    provider: completion.provider,
    model: completion.model,
    demo: false,
    references,
    contextSources: context.contextSources,
  };
}

const READING_INSTRUCTIONS: Record<
  Exclude<ReadingRequest['action'], 'custom'>,
  (depth: ReadingDepth | undefined) => string
> = {
  explain: (depth) =>
    `Explique o trecho selecionado em nível ${depth || 'intermediário'}. Comece pela ideia central, depois explique os termos e relações importantes. Se houver ambiguidade, aponte-a. Não acrescente informações externas ao documento.`,
  simplify: () =>
    `Reescreva o trecho selecionado em linguagem mais simples, preservando rigorosamente o significado, as ressalvas e as relações entre as ideias. Não acrescente informações que não estejam no texto.`,
  arguments: () =>
    `Identifique a tese central, os argumentos apresentados e as evidências ou exemplos usados para sustentá-los. Distinga o que é afirmação do autor do que é interpretação sua.`,
  assumptions: () =>
    `Identifique pressupostos implícitos, limitações argumentativas e possíveis objeções ao trecho selecionado. Não trate os pressupostos como erros automaticamente; explique por que importam.`,
  questions: () =>
    `Identifique conceitos que mereçam investigação adicional e formule perguntas abertas que ajudem o pesquisador a aprofundar a leitura. Não responda às perguntas ainda.`,
};

function readingPrompt(input: ReadingRequest, source: StoredSource, content: string): string {
  const actionLine =
    input.action === 'custom'
      ? `PERGUNTA DO PESQUISADOR:\n${(input.question || '').trim()}`
      : `TAREFA:\n${READING_INSTRUCTIONS[input.action](input.depth)}`;

  return `DOCUMENTO:\nTítulo: ${source.title}${source.authors ? `\nAutoria: ${source.authors}` : ''}${source.publication ? `\nPublicação: ${source.publication}` : ''}${source.publishedAt ? `\nData: ${new Date(source.publishedAt).toLocaleDateString('pt-BR')}` : ''}\n\n${content}\n\n${actionLine}\n\nBaseie-se exclusivamente no documento e no trecho fornecidos. Use [F1] para indicar a fonte quando fizer uma afirmação baseada no texto. Se o material não permitir responder, diga o que falta.`;
}

export async function analyzeReading(
  repo: Repository,
  settings: AppSettings,
  researchId: string,
  input: ReadingRequest,
): Promise<AiAnswer> {
  await repo.getResearchRecord(researchId);
  const sourceData = await getSourceForAi(repo, researchId, input.sourceId);
  if (!sourceData) {
    throw new HttpError(
      422,
      'SOURCE_NOT_READABLE',
      'A fonte selecionada não está aprovada ou não possui texto disponível para leitura.',
    );
  }
  const { source, text } = sourceData;

  const rawSelection = (input.selection || '').trim();
  let content = rawSelection;
  let context: GroundedContext;

  if (!content) {
    if (input.action === 'custom' && input.question?.trim()) {
      context = buildGroundedContext([{ source, text }], input.question, 20_000);
      content = context.text;
    } else {
      content = truncate(text, 16_000);
      context = {
        text: content,
        contextSources: [{ label: 'F1', sourceId: source.id, title: source.title, url: source.url }],
      };
    }
  } else {
    content = truncate(content, 20_000);
    context = {
      text: content,
      contextSources: [{ label: 'F1', sourceId: source.id, title: source.title, url: source.url }],
    };
  }

  if (input.action === 'custom' && !(input.question || '').trim()) {
    throw validationError('Escreva a pergunta sobre o documento.');
  }

  if (settings.ai.provider === 'demo') {
    const answer = demoReading(
      input.action,
      input.depth,
      source.title,
      rawSelection || content,
    );
    await recordActivity(
      repo,
      researchId,
      'ai.analyzed',
      `Análise em modo demonstração no documento “${source.title}”.`,
      { sourceId: source.id, action: input.action },
    );
    return { ...demoResult(answer), contextSources: context.contextSources };
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: BASE_SYSTEM_PROMPT },
    { role: 'user', content: readingPrompt(input, source, content) },
  ];
  const completion = await runCompletion(settings, messages);
  const references = citationsFromAnswer(completion.content, context.contextSources);

  await recordActivity(
    repo,
    researchId,
    'ai.analyzed',
    `Análise de leitura em “${source.title}” (${input.action}).`,
    { sourceId: source.id, action: input.action, provider: completion.provider },
  );

  return {
    answer: completion.content,
    provider: completion.provider,
    model: completion.model,
    demo: false,
    references,
    contextSources: context.contextSources,
  };
}

export async function evaluateSource(
  repo: Repository,
  settings: AppSettings,
  researchId: string,
  sourceId: string,
): Promise<SourceEvaluation> {
  await repo.getResearchRecord(researchId);
  const sourceData = await getSourceForAi(repo, researchId, sourceId);
  if (!sourceData) {
    throw new HttpError(
      422,
      'SOURCE_NOT_READABLE',
      'A fonte precisa estar aprovada e possuir texto para ser avaliada.',
    );
  }
  const { source, text } = sourceData;

  if (settings.ai.provider === 'demo') {
    await recordActivity(
      repo,
      researchId,
      'source.evaluated',
      `Checklist de avaliação aberto para “${source.title}” (modo demonstração).`,
      { sourceId },
    );
    return {
      answer: demoEvaluation(source.title, source),
      provider: 'demo',
      model: 'demonstração',
      demo: true,
      sourceId,
      sourceTitle: source.title,
    };
  }

  const metadata = [
    `Título: ${source.title}`,
    source.authors ? `Autoria: ${source.authors}` : 'Autoria: não identificada',
    source.publication ? `Publicação: ${source.publication}` : 'Publicação: não identificada',
    source.publishedAt
      ? `Data: ${new Date(source.publishedAt).toLocaleDateString('pt-BR')}`
      : 'Data: não identificada',
    source.url ? `URL: ${source.url}` : 'Origem: arquivo local',
    source.domain ? `Domínio: ${source.domain}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const messages: ChatMessage[] = [
    { role: 'system', content: BASE_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Avalie orientativamente a fonte abaixo para ajudar o pesquisador a decidir se deve aprová-la. Não atribua nota, selo ou classificação automática de confiabilidade. Examine: autoria e instituição, data, referências, metodologia ou linha argumentativa, consistência interna e relevância para uma pesquisa acadêmica. Indique elementos a favor e pontos de atenção, e explicite as limitações da avaliação quando faltarem dados.\n\nMETADADOS:\n${metadata}\n\nCONTEÚDO (trecho inicial):\n${truncate(text, 14_000)}\n\nResponda em seções curtas: “Elementos disponíveis”, “Pontos a favor”, “Pontos de atenção”, “Limitações desta avaliação”. A decisão final é do pesquisador.`,
    },
  ];
  const completion = await runCompletion(settings, messages);

  await recordActivity(
    repo,
    researchId,
    'source.evaluated',
    `Avaliação orientativa solicitada para “${source.title}”.`,
    { sourceId, provider: completion.provider },
  );

  return {
    answer: completion.content,
    provider: completion.provider,
    model: completion.model,
    demo: false,
    sourceId,
    sourceTitle: source.title,
  };
}

export async function testProvider(settings: AppSettings): Promise<AiTestResult> {
  if (settings.ai.provider === 'demo') {
    return {
      ok: true,
      provider: 'demo',
      model: 'demonstração',
      latencyMs: 0,
      message: 'Modo demonstração ativo. Nenhuma chamada externa será realizada.',
    };
  }
  const started = Date.now();
  const result: CompletionResult = await runCompletion(settings, [
    { role: 'user', content: 'Responda apenas com a palavra OK.' },
  ]);
  return {
    ok: true,
    provider: result.provider,
    model: result.model,
    latencyMs: Date.now() - started,
    message: `Conexão bem-sucedida. Resposta do modelo: ${truncate(result.content, 80)}`,
  };
}

