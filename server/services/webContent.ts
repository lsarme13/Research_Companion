import { load } from 'cheerio';
import mammoth from 'mammoth';
import { extractText } from 'unpdf';
import { MAX_SOURCE_TEXT_CHARS, MAX_URL_BYTES } from '../config.js';
import { HttpError } from '../errors.js';
import { domainFromUrl, normalizeWhitespace, truncate } from '../utils.js';
import { fetchPublicUrl } from './http.js';

export interface WebContent {
  url: string;
  title: string;
  text: string;
  domain: string;
  authors?: string;
  publication?: string;
  publishedAt?: string;
}

export async function fetchWebContent(rawUrl: string): Promise<WebContent> {
  const result = await fetchPublicUrl(rawUrl, { maxBytes: MAX_URL_BYTES });
  const finalUrl = result.finalUrl;
  const domain = domainFromUrl(finalUrl);
  const contentType = result.contentType;

  if (contentType.includes('application/pdf')) {
    const extracted = await extractPdf(result.buffer);
    return {
      url: finalUrl,
      title: titleFromUrl(finalUrl),
      text: extracted,
      domain,
      publication: domain,
    };
  }

  if (contentType.includes('wordprocessingml')) {
    let text = '';
    try {
      const parsed = await mammoth.extractRawText({ buffer: result.buffer });
      text = parsed.value;
    } catch (error) {
      throw new HttpError(
        422,
        'URL_UNSUPPORTED_CONTENT',
        `Não foi possível extrair texto do documento DOCX. Detalhe: ${(error as Error).message}`,
      );
    }
    return {
      url: finalUrl,
      title: titleFromUrl(finalUrl),
      text: capText(normalizeWhitespace(text)),
      domain,
      publication: domain,
    };
  }

  if (contentType.includes('text/plain')) {
    return {
      url: finalUrl,
      title: titleFromUrl(finalUrl),
      text: capText(normalizeWhitespace(decodeText(result.buffer, contentType))),
      domain,
      publication: domain,
    };
  }

  return extractHtml(finalUrl, decodeText(result.buffer, contentType), domain);
}

export function extractHtml(url: string, html: string, domain: string): WebContent {
  const $ = load(html);
  $(
    [
      'script',
      'style',
      'noscript',
      'iframe',
      'svg',
      'canvas',
      'form',
      'nav',
      'footer',
      'aside',
      '[aria-hidden="true"]',
      '[role="navigation"]',
      '[role="menu"]',
      '[role="menubar"]',
      '[role="search"]',
      '[role="banner"]',
      '[role="contentinfo"]',
      '[role="complementary"]',
      '.sidebar',
      '.navbox',
      '.toc',
      '.mw-editsection',
      '.breadcrumb',
      '.breadcrumbs',
    ].join(', '),
  ).remove();

  const meta = (selector: string): string | undefined => {
    const value = $(selector).attr('content')?.trim();
    return value || undefined;
  };

  const title =
    meta('meta[property="og:title"]') ||
    meta('meta[name="twitter:title"]') ||
    $('title').first().text().trim() ||
    $('h1').first().text().trim() ||
    titleFromUrl(url);

  const authors =
    meta('meta[name="author"]') ||
    meta('meta[name="citation_author"]') ||
    meta('meta[property="article:author"]') ||
    meta('meta[name="dc.creator"]') ||
    undefined;

  const publication =
    meta('meta[property="og:site_name"]') || meta('meta[name="application-name"]') || domain;

  const publishedAt = normalizeDate(
    meta('meta[property="article:published_time"]') ||
      meta('meta[name="date"]') ||
      meta('meta[name="citation_publication_date"]') ||
      meta('meta[name="dc.date"]') ||
      meta('meta[itemprop="datePublished"]'),
  );

  const candidates = ['article', 'main', '[role="main"]', '.article-body', '.post-content', '.entry-content'];
  let root: ReturnType<typeof $> = $('body');
  for (const selector of candidates) {
    const candidate = $(selector).first();
    if (candidate.length && candidate.text().trim().length > 300) {
      root = candidate;
      break;
    }
  }

  removeLinkDenseLists($, root);

  const blocks: string[] = [];
  root.find('h1, h2, h3, h4, h5, p, li, blockquote, pre, td').each((_, element) => {
    const text = $(element).text().replace(/\s+/g, ' ').trim();
    if (text) blocks.push(text);
  });
  let text = normalizeWhitespace(blocks.join('\n\n'));
  if (text.length < 250) {
    text = normalizeWhitespace(root.text());
  }

  if (!text) {
    throw new HttpError(422, 'URL_EMPTY_CONTENT', 'A página não possui conteúdo textual legível.');
  }

  return {
    url,
    title: truncate(title, 300),
    text: capText(text),
    domain,
    authors,
    publication,
    publishedAt,
  };
}

function removeLinkDenseLists(
  $: ReturnType<typeof load>,
  root: ReturnType<ReturnType<typeof load>>,
): void {
  root.find('ul, ol').each((_, element) => {
    const list = $(element);
    const listText = list.text().replace(/\s+/g, ' ').trim();
    if (listText.length < 20) return;
    const linkText = list
      .find('a')
      .map((__, link) => $(link).text().replace(/\s+/g, ' ').trim())
      .get()
      .join(' ')
      .trim();
    const linkCount = list.find('a[href]').length;
    if (linkCount >= 2 && linkText.length / listText.length >= 0.8) {
      list.remove();
    }
  });
}

async function extractPdf(buffer: Buffer): Promise<string> {
  try {
    const result = await extractText(new Uint8Array(buffer), { mergePages: true });
    const text = normalizeWhitespace(result.text);
    if (!text) {
      throw new HttpError(
        422,
        'URL_EMPTY_CONTENT',
        'O PDF não contém texto extraível. OCR não é suportado nesta versão.',
      );
    }
    return capText(text);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(
      422,
      'URL_UNSUPPORTED_CONTENT',
      `Não foi possível extrair texto do PDF. Detalhe: ${(error as Error).message}`,
    );
  }
}

function decodeText(buffer: Buffer, contentType: string): string {
  const charset = /charset=([^;\s]+)/i.exec(contentType)?.[1]?.replace(/["']/g, '');
  if (charset) {
    try {
      return new TextDecoder(charset).decode(buffer);
    } catch {
      // Usa UTF-8 como alternativa.
    }
  }
  return buffer.toString('utf8');
}

function capText(text: string): string {
  if (text.length <= MAX_SOURCE_TEXT_CHARS) return text;
  return text.slice(0, MAX_SOURCE_TEXT_CHARS);
}

function titleFromUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const last = url.pathname.split('/').filter(Boolean).pop();
    return decodeURIComponent(last || url.hostname).replace(/[-_]+/g, ' ').replace(/\.[a-z0-9]+$/i, '');
  } catch {
    return rawUrl;
  }
}

function normalizeDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString();
}
