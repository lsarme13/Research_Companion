export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function notFound(message = 'Recurso não encontrado.'): HttpError {
  return new HttpError(404, 'NOT_FOUND', message);
}

export function badRequest(message: string, details?: unknown): HttpError {
  return new HttpError(400, 'BAD_REQUEST', message, details);
}

export function validationError(message: string, details?: unknown): HttpError {
  return new HttpError(422, 'VALIDATION_ERROR', message, details);
}

export function conflict(message: string, details?: unknown): HttpError {
  return new HttpError(409, 'CONFLICT', message, details);
}
