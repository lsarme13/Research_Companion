import type { Note, Research } from '../../shared/types.js';
import type { Repository } from '../storage/repository.js';
import { slugify } from '../utils.js';

export interface ResearchExport {
  exportedAt: string;
  research: Research;
  sources: Array<{
    id: string;
    title: string;
    kind: string;
    status: string;
    url?: string;
    domain?: string;
    authors?: string;
    publication?: string;
    publishedAt?: string;
    category?: string;
    tags: string[];
    addedAt: string;
    text?: string;
  }>;
  notes: Note[];
  activity: Awaited<ReturnType<Repository['getActivity']>>;
}

export async function exportResearchJson(
  repo: Repository,
  researchId: string,
): Promise<ResearchExport> {
  const research = await repo.getResearchRecord(researchId);
  const [sources, notes, activity] = await Promise.all([
    repo.getSources(researchId),
    repo.getNotes(researchId),
    repo.getActivity(researchId),
  ]);
  const exportedSources = [];
  for (const source of sources) {
    exportedSources.push({
      id: source.id,
      title: source.title,
      kind: source.kind,
      status: source.status,
      url: source.url,
      domain: source.domain,
      authors: source.authors,
      publication: source.publication,
      publishedAt: source.publishedAt,
      category: source.category,
      tags: source.tags,
      addedAt: source.addedAt,
      text: source.status === 'approved' ? (await repo.getSourceText(researchId, source)) || undefined : undefined,
    });
  }
  return {
    exportedAt: new Date().toISOString(),
    research,
    sources: exportedSources,
    notes,
    activity,
  };
}

export async function exportResearchMarkdown(
  repo: Repository,
  researchId: string,
): Promise<{ markdown: string; fileName: string }> {
  const research = await repo.getResearchRecord(researchId);
  const [sources, notes] = await Promise.all([
    repo.getSources(researchId),
    repo.getNotes(researchId),
  ]);

  const approved = sources.filter((source) => source.status === 'approved');
  const pending = sources.filter((source) => source.status === 'pending');
  const rejected = sources.filter((source) => source.status === 'rejected');

  const lines: string[] = [
    `# ${research.title}`,
    '',
    research.description ? `> ${research.description}` : '',
    '',
    `- **Status:** ${research.status === 'active' ? 'ativa' : 'arquivada'}`,
    `- **Criada em:** ${formatDate(research.createdAt)}`,
    `- **Última atividade:** ${formatDate(research.lastActivityAt)}`,
    '',
  ];

  if (research.questions.length) {
    lines.push('## Perguntas de investigação', '');
    for (const question of research.questions) lines.push(`- ${question}`);
    lines.push('');
  }

  if (research.initialContext) {
    lines.push('## Contexto e instruções iniciais', '', research.initialContext, '');
  }

  lines.push('## Fontes aprovadas', '');
  if (approved.length) {
    lines.push('| Título | Origem | Autoria | Data |', '| --- | --- | --- | --- |');
    for (const source of approved) {
      lines.push(
        `| ${escapeTable(source.title)} | ${escapeTable(source.url || source.originalFileName || 'arquivo local')} | ${escapeTable(source.authors || '—')} | ${source.publishedAt ? formatDate(source.publishedAt) : '—'} |`,
      );
    }
    lines.push('');
  } else {
    lines.push('Nenhuma fonte aprovada.', '');
  }

  if (pending.length) {
    lines.push('## Fontes pendentes', '');
    for (const source of pending) lines.push(`- ${source.title}${source.url ? ` — ${source.url}` : ''}`);
    lines.push('');
  }

  if (rejected.length) {
    lines.push('## Fontes rejeitadas', '');
    for (const source of rejected) lines.push(`- ${source.title}${source.url ? ` — ${source.url}` : ''}`);
    lines.push('');
  }

  lines.push('## Anotações', '');
  if (notes.length) {
    for (const note of notes) {
      lines.push(`### ${note.title}`, '');
      if (note.quote) {
        lines.push(`> ${note.quote.replace(/\n/g, '\n> ')}`, '');
      }
      if (note.sourceTitle) {
        lines.push(`_Vinculada a: ${note.sourceTitle}_`, '');
      }
      lines.push(note.content || '_Sem conteúdo._', '');
    }
  } else {
    lines.push('Nenhuma anotação registrada.', '');
  }

  lines.push('---', '', `Exportado pelo Research Companion em ${formatDate(new Date().toISOString())}.`);
  return {
    markdown: `${lines.filter((line) => line !== undefined).join('\n').replace(/\n{3,}/g, '\n\n')}\n`,
    fileName: `${slugify(research.title)}-${new Date().toISOString().slice(0, 10)}.md`,
  };
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
