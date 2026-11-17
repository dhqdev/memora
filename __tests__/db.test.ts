/** @jest-environment node */
import * as repo from '@/db/repo';
import { MIGRATIONS, migrate } from '@/db/schema';
import { Face, Moment, Person, Profile, Story } from '@/types';
import { openMemoryDb } from './helpers/nodeDb';

const profile = { onboarded: true, name: 'Ana', handle: 'ana', bio: '', pronoun: 'ela', interests: ['Amigos'], theme: 'system', voice: true, haptics: true, showBuddy: true, reminder: '21', plus: false, commentsUsed: 3 } as Profile;
const story: Story = { id: 's1', title: 'Amigos', category: 'Amigos', year: 2026, updatedAt: '2026-11-01T10:00:00.000Z' };
const isa: Person = { id: 'p1', name: 'Isabela' };
const caio: Person = { id: 'p2', name: 'Caio', note: 'amigo da faculdade' };
const moment = (id: string, over: Partial<Moment> = {}): Moment => ({
  id,
  title: 'Café',
  text: 'Café com @Isabela',
  photos: ['photos/a.jpg'],
  people: ['p1'],
  date: '2026-11-10T12:00:00.000Z',
  ...over,
});

let db: ReturnType<typeof openMemoryDb>;
beforeEach(async () => {
  db = openMemoryDb();
  await migrate(db);
});
afterEach(() => db.close());

describe('migrações', () => {
  it('cria o schema e grava a versão', async () => {
    const v = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(v?.user_version).toBe(MIGRATIONS.length);
    const tables = (await db.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")).map((t) => t.name);
    expect(tables).toEqual(['faces', 'moment_people', 'moments', 'people', 'settings', 'stories']);
  });
  it('rodar de novo não faz nada', async () => {
    await expect(migrate(db)).resolves.toBe(MIGRATIONS.length);
  });
  it('banco novo começa vazio', async () => {
    expect(await repo.loadAll(db)).toEqual({ profile: {}, moments: [], stories: [], people: [], faces: [] });
  });
});

describe('leitura e escrita', () => {
  it('salva e lê tudo de volta', async () => {
    await repo.saveProfile(db, profile);
    await repo.upsertStory(db, story);
    await repo.upsertPerson(db, isa);
    await repo.upsertPerson(db, caio);
    const m = moment('m1', {
      storyId: 's1',
      people: ['p1', 'p2'],
      place: { name: 'Padaria', latitude: -23.5, longitude: -46.6 },
      companionComment: 'Que dia bom!',
      commentAt: '2026-11-10T12:01:00.000Z',
    });
    await repo.upsertMoment(db, m);

    const s = await repo.loadAll(db);
    expect(s.profile).toEqual(profile);
    expect(s.stories).toEqual([story]);
    expect(s.people).toEqual([isa, caio]);
    expect(s.moments).toEqual([{ ...m, commentPending: false }]);
  });

  it('atualizar um moment troca as pessoas marcadas', async () => {
    await repo.upsertPerson(db, isa);
    await repo.upsertPerson(db, caio);
    await repo.upsertMoment(db, moment('m1', { people: ['p1'] }));
    await repo.upsertMoment(db, moment('m1', { title: 'Almoço', people: ['p2'] }));
    const [m] = (await repo.loadAll(db)).moments;
    expect(m.title).toBe('Almoço');
    expect(m.people).toEqual(['p2']);
  });

  it('moments vêm do mais novo pro mais velho', async () => {
    await repo.upsertMoment(db, moment('velho', { people: [], date: '2026-01-01T10:00:00.000Z' }));
    await repo.upsertMoment(db, moment('novo', { people: [], date: '2026-11-01T10:00:00.000Z' }));
    expect((await repo.loadAll(db)).moments.map((m) => m.id)).toEqual(['novo', 'velho']);
  });

  it('comentário que ficou "escrevendo" não volta pendurado', async () => {
    await repo.upsertMoment(db, moment('m1', { people: [], commentPending: true }));
    expect((await repo.loadAll(db)).moments[0].commentPending).toBe(false);
  });

  it('não deixa duas pessoas com o mesmo nome', async () => {
    await repo.upsertPerson(db, isa);
    await expect(repo.upsertPerson(db, { id: 'p9', name: 'ISABELA' })).rejects.toThrow();
  });

  it('moment com pessoa que não existe falha inteiro (transação)', async () => {
    await expect(repo.upsertMoment(db, moment('m1', { people: ['fantasma'] }))).rejects.toThrow();
    expect((await repo.loadAll(db)).moments).toEqual([]);
  });
});

describe('apagar', () => {
  it('apagar moment leva junto as marcações', async () => {
    await repo.upsertPerson(db, isa);
    await repo.upsertMoment(db, moment('m1'));
    await repo.deleteMoment(db, 'm1');
    expect(await db.getAllAsync('SELECT * FROM moment_people')).toEqual([]);
    expect((await repo.loadAll(db)).people).toEqual([isa]);
  });

  it('apagar story mantém os moments, só solta do story', async () => {
    await repo.upsertStory(db, story);
    await repo.upsertMoment(db, moment('m1', { people: [], storyId: 's1' }));
    await repo.deleteStory(db, 's1');
    const s = await repo.loadAll(db);
    expect(s.stories).toEqual([]);
    expect(s.moments[0].storyId).toBeUndefined();
  });

  it('wipe apaga tudo', async () => {
    await repo.saveProfile(db, profile);
    await repo.upsertStory(db, story);
    await repo.upsertPerson(db, isa);
    await repo.upsertMoment(db, moment('m1', { storyId: 's1' }));
    await repo.wipe(db);
    expect(await repo.loadAll(db)).toEqual({ profile: {}, moments: [], stories: [], people: [], faces: [] });
  });
});

describe('importação dos dados antigos', () => {
  it('parseLegacy aceita o formato antigo e recusa lixo', () => {
    expect(repo.parseLegacy(null)).toBeNull();
    expect(repo.parseLegacy('{quebrado')).toBeNull();
    expect(repo.parseLegacy('"texto"')).toBeNull();
    expect(repo.parseLegacy('{}')).toEqual({ profile: {}, moments: [], stories: [], people: [] });
  });

  it('importa e corrige referências quebradas e nomes repetidos', async () => {
    const old = repo.parseLegacy(
      JSON.stringify({
        profile,
        stories: [story],
        people: [isa, caio, { id: 'p3', name: 'isabela' }],
        moments: [
          moment('m1', { people: ['p1', 'p3', 'sumiu'], storyId: 's1' }),
          moment('m2', { people: ['p2'], storyId: 'story-apagado', date: '2026-11-11T12:00:00.000Z' }),
          { title: 'sem id' },
        ],
      }),
    )!;
    await repo.importSnapshot(db, old);
    const s = await repo.loadAll(db);
    expect(s.profile).toEqual(profile);
    expect(s.people.map((p) => p.id)).toEqual(['p1', 'p2']);
    const byId = Object.fromEntries(s.moments.map((m) => [m.id, m]));
    expect(byId.m1.people).toEqual(['p1']);
    expect(byId.m1.storyId).toBe('s1');
    expect(byId.m2.storyId).toBeUndefined();
    expect(s.moments).toHaveLength(2);
  });
});

describe('rostos', () => {
  const face = (id: string, over: Partial<Face> = {}): Face => ({
    id,
    momentId: 'm1',
    photo: 'photos/a.jpg',
    crop: `photos/faces/${id}.jpg`,
    box: { x: 0.2, y: 0.1, w: 0.25, h: 0.3 },
    status: 'new',
    createdAt: '2026-11-10T12:00:00.000Z',
    ...over,
  });

  beforeEach(async () => {
    await repo.upsertPerson(db, isa);
    await repo.upsertPerson(db, caio);
    await repo.upsertMoment(db, moment('m1', { people: ['p1'] }));
  });

  it('guarda os rostos e marca o moment como verificado', async () => {
    await repo.addFaces(db, 'm1', [face('f1', { status: 'person', personId: 'p1' }), face('f2')]);
    const s = await repo.loadAll(db);
    expect(s.moments[0].facesScanned).toBe(true);
    expect(s.faces).toHaveLength(2);
    expect(s.faces!.find((f) => f.id === 'f1')).toEqual(face('f1', { status: 'person', personId: 'p1' }));
  });

  it('moment sem rosto também fica marcado (não procura de novo)', async () => {
    await repo.addFaces(db, 'm1', []);
    expect((await repo.loadAll(db)).moments[0].facesScanned).toBe(true);
  });

  it('salvar o moment de novo não desmarca a verificação', async () => {
    await repo.addFaces(db, 'm1', [face('f1')]);
    await repo.upsertMoment(db, moment('m1', { people: ['p1'], title: 'Outro título', facesScanned: true }));
    expect((await repo.loadAll(db)).moments[0].facesScanned).toBe(true);
  });

  it('dar nome a um rosto', async () => {
    await repo.addFaces(db, 'm1', [face('f1')]);
    await repo.updateFace(db, { id: 'f1', status: 'person', personId: 'p2' });
    expect((await repo.loadAll(db)).faces![0]).toMatchObject({ status: 'person', personId: 'p2' });
    await repo.updateFace(db, { id: 'f1', status: 'me' });
    const f = (await repo.loadAll(db)).faces![0];
    expect(f.status).toBe('me');
    expect(f.personId).toBeUndefined();
  });

  it('status inválido é recusado pelo banco', async () => {
    await expect(repo.addFaces(db, 'm1', [face('f1', { status: 'talvez' as Face['status'] })])).rejects.toThrow();
  });

  it('apagar o moment apaga os rostos dele', async () => {
    await repo.addFaces(db, 'm1', [face('f1'), face('f2')]);
    await repo.deleteMoment(db, 'm1');
    expect((await repo.loadAll(db)).faces).toEqual([]);
  });

  it('juntar pessoas leva marcações, rostos e a foto', async () => {
    await repo.upsertPerson(db, { id: 'p3', name: 'Beatriz', photo: 'photos/faces/bia.jpg' });
    await repo.upsertMoment(db, moment('m2', { people: ['p3', 'p1'] }));
    await repo.upsertMoment(db, moment('m3', { people: ['p3'] }));
    await repo.addFaces(db, 'm3', [face('f3', { momentId: 'm3', status: 'person', personId: 'p3' })]);

    await repo.mergePeople(db, 'p3', 'p1');
    const s = await repo.loadAll(db);
    expect(s.people.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(s.people[0].photo).toBe('photos/faces/bia.jpg');
    const byId = Object.fromEntries(s.moments.map((m) => [m.id, m.people]));
    expect(byId.m2).toEqual(['p1']);
    expect(byId.m3).toEqual(['p1']);
    expect(s.faces![0].personId).toBe('p1');
  });

  it('wipe apaga os rostos', async () => {
    await repo.addFaces(db, 'm1', [face('f1')]);
    await repo.wipe(db);
    expect((await repo.loadAll(db)).faces).toEqual([]);
  });
});
