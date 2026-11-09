import dns from 'node:dns/promises';
import net from 'node:net';
import { HttpError } from '../errors.js';
import { isValidHttpUrl } from '../utils.js';

const PRIVATE_V4 = [
  /^0\./,
  /^10\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^198\.18\./,
  /^198\.19\./,
  /^22[4-9]\./,
  /^23\d\./,
  /^24\d\./,
  /^25[0-5]\./,
];

function isPrivateAddress(address: string): boolean {
  if (net.isIPv4(address)) return PRIVATE_V4.some((pattern) => pattern.test(address));
  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    if (normalized === '::' || normalized === '::1') return true;
    if (normalized.startsWith('fe80') || normalized.startsWith('fc') || normalized.startsWith('fd')) {
      return true;
    }
    const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return false;
  }
  return false;
}

export async function assertPublicHttpUrl(raw: string): Promise<URL> {
  if (!isValidHttpUrl(raw)) {
    throw new HttpError(422, 'INVALID_URL', 'Informe uma URL http ou https válida.');
  }
  const url = new URL(raw);
  if (url.username || url.password) {
    throw new HttpError(422, 'INVALID_URL', 'URLs com credenciais embutidas não são aceitas.');
  }
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new HttpError(
      422,
      'PRIVATE_URL',
      'Por segurança, apenas endereços públicos da internet podem ser importados.',
    );
  }

  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname)) {
      throw new HttpError(
        422,
        'PRIVATE_URL',
        'Por segurança, apenas endereços públicos da internet podem ser importados.',
      );
    }
    return url;
  }

  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    throw new HttpError(
      422,
      'URL_UNREACHABLE',
      'Não foi possível resolver o endereço da página. Verifique a URL e tente novamente.',
    );
  }
  if (addresses.length === 0 || addresses.some((entry) => isPrivateAddress(entry.address))) {
    throw new HttpError(
      422,
      'PRIVATE_URL',
      'Por segurança, apenas endereços públicos da internet podem ser importados.',
    );
  }
  return url;
}

export interface FetchResult {
  finalUrl: string;
  contentType: string;
  buffer: Buffer;
}

export async function fetchPublicUrl(
  rawUrl: string,
  options: { maxBytes: number; timeoutMs?: number; accept?: string },
): Promise<FetchResult> {
  let current = await assertPublicHttpUrl(rawUrl);
  const timeoutMs = options.timeoutMs ?? 25_000;
  const signal = AbortSignal.timeout(timeoutMs);

  for (let redirect = 0; redirect < 5; redirect += 1) {
    let response: Response;
    try {
      response = await fetch(current, {
        signal,
        redirect: 'manual',
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36 ResearchCompanion/0.1',
          accept:
            options.accept ?? 'text/html,application/xhtml+xml,application/pdf,text/plain;q=0.9,*/*;q=0.5',
          'accept-language': 'pt-BR,pt;q=0.9,en;q=0.7',
        },
      });
    } catch (error) {
      if ((error as Error).name === 'TimeoutError') {
        throw new HttpError(422, 'URL_TIMEOUT', 'A página demorou demais para responder.');
      }
      throw new HttpError(
        422,
        'URL_UNREACHABLE',
        'Não foi possível acessar a página. Verifique a URL ou tente novamente mais tarde.',
      );
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        throw new HttpError(422, 'URL_REDIRECT', 'A página retornou um redirecionamento inválido.');
      }
      current = await assertPublicHttpUrl(new URL(location, current).toString());
      continue;
    }

    if (!response.ok) {
      throw new HttpError(
        422,
        'URL_HTTP_ERROR',
        `A página respondeu com o status ${response.status}. O conteúdo não pôde ser importado.`,
      );
    }

    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength && contentLength > options.maxBytes) {
      throw new HttpError(422, 'URL_TOO_LARGE', 'O conteúdo da página excede o limite suportado.');
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (
      !contentType.includes('text/html') &&
      !contentType.includes('application/xhtml') &&
      !contentType.includes('text/plain') &&
      !contentType.includes('application/pdf') &&
      !contentType.includes('wordprocessingml')
    ) {
      throw new HttpError(
        422,
        'URL_UNSUPPORTED_CONTENT',
        `O tipo de conteúdo desta página não é suportado (${contentType || 'desconhecido'}).`,
      );
    }

    const buffer = await readLimited(response, options.maxBytes);
    return { finalUrl: current.toString(), contentType, buffer };
  }

  throw new HttpError(422, 'URL_REDIRECT_LOOP', 'A página redireciona em excesso.');
}

async function readLimited(response: Response, maxBytes: number): Promise<Buffer> {
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new HttpError(422, 'URL_TOO_LARGE', 'O conteúdo da página excede o limite suportado.');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}
