import path from 'node:path';

// A aplicação é iniciada a partir da raiz do projeto pelos scripts do npm.
export const PROJECT_ROOT = path.resolve(process.env.RC_ROOT || process.cwd());

export const DATA_DIR = process.env.RC_DATA_DIR
  ? path.resolve(process.env.RC_DATA_DIR)
  : path.join(PROJECT_ROOT, 'data');

export const PUBLIC_DIR = path.join(PROJECT_ROOT, 'dist', 'client');

export const HOST = process.env.HOST || '127.0.0.1';

export const PORT = Number(process.env.PORT || 4317);

export const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;

export const MAX_URL_BYTES = 8 * 1024 * 1024;

export const MAX_AI_CONTEXT_CHARS = 26_000;

export const MAX_SOURCE_TEXT_CHARS = 4_000_000;
