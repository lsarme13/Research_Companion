import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { MAX_UPLOAD_BYTES } from '../config.js';
import { validationError } from '../errors.js';
import type { Repository } from '../storage/repository.js';
import {
  addFileSource,
  addUrlSource,
  approveSource,
  getSource,
  getSourceDownload,
  getSourceText,
  listSources,
  previewUrl,
  rejectSource,
  removeSource,
  searchSources,
  updateSource,
} from '../services/sourceService.js';
import { parseBody, parseParams, sourceParamsSchema, tagsFromRequest } from './helpers.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});

const urlSchema = z.object({ url: z.string(), category: z.string().optional(), tags: z.array(z.string()).optional() });
const searchSchema = z.object({ query: z.string() });
const updateSchema = z.object({
  title: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export function sourceRoutes(repo: Repository): Router {
  const router = Router();

  router.get('/research/:id/sources', async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const kind = typeof req.query.kind === 'string' ? req.query.kind : undefined;
    res.json(await listSources(repo, req.params.id, { status, kind }));
  });

  router.post('/research/:id/sources/file', upload.single('file'), async (req, res) => {
    if (!req.file) throw validationError('Selecione um arquivo para adicionar à pesquisa.');
    const source = await addFileSource(
      repo,
      String(req.params.id),
      {
        originalName: req.file.originalname,
        buffer: req.file.buffer,
        size: req.file.size,
      },
      {
        category: typeof req.body.category === 'string' ? req.body.category : undefined,
        tags: tagsFromRequest(req),
      },
    );
    res.status(201).json(source);
  });

  router.post('/research/:id/sources/url', async (req, res) => {
    const input = parseBody(urlSchema, req.body);
    const source = await addUrlSource(repo, req.params.id, input.url, {
      category: input.category,
      tags: input.tags,
    });
    res.status(201).json(source);
  });

  router.post('/research/:id/sources/search', async (req, res) => {
    const input = parseBody(searchSchema, req.body);
    const settings = await repo.getSettings();
    res.json(await searchSources(repo, req.params.id, input.query, settings));
  });

  router.post('/research/:id/sources/preview-url', async (req, res) => {
    const input = parseBody(z.object({ url: z.string() }), req.body);
    res.json(await previewUrl(input.url));
  });

  router.get('/research/:id/sources/:sourceId', async (req, res) => {
    const params = parseParams(sourceParamsSchema, req.params);
    res.json(await getSource(repo, params.id, params.sourceId));
  });

  router.get('/research/:id/sources/:sourceId/text', async (req, res) => {
    const params = parseParams(sourceParamsSchema, req.params);
    const text = await getSourceText(repo, params.id, params.sourceId);
    res.json({ text });
  });

  router.get('/research/:id/sources/:sourceId/download', async (req, res) => {
    const params = parseParams(sourceParamsSchema, req.params);
    const file = await getSourceDownload(repo, params.id, params.sourceId);
    res.download(file.path, file.fileName);
  });

  router.patch('/research/:id/sources/:sourceId', async (req, res) => {
    const params = parseParams(sourceParamsSchema, req.params);
    const input = parseBody(updateSchema, req.body);
    res.json(await updateSource(repo, params.id, params.sourceId, input));
  });

  router.post('/research/:id/sources/:sourceId/approve', async (req, res) => {
    const params = parseParams(sourceParamsSchema, req.params);
    res.json(await approveSource(repo, params.id, params.sourceId));
  });

  router.post('/research/:id/sources/:sourceId/reject', async (req, res) => {
    const params = parseParams(sourceParamsSchema, req.params);
    res.json(await rejectSource(repo, params.id, params.sourceId));
  });

  router.delete('/research/:id/sources/:sourceId', async (req, res) => {
    const params = parseParams(sourceParamsSchema, req.params);
    await removeSource(repo, params.id, params.sourceId);
    res.status(204).end();
  });

  return router;
}
