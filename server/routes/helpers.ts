import type { Request } from 'express';
import { z } from 'zod';
import { validationError } from '../errors.js';

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw validationError('Os dados enviados são inválidos.', result.error.flatten());
  }
  return result.data;
}

export function parseParams<T>(schema: z.ZodType<T>, params: unknown): T {
  const result = schema.safeParse(params);
  if (!result.success) {
    throw validationError('Os parâmetros da requisição são inválidos.', result.error.flatten());
  }
  return result.data;
}

export function tagsFromRequest(req: Request): string[] {
  const raw = req.body?.tags;
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string' && raw.trim()) {
    if (raw.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        // Usa separação por vírgulas.
      }
    }
    return raw.split(',').map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
}

export const sourceParamsSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
});

export const noteParamsSchema = z.object({
  id: z.string().min(1),
  noteId: z.string().min(1),
});
