import { Router } from 'express';
import { z } from 'zod';
import type { Repository } from '../storage/repository.js';
import { getLibraryDocuments } from '../services/sourceService.js';
import { getPublicSettings, updateSettings } from '../services/settingsService.js';
import { parseBody } from './helpers.js';

const settingsSchema = z.object({
  theme: z.enum(['editorial', 'dark', 'neutral']).optional(),
  ai: z
    .object({
      provider: z.enum(['demo', 'ollama', 'openai-compatible']).optional(),
      ollamaBaseUrl: z.string().optional(),
      ollamaModel: z.string().optional(),
      openaiBaseUrl: z.string().optional(),
      openaiModel: z.string().optional(),
      apiKey: z.string().nullable().optional(),
    })
    .optional(),
  search: z
    .object({
      provider: z.enum(['duckduckgo', 'searxng']).optional(),
      searxngUrl: z.string().optional(),
    })
    .optional(),
});

export function settingsRoutes(repo: Repository): Router {
  const router = Router();

  router.get('/settings', async (_req, res) => {
    res.json(await getPublicSettings(repo));
  });

  router.put('/settings', async (req, res) => {
    const input = parseBody(settingsSchema, req.body);
    res.json(await updateSettings(repo, input));
  });

  router.get('/library/documents', async (_req, res) => {
    res.json(await getLibraryDocuments(repo));
  });

  return router;
}
