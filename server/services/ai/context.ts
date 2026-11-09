import type { AiReference } from '../../../shared/types.js';
import type { StoredSource } from '../../storage/types.js';

const STOPWORDS = new Set(
  `a ao aos aquela aquelas aquele aqueles aquilo as até com como da das de dela delas dele deles depois do dos e ela elas ele eles em entre era eram essa essas esse esses esta estas este estes eu foi for foram há isso isto já lhe lhes mais mas me mesmo meu meus minha minhas muito na nas não no nos nós o os ou para pela pelas pelo pelos por qual quais que quem se sem seu seus sua suas também te tem tendo ter teu teus tua tuas um uma umas uns você vocês e é são ser sobre suas quaisquer onde quando como porquê porque`.split(
    /\s+/,
  ),
);

export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function tokenize(value: string): string[] {
  return normalizeForSearch(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function splitLongParagraph(paragraph: string, maxChars: number): string[] {
  if (paragraph.length <= maxChars) return [paragraph];
  const sentences = paragraph.split(/(?<=[.!?])\s+/);
  const units: string[] = [];
  let buffer = '';
  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      if (buffer) {
        units.push(buffer);
        buffer = '';
      }
      const words = sentence.split(/\s+/);
      let piece = '';
      for (const word of words) {
        if (`${piece} ${word}`.trim().length > maxChars) {
          if (piece) units.push(piece);
          piece = word;
        } else {
          piece = `${piece} ${word}`.trim();
        }
      }
      if (piece) units.push(piece);
      continue;
    }
    if (`${buffer}\n${sentence}`.trim().length > maxChars) {
      if (buffer) units.push(buffer);
      buffer = sentence;
    } else {
      buffer = `${buffer}\n${sentence}`.trim();
    }
  }
  if (buffer) units.push(buffer);
  return units;
}

export function splitIntoChunks(text: string, maxChars = 1700): string[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const units = paragraphs.flatMap((paragraph) => splitLongParagraph(paragraph, maxChars));
  const chunks: string[] = [];
  let buffer = '';
  for (const unit of units) {
    if (`${buffer}\n\n${unit}`.trim().length > maxChars && buffer) {
      chunks.push(buffer);
      buffer = unit;
    } else {
      buffer = `${buffer}\n\n${unit}`.trim();
    }
  }
  if (buffer) chunks.push(buffer);
  return chunks.length ? chunks : [text];
}

function scoreChunk(chunk: string, tokens: string[], fullQuery: string): number {
  if (!tokens.length) return 0;
  const words = normalizeForSearch(chunk).split(/[^a-z0-9]+/);
  const counts = new Map<string, number>();
  for (const word of words) {
    if (word.length < 3) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }
  let score = 0;
  for (const token of new Set(tokens)) {
    score += counts.get(token) || 0;
  }
  const normalized = normalizeForSearch(chunk);
  if (fullQuery.trim().length >= 4 && normalized.includes(normalizeForSearch(fullQuery.trim()))) {
    score += 5;
  }
  return score / Math.sqrt(Math.max(1, words.length / 100));
}

interface ChunkCandidate {
  source: StoredSource;
  text: string;
  index: number;
  score: number;
}

export interface GroundedContextInput {
  source: StoredSource;
  text: string;
}

export interface GroundedContext {
  text: string;
  contextSources: AiReference[];
}

export function buildGroundedContext(
  inputs: GroundedContextInput[],
  query: string,
  maxChars: number,
): GroundedContext {
  const tokens = tokenize(query);
  const perSource: Array<{ source: StoredSource; chunks: ChunkCandidate[]; best: number }> = inputs.map(
    ({ source, text }) => {
      const chunks = splitIntoChunks(text).map((chunk, index) => ({
        source,
        text: chunk,
        index,
        score: scoreChunk(chunk, tokens, query),
      }));
      const best = chunks.reduce((max, chunk) => Math.max(max, chunk.score), 0);
      return { source, chunks, best };
    },
  );

  const ranked = perSource
    .filter((item) => item.chunks.length > 0)
    .sort((a, b) => b.best - a.best || a.source.addedAt.localeCompare(b.source.addedAt))
    .slice(0, 12);

  const selected: ChunkCandidate[] = [];
  let usedChars = 0;
  const addChunk = (chunk: ChunkCandidate): boolean => {
    if (usedChars + chunk.text.length > maxChars) return false;
    selected.push(chunk);
    usedChars += chunk.text.length;
    return true;
  };

  // Primeiro, garante um trecho do maior número possível de fontes relevantes.
  for (const item of ranked) {
    const bestChunk = [...item.chunks].sort((a, b) => b.score - a.score || a.index - b.index)[0];
    if (bestChunk) addChunk(bestChunk);
    if (usedChars >= maxChars * 0.85) break;
  }

  // Depois, complementa com trechos adicionais, limitando dois por fonte.
  for (const item of ranked) {
    const ownCount = selected.filter((chunk) => chunk.source.id === item.source.id).length;
    if (ownCount >= 2) continue;
    const remaining = 2 - ownCount;
    const extras = [...item.chunks]
      .filter((chunk) => !selected.some((picked) => picked.source.id === chunk.source.id && picked.index === chunk.index))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, remaining);
    for (const extra of extras) {
      if (!addChunk(extra)) break;
    }
    if (usedChars >= maxChars) break;
  }

  const bySource = new Map<string, { source: StoredSource; chunks: ChunkCandidate[] }>();
  for (const chunk of selected) {
    const entry = bySource.get(chunk.source.id) || { source: chunk.source, chunks: [] };
    entry.chunks.push(chunk);
    bySource.set(chunk.source.id, entry);
  }

  const contextSources: AiReference[] = [];
  const blocks: string[] = [];
  let index = 0;
  for (const entry of bySource.values()) {
    index += 1;
    const label = `F${index}`;
    contextSources.push({
      label,
      sourceId: entry.source.id,
      title: entry.source.title,
      url: entry.source.url,
      locator: entry.chunks.map((chunk) => `trecho ${chunk.index + 1}`).join(', '),
    });
    const metadata = [
      entry.source.authors ? `Autoria: ${entry.source.authors}` : null,
      entry.source.publication ? `Publicação: ${entry.source.publication}` : null,
      entry.source.publishedAt
        ? `Data: ${new Date(entry.source.publishedAt).toLocaleDateString('pt-BR')}`
        : null,
      entry.source.url ? `URL: ${entry.source.url}` : null,
    ]
      .filter(Boolean)
      .join(' | ');
    const excerpts = entry.chunks
      .sort((a, b) => a.index - b.index)
      .map((chunk, chunkIndex) => `Trecho ${chunkIndex + 1}:\n“${chunk.text}”`)
      .join('\n\n');
    blocks.push(`[${label}] ${entry.source.title}${metadata ? `\n${metadata}` : ''}\n\n${excerpts}`);
  }

  return {
    text: blocks.join('\n\n---\n\n'),
    contextSources,
  };
}

export function citationsFromAnswer(answer: string, available: AiReference[]): AiReference[] {
  const references: AiReference[] = [];
  const seen = new Set<string>();
  const bracketMatches = answer.matchAll(/\[([^\]]*F\d+[^\]]*)\]/g);
  for (const match of bracketMatches) {
    const labels = match[1].matchAll(/F(\d+)/g);
    for (const labelMatch of labels) {
      const label = `F${labelMatch[1]}`;
      if (seen.has(label)) continue;
      const reference = available.find((item) => item.label === label);
      if (reference) {
        references.push(reference);
        seen.add(label);
      }
    }
  }
  return references;
}
