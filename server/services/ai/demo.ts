import type { ReadingAction, ReadingDepth } from '../../../shared/types.js';

export function demoAsk(question: string, titles: string[], excerpts: string[]): string {
  const sourceLines = titles
    .map((title, index) => `- **[F${index + 1}]** ${title}`)
    .join('\n');
  const excerptLines = excerpts
    .slice(0, 3)
    .map((excerpt, index) => `> **F${index + 1}:** ${excerpt.slice(0, 420)}${excerpt.length > 420 ? '…' : ''}`)
    .join('\n>\n');
  return [
    '> **Modo demonstração.** Nenhum modelo de IA está configurado. Esta resposta não foi gerada por um modelo e não deve ser tratada como análise fundamentada.',
    '',
    `A pergunta registrada foi: **“${question}”**.`,
    '',
    'As fontes aprovadas que seriam usadas como contexto são:',
    sourceLines || '- Nenhuma fonte aprovada com texto.',
    '',
    ...(excerptLines ? ['Trechos que entrariam no contexto:', '', excerptLines, ''] : []),
    'Para obter uma resposta real, fundamentada e com citações, configure o Ollama ou um endpoint compatível com OpenAI em **Configurações → Inteligência artificial**.',
  ].join('\n');
}

const ACTION_LABEL: Record<Exclude<ReadingAction, 'custom'>, string> = {
  explain: 'explicação do trecho',
  simplify: 'simplificação do trecho',
  arguments: 'identificação de argumentos e teses',
  assumptions: 'identificação de pressupostos e limitações',
  questions: 'levantamento de conceitos e questões',
};

export function demoReading(
  action: ReadingAction,
  depth: ReadingDepth | undefined,
  sourceTitle: string,
  selection: string,
): string {
  const label = action === 'custom' ? 'pergunta sobre o documento' : ACTION_LABEL[action];
  return [
    '> **Modo demonstração.** Nenhum modelo de IA está configurado. A análise abaixo é um espaço de verificação do fluxo, não uma interpretação real do texto.',
    '',
    `**Tarefa solicitada:** ${label}${action === 'explain' ? ` (nível: ${depth || 'intermediário'})` : ''}.`,
    `**Documento:** ${sourceTitle}.`,
    `**Trecho considerado:** ${selection.length.toLocaleString('pt-BR')} caracteres.`,
    '',
    'Em uma execução real, a IA receberia exclusivamente o trecho selecionado e o contexto do documento, responderia em português e distinguiria o que está documentado de suas próprias interpretações.',
    '',
    '> Trecho inicial:',
    `> ${selection.slice(0, 500).replace(/\n+/g, ' ')}${selection.length > 500 ? '…' : ''}`,
    '',
    'Configure um provedor em **Configurações → Inteligência artificial** para obter a análise.',
  ].join('\n');
}

export function demoEvaluation(
  title: string,
  metadata: { authors?: string; publication?: string; publishedAt?: string; url?: string; domain?: string },
): string {
  return [
    '> **Modo demonstração.** Nenhum modelo de IA está configurado. Não há avaliação orientativa gerada.',
    '',
    `**Fonte:** ${title}`,
    '',
    '### Dados disponíveis',
    `- Autoria: ${metadata.authors || 'não identificada'}`,
    `- Publicação: ${metadata.publication || metadata.domain || 'não identificada'}`,
    `- Data: ${metadata.publishedAt ? new Date(metadata.publishedAt).toLocaleDateString('pt-BR') : 'não identificada'}`,
    `- Endereço: ${metadata.url || 'arquivo local'}`,
    '',
    '### Checklist para sua própria avaliação',
    '- A autoria e a instituição são identificáveis?',
    '- A data é adequada ao problema investigado?',
    '- O texto apresenta referências verificáveis?',
    '- O método ou a linha argumentativa está explícito?',
    '- Há conflito de interesses declarado?',
    '- A fonte é relevante para as perguntas desta pesquisa?',
    '',
    'A decisão de aprovar ou rejeitar a fonte é sua. Configure um provedor de IA para receber uma avaliação orientativa baseada no conteúdo da fonte.',
  ].join('\n');
}
