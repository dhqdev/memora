/**
 * O mínimo de API de banco que o Memora usa. O `SQLiteDatabase` do
 * expo-sqlite já cumpre isso; nos testes usamos o SQLite do Node.
 */
export type SQLValue = string | number | null;

export interface Db {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: SQLValue[]): Promise<unknown>;
  getAllAsync<T>(sql: string, ...params: SQLValue[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, ...params: SQLValue[]): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
