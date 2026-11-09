import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Armazenamento JSON com escrita atômica e serialização de acessos por arquivo.
 * O objetivo é preservar a integridade dos dados sem introduzir um banco de dados.
 */
export class JsonStore<T> {
  private tail: Promise<void> = Promise.resolve();

  constructor(
    public readonly filePath: string,
    private readonly defaultValue: () => T,
  ) {}

  async read(): Promise<T> {
    return this.enqueue(async () => this.readUnlocked());
  }

  async write(value: T): Promise<void> {
    await this.enqueue(async () => {
      await this.writeUnlocked(value);
    });
  }

  async update(mutator: (current: T) => T | Promise<T>): Promise<T> {
    return this.enqueue(async () => {
      const current = await this.readUnlocked();
      const next = await mutator(current);
      await this.writeUnlocked(next);
      return next;
    });
  }

  private enqueue<R>(task: () => Promise<R>): Promise<R> {
    const run = this.tail.then(task, task);
    this.tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async readUnlocked(): Promise<T> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      if (!raw.trim()) return this.defaultValue();
      try {
        return JSON.parse(raw) as T;
      } catch (error) {
        throw new Error(
          `Arquivo de dados corrompido: ${this.filePath}. O aplicativo não sobrescreveu o arquivo. Detalhe: ${(error as Error).message}`,
        );
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return this.defaultValue();
      }
      throw error;
    }
  }

  private async writeUnlocked(value: T): Promise<void> {
    const directory = path.dirname(this.filePath);
    await fs.mkdir(directory, { recursive: true });
    const temporary = path.join(
      directory,
      `.${path.basename(this.filePath)}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`,
    );
    const serialized = `${JSON.stringify(value, null, 2)}\n`;
    await fs.writeFile(temporary, serialized, 'utf8');
    await fs.rename(temporary, this.filePath);
  }
}

const stores = new Map<string, JsonStore<unknown>>();

export function getJsonStore<T>(filePath: string, defaultValue: () => T): JsonStore<T> {
  const resolved = path.resolve(filePath);
  const existing = stores.get(resolved);
  if (existing) return existing as JsonStore<T>;
  const store = new JsonStore<T>(resolved, defaultValue);
  stores.set(resolved, store);
  return store;
}
