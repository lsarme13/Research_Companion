import { Router } from 'express';
import { z } from 'zod';
import type { Repository } from '../storage/repository.js';
import { slugify } from '../utils.js';
import { exportResearchJson, exportResearchMarkdown } from '../services/exportService.js';
import {
  archiveResearch,
  createResearch,
  deleteResearch,
  getGlobalActivity,
  getResearchActivity,
  getResearchSummary,
  listResearchSummaries,
  restoreResearch,
  updateResearch,
} from '../services/researchService.js';
import { parseBody } from './helpers.js';

const createSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  initialContext: z.string().optional(),
  questions: z.array(z.string()).optional(),
});

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  initialContext: z.string().optional(),
  questions: z.array(z.string()).optional(),
  lastSection: z.string().optional(),
  lastSourceId: z.string().nullable().optional(),
});

export function researchRoutes(repo: Repository): Router {
  const router = Router();

  router.get('/research', async (req, res) => {
    const includeArchived = req.query.includeArchived === 'true';
    res.json(await listResearchSummaries(repo, { includeArchived }));
  });

  router.post('/research', async (req, res) => {
    const input = parseBody(createSchema, req.body);
    const research = await createResearch(repo, input);
    res.status(201).json(await getResearchSummary(repo, research.id));
  });

  router.get('/research/:id', async (req, res) => {
    res.json(await getResearchSummary(repo, req.params.id));
  });

  router.patch('/research/:id', async (req, res) => {
    const input = parseBody(updateSchema, req.body);
    await updateResearch(repo, req.params.id, input);
    res.json(await getResearchSummary(repo, req.params.id));
  });

  router.delete('/research/:id', async (req, res) => {
    if (req.query.confirm !== 'true') {
      res.status(400).json({
        error: {
          code: 'CONFIRMATION_REQUIRED',
          message: 'A exclusão permanente exige confirmação explícita.',
        },
      });
      return;
    }
    await deleteResearch(repo, req.params.id);
    res.status(204).end();
  });

  router.post('/research/:id/archive', async (req, res) => {
    await archiveResearch(repo, req.params.id);
    res.json(await getResearchSummary(repo, req.params.id));
  });

  router.post('/research/:id/restore', async (req, res) => {
    await restoreResearch(repo, req.params.id);
    res.json(await getResearchSummary(repo, req.params.id));
  });

  router.get('/research/:id/activity', async (req, res) => {
    res.json(await getResearchActivity(repo, req.params.id));
  });

  router.get('/activity', async (_req, res) => {
    res.json(await getGlobalActivity(repo));
  });

  router.get('/research/:id/export', async (req, res) => {
    const research = await repo.getResearchRecord(req.params.id);
    const format = req.query.format === 'markdown' ? 'markdown' : 'json';
    if (format === 'markdown') {
      const { markdown, fileName } = await exportResearchMarkdown(repo, req.params.id);
      res.setHeader('content-type', 'text/markdown; charset=utf-8');
      res.setHeader('content-disposition', `attachment; filename="${fileName}"`);
      res.send(markdown);
      return;
    }
    const data = await exportResearchJson(repo, req.params.id);
    const fileName = `${slugify(research.title)}-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('content-disposition', `attachment; filename="${fileName}"`);
    res.send(JSON.stringify(data, null, 2));
  });

  return router;
}
