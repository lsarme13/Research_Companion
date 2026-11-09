import { load } from 'cheerio';
import { HttpError } from '../errors.js';
import { domainFromUrl, normalizeWhitespace } from '../utils.js';
import type { AppSettings } from '../storage/types.js';

export interface RawSearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

const SEARCH_TIMEOUT_MS = 20_000;
const SEARCH_LIMIT = 12;

export async function searchWeb(query: string, settings: AppSettings): Promise<RawSearchResult[]> {
  if (settings.search.provider === 'searxng') {
    return searchSearxng(query, settings.search.searxngUrl);
  }
  return searchDuckDuckGo(query);
}

async function searchDuckDuckGo(query: string): Promise<RawSearchResult[]> {
  const endpoint = new URL('https://html.duckduckgo.com/html/');
  endpoint.searchParams.set('q', query);
  endpoint.searchParams.set('kl', 'pt-br');

  let response: Response;
  try {
    response = await fetch(endpoint, {
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'pt-BR,pt;q=0.9,en;q=0.7',
      },
    });
  } catch {
    throw new HttpError(
      502,
      'SEARCH_UNAVAILABLE',
      'A busca na internet está indisponível no momento. Tente novamente ou adicione a URL diretamente.',
    );
  }

  if (response.status === 429 || response.status === 202) {
    throw new HttpError(
      502,
      'SEARCH_RATE_LIMITED',
      'O provedor de busca limitou temporariamente as solicitações. Aguarde um pouco ou use uma instância SearXNG nas configurações.',
    );
  }
  if (!response.ok) {
    throw new HttpError(
      502,
      'SEARCH_UNAVAILABLE',
      `A busca na internet respondeu com o status ${response.status}. Tente novamente mais tarde.`,
    );
  }

  const html = await response.text();
  const $ = load(html);
  const results: RawSearchResult[] = [];
  $('.result').each((_, element) => {
    const link = $(element).find('.result__a').first();
    const title = normalizeWhitespace(link.text());
    const href = link.attr('href');
    if (!title || !href) return;
    const url = unwrapDuckDuckGoUrl(href);
    if (!url) return;
    const snippet = normalizeWhitespace($(element).find('.result__snippet').first().text());
    const domain = domainFromUrl(url);
    if (!domain) return;
    if (results.some((result) => result.url === url)) return;
    results.push({ title, url, snippet, domain });
  });

  return results.slice(0, SEARCH_LIMIT);
}

function unwrapDuckDuckGoUrl(href: string): string | null {
  try {
    const absolute = href.startsWith('//') ? `https:${href}` : href;
    const url = new URL(absolute, 'https://duckduckgo.com');
    if (url.hostname.endsWith('duckduckgo.com') && url.pathname.startsWith('/l/')) {
      const target = url.searchParams.get('uddg');
      if (!target) return null;
      return new URL(target).toString();
    }
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString();
    return null;
  } catch {
    return null;
  }
}

async function searchSearxng(query: string, baseUrl: string): Promise<RawSearchResult[]> {
  if (!baseUrl.trim()) {
    throw new HttpError(
      422,
      'SEARCH_NOT_CONFIGURED',
      'Configure o endereço da sua instância SearXNG em Configurações.',
    );
  }
  let endpoint: URL;
  try {
    endpoint = new URL('/search', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  } catch {
    throw new HttpError(422, 'SEARCH_NOT_CONFIGURED', 'O endereço da instância SearXNG é inválido.');
  }
  endpoint.searchParams.set('q', query);
  endpoint.searchParams.set('format', 'json');
  endpoint.searchParams.set('language', 'pt-BR');

  let response: Response;
  try {
    response = await fetch(endpoint, {
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
      headers: { accept: 'application/json' },
    });
  } catch {
    throw new HttpError(
      502,
      'SEARCH_UNAVAILABLE',
      'Não foi possível acessar a instância SearXNG configurada.',
    );
  }
  if (!response.ok) {
    throw new HttpError(
      502,
      'SEARCH_UNAVAILABLE',
      `A instância SearXNG respondeu com o status ${response.status}.`,
    );
  }

  let payload: { results?: Array<{ title?: string; url?: string; content?: string }> };
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    throw new HttpError(
      502,
      'SEARCH_UNAVAILABLE',
      'A instância SearXNG retornou uma resposta inválida. Verifique se o formato JSON está habilitado.',
    );
  }

  const results: RawSearchResult[] = [];
  for (const item of payload.results || []) {
    if (!item.title || !item.url) continue;
    let url: URL;
    try {
      url = new URL(item.url);
    } catch {
      continue;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;
    const domain = domainFromUrl(url.toString());
    if (!domain) continue;
    if (results.some((result) => result.url === url.toString())) continue;
    results.push({
      title: normalizeWhitespace(item.title),
      url: url.toString(),
      snippet: normalizeWhitespace(item.content || ''),
      domain,
    });
    if (results.length >= SEARCH_LIMIT) break;
  }
  return results;
}
