import { existsSync } from 'node:fs';
import path from 'node:path';
import express, { Express, NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from './errors.js';
import { aiRoutes } from './routes/aiRoutes.js';
import { noteRoutes } from './routes/noteRoutes.js';
import { researchRoutes } from './routes/researchRoutes.js';
import { settingsRoutes } from './routes/settingsRoutes.js';
import { sourceRoutes } from './routes/sourceRoutes.js';
import { Repository } from './storage/repository.js';

export interface CreateAppOptions {
  dataDir: string;
  publicDir?: string;
}

export async function createApp(options: CreateAppOptions): Promise<Express> {
  const repo = new Repository(options.dataDir);
  await repo.initialize();

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '6mb' }));
  app.use((_req, res, next) => {
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('referrer-policy', 'no-referrer');
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, name: 'Research Companion', version: '0.1.0' });
  });

  app.use(
    '/api',
    researchRoutes(repo),
    sourceRoutes(repo),
    noteRoutes(repo),
    aiRoutes(repo),
    settingsRoutes(repo),
  );

  app.use('/api', (_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Rota da API não encontrada.' },
    });
  });

  if (options.publicDir && existsSync(path.join(options.publicDir, 'index.html'))) {
    app.use(express.static(options.publicDir, { index: false }));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) {
        next();
        return;
      }
      res.sendFile(path.join(options.publicDir!, 'index.html'));
    });
  }

  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Interface não compilada. Execute “npm run build” ou use “npm run dev”.',
      },
    });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof HttpError) {
      res.status(error.status).json({
        error: { code: error.code, message: error.message, details: error.details },
      });
      return;
    }
    if (error instanceof ZodError) {
      res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Os parâmetros enviados são inválidos.',
          details: error.flatten(),
        },
      });
      return;
    }
    if ((error as { name?: string }).name === 'MulterError') {
      const code = (error as { code?: string }).code;
      res.status(code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
        error: {
          code: 'UPLOAD_ERROR',
          message:
            code === 'LIMIT_FILE_SIZE'
              ? 'O arquivo excede o limite de 30 MB.'
              : 'Não foi possível receber o arquivo enviado.',
        },
      });
      return;
    }
    if (error instanceof SyntaxError && (error as { status?: number }).status === 400) {
      res.status(400).json({
        error: { code: 'INVALID_JSON', message: 'O corpo da requisição não é um JSON válido.' },
      });
      return;
    }
    console.error('[research-companion] erro inesperado:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ocorreu um erro interno. Nenhuma alteração parcial deve ser considerada concluída.',
      },
    });
  });

  return app;
}
