import { Db, SQLValue } from '@/db/types';

/**
 * Adaptador do SQLite embutido no Node (node:sqlite) para a interface `Db`.
 * Mesmo motor SQLite do aparelho, então o schema e as queries são os mesmos.
 */
type Stmt = { run(...p: SQLValue[]): unknown; all(...p: SQLValue[]): unknown[]; get(...p: SQLValue[]): unknown };
type NodeDatabase = { exec(sql: string): void; prepare(sql: string): Stmt; close(): void };

const { DatabaseSync } = (process as unknown as { getBuiltinModule(id: string): { DatabaseSync: new (path: string) => NodeDatabase } }).getBuiltinModule(
  'node:sqlite',
);

export function openMemoryDb(): Db & { close(): void } {
  const db = new DatabaseSync(':memory:');
  return {
    async execAsync(sql) {
      db.exec(sql);
    },
    async runAsync(sql, ...params) {
      return db.prepare(sql).run(...params);
    },
    async getAllAsync<T>(sql: string, ...params: SQLValue[]) {
      return db.prepare(sql).all(...params) as T[];
    },
    async getFirstAsync<T>(sql: string, ...params: SQLValue[]) {
      return (db.prepare(sql).get(...params) as T | undefined) ?? null;
    },
    async withTransactionAsync(task) {
      db.exec('BEGIN');
      try {
        await task();
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
    close: () => db.close(),
  };
}
