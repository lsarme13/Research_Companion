import { Router } from 'express';
import { z } from 'zod';
import type { ReadingRequest } from '../../shared/types.js';
import type { Repository } from '../storage/repository.js';
import { analyzeReading, askQuestion, evaluateSource, testProvider } from '../services/ai/aiService.js';
import { parseBody } from './helpers.js';

const askSchema = z.object({
  question: z.string(),
  sourceIds: z.array(z.string()).optional(),
});

const readingSchema = z.object({
  sourceId: z.string(),
  action: z.enum(['explain', 'simplify', 'arguments', 'assumptions', 'questions', 'custom']),
  selection: z.string().optional(),
  question: z.string().optional(),
  depth: z.enum(['simples', 'intermediario', 'avancado']).optional(),
});

const evaluateSchema = z.object({ sourceId: z.string() });

export function aiRoutes(repo: Repository): Router {
  const router = Router();

  router.post('/research/:id/ai/ask', async (req, res) => {
    const input = parseBody(askSchema, req.body);
    const settings = await repo.getSettings();
    res.json(await askQuestion(repo, settings, req.params.id, input));
  });

  router.post('/research/:id/ai/reading', async (req, res) => {
    const input = parseBody(readingSchema, req.body);
    const settings = await repo.getSettings();
    res.json(await analyzeReading(repo, settings, req.params.id, input as ReadingRequest));
  });

  router.post('/research/:id/ai/evaluate-source', async (req, res) => {
    const input = parseBody(evaluateSchema, req.body);
    const settings = await repo.getSettings();
    res.json(await evaluateSource(repo, settings, req.params.id, input.sourceId));
  });

  router.post('/ai/test', async (_req, res) => {
    const settings = await repo.getSettings();
    res.json(await testProvider(settings));
  });

  return router;
}
