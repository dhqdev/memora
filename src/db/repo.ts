import { Moment, Person, Profile, Story } from '../types';
import { Db } from './types';

/** Tudo que o app guarda. */
export interface Snapshot {
  profile: Partial<Profile>;
  moments: Moment[];
  stories: Story[];
  people: Person[];
}

type MomentRow = {
  id: string;
  title: string;
  text: string;
  photos: string;
  place_name: string | null;
  place_lat: number | null;
  place_lng: number | null;
  date: string;
  story_id: string | null;
  companion_comment: string | null;
  comment_pending: number;
  comment_at: string | null;
};

export function rowToMoment(r: MomentRow, people: string[]): Moment {
  let photos: string[] = [];
  try {
    photos = JSON.parse(r.photos);
  } catch {}
  return {
    id: r.id,
    title: r.title,
    text: r.text,
    photos,
    people,
    place: r.place_name != null && r.place_lat != null && r.place_lng != null ? { name: r.place_name, latitude: r.place_lat, longitude: r.place_lng } : undefined,
    date: r.date,
    storyId: r.story_id ?? undefined,
    companionComment: r.companion_comment ?? undefined,
    commentPending: !!r.comment_pending,
    commentAt: r.comment_at ?? undefined,
  };
}

// ---------- leitura ----------

export async function loadAll(db: Db): Promise<Snapshot> {
  const [settings, storyRows, peopleRows, momentRows, links] = await Promise.all([
    db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'profile'"),
    db.getAllAsync<{ id: string; title: string; category: string; year: number; body: string | null; updated_at: string }>(
      'SELECT * FROM stories ORDER BY updated_at DESC',
    ),
    db.getAllAsync<{ id: string; name: string; photo: string | null; note: string | null }>('SELECT * FROM people ORDER BY rowid'),
    db.getAllAsync<MomentRow>('SELECT * FROM moments ORDER BY date DESC'),
    db.getAllAsync<{ moment_id: string; person_id: string }>('SELECT moment_id, person_id FROM moment_people'),
  ]);

  const byMoment = new Map<string, string[]>();
  for (const l of links) byMoment.set(l.moment_id, [...(byMoment.get(l.moment_id) ?? []), l.person_id]);

  let profile: Partial<Profile> = {};
  try {
    profile = settings ? JSON.parse(settings.value) : {};
  } catch {}

  return {
    profile,
    stories: storyRows.map((s) => ({ id: s.id, title: s.title, category: s.category, year: s.year, body: s.body ?? undefined, updatedAt: s.updated_at })),
    people: peopleRows.map((p) => ({ id: p.id, name: p.name, photo: p.photo ?? undefined, note: p.note ?? undefined })),
    // um comentário que ficou "escrevendo" quando o app fechou não vai mais chegar
    moments: momentRows.map((r) => ({ ...rowToMoment(r, byMoment.get(r.id) ?? []), commentPending: false })),
  };
}

// ---------- escrita ----------

export async function saveProfile(db: Db, profile: Profile) {
  await db.runAsync("INSERT INTO settings (key, value) VALUES ('profile', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", JSON.stringify(profile));
}

export async function upsertStory(db: Db, s: Story) {
  await db.runAsync(
    `INSERT INTO stories (id, title, category, year, body, updated_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET title = excluded.title, category = excluded.category, year = excluded.year,
       body = excluded.body, updated_at = excluded.updated_at`,
    s.id, s.title, s.category, s.year, s.body ?? null, s.updatedAt,
  );
}

export async function deleteStory(db: Db, id: string) {
  await db.runAsync('DELETE FROM stories WHERE id = ?', id);
}

export async function upsertPerson(db: Db, p: Person) {
  await db.runAsync(
    `INSERT INTO people (id, name, photo, note) VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, photo = excluded.photo, note = excluded.note`,
    p.id, p.name, p.photo ?? null, p.note ?? null,
  );
}

/** Grava o moment e as pessoas marcadas (sem abrir transação). */
async function writeMoment(db: Db, m: Moment) {
  await db.runAsync(
      `INSERT INTO moments (id, title, text, photos, place_name, place_lat, place_lng, date, story_id, companion_comment, comment_pending, comment_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET title = excluded.title, text = excluded.text, photos = excluded.photos,
         place_name = excluded.place_name, place_lat = excluded.place_lat, place_lng = excluded.place_lng,
         date = excluded.date, story_id = excluded.story_id, companion_comment = excluded.companion_comment,
         comment_pending = excluded.comment_pending, comment_at = excluded.comment_at`,
      m.id, m.title, m.text, JSON.stringify(m.photos),
      m.place?.name ?? null, m.place?.latitude ?? null, m.place?.longitude ?? null,
      m.date, m.storyId ?? null, m.companionComment ?? null, m.commentPending ? 1 : 0, m.commentAt ?? null,
  );
  await db.runAsync('DELETE FROM moment_people WHERE moment_id = ?', m.id);
  for (const pid of m.people) {
    await db.runAsync('INSERT OR IGNORE INTO moment_people (moment_id, person_id) VALUES (?, ?)', m.id, pid);
  }
}

export async function upsertMoment(db: Db, m: Moment) {
  await db.withTransactionAsync(() => writeMoment(db, m));
}

export async function deleteMoment(db: Db, id: string) {
  await db.runAsync('DELETE FROM moments WHERE id = ?', id);
}

export async function wipe(db: Db) {
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM moment_people; DELETE FROM moments; DELETE FROM people; DELETE FROM stories; DELETE FROM settings;');
  });
}

/** Lê o JSON do armazenamento antigo (AsyncStorage). Devolve null se estiver corrompido. */
export function parseLegacy(raw: string | null): Snapshot | null {
  if (!raw) return null;
  try {
    const old = JSON.parse(raw);
    if (!old || typeof old !== 'object') return null;
    return {
      profile: old.profile && typeof old.profile === 'object' ? old.profile : {},
      moments: Array.isArray(old.moments) ? old.moments.filter((m: Moment) => m && m.id && m.date) : [],
      stories: Array.isArray(old.stories) ? old.stories.filter((s: Story) => s && s.id) : [],
      people: Array.isArray(old.people) ? old.people.filter((p: Person) => p && p.id && p.name) : [],
    };
  } catch {
    return null;
  }
}

/**
 * Importa tudo de uma vez (usado na migração do armazenamento antigo).
 * Limpa o que o schema não aceita: pessoas com o mesmo nome viram uma só,
 * e referências para stories/pessoas que não existem são descartadas.
 */
export async function importSnapshot(db: Db, s: Snapshot) {
  const people: Person[] = [];
  const sameAs = new Map<string, string>(); // id antigo -> id que ficou
  for (const p of s.people) {
    const dup = people.find((x) => x.name.toLowerCase() === p.name.toLowerCase());
    if (dup) sameAs.set(p.id, dup.id);
    else {
      people.push(p);
      sameAs.set(p.id, p.id);
    }
  }
  const storyIds = new Set(s.stories.map((st) => st.id));

  await db.withTransactionAsync(async () => {
    for (const st of s.stories) await upsertStory(db, st);
    for (const p of people) await upsertPerson(db, p);
    for (const m of s.moments) {
      const ids = (m.people ?? []).map((id) => sameAs.get(id)).filter((id): id is string => !!id);
      await writeMoment(db, {
        ...m,
        photos: m.photos ?? [],
        storyId: m.storyId && storyIds.has(m.storyId) ? m.storyId : undefined,
        people: [...new Set(ids)],
      });
    }
    await saveProfile(db, s.profile as Profile);
  });
}
