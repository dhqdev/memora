import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { Moment, Person, Profile, Story } from '../types';
import * as repo from './repo';
import { migrate } from './schema';
import { Db } from './types';

/**
 * Banco local do Memora (SQLite no aparelho, arquivo `memora.db`).
 * Todas as escritas passam por uma fila, então nunca se atropelam.
 */
const LEGACY_KEY = 'memora:v1'; // armazenamento antigo (JSON no AsyncStorage)

let opening: Promise<Db> | null = null;

export function getDb(): Promise<Db> {
  opening ??= (async () => {
    const db = await SQLite.openDatabaseAsync('memora.db');
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await migrate(db);
    await importLegacy(db);
    return db;
  })().catch((e) => {
    opening = null; // tenta abrir de novo na próxima chamada
    throw e;
  });
  return opening;
}

/** Traz os dados da versão antiga (AsyncStorage) para o SQLite, uma vez só. */
async function importLegacy(db: Db) {
  try {
    const raw = await AsyncStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const has = await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM settings WHERE key = 'profile'");
    const old = repo.parseLegacy(raw);
    if (!has?.n && old) await repo.importSnapshot(db, old);
    await AsyncStorage.removeItem(LEGACY_KEY);
  } catch (e) {
    // não trava o app: os dados antigos ficam lá e tentamos de novo depois
    console.warn('[memora/db] falha ao importar dados antigos', e);
  }
}

let queue: Promise<unknown> = Promise.resolve();
function write(task: (db: Db) => Promise<void>) {
  queue = queue
    .then(async () => task(await getDb()))
    .catch((e) => console.warn('[memora/db]', e));
  return queue;
}

export const persistence = {
  load: async () => repo.loadAll(await getDb()),
  saveProfile: (p: Profile) => write((db) => repo.saveProfile(db, p)),
  upsertMoment: (m: Moment) => write((db) => repo.upsertMoment(db, m)),
  deleteMoment: (id: string) => write((db) => repo.deleteMoment(db, id)),
  upsertStory: (s: Story) => write((db) => repo.upsertStory(db, s)),
  deleteStory: (id: string) => write((db) => repo.deleteStory(db, id)),
  upsertPerson: (p: Person) => write((db) => repo.upsertPerson(db, p)),
  wipe: () => write((db) => repo.wipe(db)),
};
