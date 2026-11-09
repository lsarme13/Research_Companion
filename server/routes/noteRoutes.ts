import { Router } from 'express';
import { z } from 'zod';
import type { Repository } from '../storage/repository.js';
import { createNote, deleteNote, listNotes, updateNote } from '../services/noteService.js';
import { noteParamsSchema, parseBody, parseParams } from './helpers.js';

const createSchema = z.object({
  title: z.string().optional(),
  content: z.string(),
  sourceId: z.string().optional(),
  quote: z.string().optional(),
});

const updateSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
});

export function noteRoutes(repo: Repository): Router {
  const router = Router();

  router.get('/research/:id/notes', async (req, res) => {
    res.json(await listNotes(repo, req.params.id));
  });

  router.post('/research/:id/notes', async (req, res) => {
    const input = parseBody(createSchema, req.body);
    res.status(201).json(await createNote(repo, req.params.id, input));
  });

  router.patch('/research/:id/notes/:noteId', async (req, res) => {
    const params = parseParams(noteParamsSchema, req.params);
    const input = parseBody(updateSchema, req.body);
    res.json(await updateNote(repo, params.id, params.noteId, input));
  });

  router.delete('/research/:id/notes/:noteId', async (req, res) => {
    const params = parseParams(noteParamsSchema, req.params);
    await deleteNote(repo, params.id, params.noteId);
    res.status(204).end();
  });

  return router;
}
