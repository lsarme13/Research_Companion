import path from 'node:path';
import mammoth from 'mammoth';
import { extractText } from 'unpdf';
import { MAX_SOURCE_TEXT_CHARS } from '../config.js';
import { validationError } from '../errors.js';
import { normalizeWhitespace } from '../utils.js';

export const SUPPORTED_EXTENSIONS = ['.pdf', '.txt', '.md', '.docx'] as const;

export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

export interface ExtractedDocument {
  text: string;
  extension: SupportedExtension;
  pageCount?: number;
}

export function detectExtension(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}

export async function extractDocument(
  originalFileName: string,
  buffer: Buffer,
): Promise<ExtractedDocument> {
  const extension = detectExtension(originalFileName) as SupportedExtension;
  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    throw validationError(
      'Formato não suportado. Nesta versão são aceitos arquivos PDF, TXT, MD e DOCX.',
    );
  }

  let text = '';
  let pageCount: number | undefined;

  if (extension === '.pdf') {
    try {
      const result = await extractText(new Uint8Array(buffer), { mergePages: true });
      text = result.text;
      pageCount = result.totalPages;
    } catch (error) {
      throw validationError(
        `Não foi possível extrair texto do PDF. Verifique se o arquivo não está protegido ou corrompido. Detalhe: ${(error as Error).message}`,
      );
    }
  } else if (extension === '.docx') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } catch (error) {
      throw validationError(
        `Não foi possível extrair texto do DOCX. Detalhe: ${(error as Error).message}`,
      );
    }
  } else {
    text = buffer.toString('utf8').replace(/^\uFEFF/, '');
  }

  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    throw validationError(
      'O documento não contém texto extraível. OCR de documentos digitalizados não é suportado nesta versão.',
    );
  }
  if (normalized.length > MAX_SOURCE_TEXT_CHARS) {
    throw validationError('O documento excede o limite de texto suportado nesta versão.');
  }

  return { text: normalized, extension, pageCount };
}
