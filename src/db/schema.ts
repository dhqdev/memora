import { Db } from './types';

/**
 * Migrações do banco local. Cada item roda uma vez, em ordem; a versão atual
 * fica em `PRAGMA user_version`. Para mudar o schema, ADICIONE um item novo
 * no fim (nunca edite um que já foi publicado).
 */
export const MIGRATIONS: string[] = [
  // 1 — schema inicial
  `
  CREATE TABLE settings (
    key   TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );

  CREATE TABLE stories (
    id         TEXT PRIMARY KEY NOT NULL,
    title      TEXT NOT NULL,
    category   TEXT NOT NULL,
    year       INTEGER NOT NULL,
    body       TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE people (
    id    TEXT PRIMARY KEY NOT NULL,
    name  TEXT NOT NULL COLLATE NOCASE UNIQUE,
    photo TEXT,
    note  TEXT
  );

  CREATE TABLE moments (
    id                TEXT PRIMARY KEY NOT NULL,
    title             TEXT NOT NULL,
    text              TEXT NOT NULL DEFAULT '',
    photos            TEXT NOT NULL DEFAULT '[]',
    place_name        TEXT,
    place_lat         REAL,
    place_lng         REAL,
    date              TEXT NOT NULL,
    story_id          TEXT REFERENCES stories(id) ON DELETE SET NULL,
    companion_comment TEXT,
    comment_pending   INTEGER NOT NULL DEFAULT 0,
    comment_at        TEXT
  );
  CREATE INDEX moments_date ON moments(date DESC);
  CREATE INDEX moments_story ON moments(story_id);

  CREATE TABLE moment_people (
    moment_id TEXT NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
    person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    PRIMARY KEY (moment_id, person_id)
  );
  CREATE INDEX moment_people_person ON moment_people(person_id);
  `,

  // 2 — rostos encontrados nas fotos
  `
  CREATE TABLE faces (
    id         TEXT PRIMARY KEY NOT NULL,
    moment_id  TEXT NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
    photo      TEXT NOT NULL,
    crop       TEXT NOT NULL,
    x          REAL NOT NULL,
    y          REAL NOT NULL,
    w          REAL NOT NULL,
    h          REAL NOT NULL,
    person_id  TEXT REFERENCES people(id) ON DELETE SET NULL,
    status     TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'person', 'me', 'ignored')),
    created_at TEXT NOT NULL
  );
  CREATE INDEX faces_moment ON faces(moment_id);
  CREATE INDEX faces_person ON faces(person_id);
  ALTER TABLE moments ADD COLUMN faces_scanned INTEGER NOT NULL DEFAULT 0;
  `,
];

export async function migrate(db: Db): Promise<number> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    const sql = MIGRATIONS[version];
    const next = version + 1;
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${next}`);
    });
    version = next;
  }
  return version;
}
