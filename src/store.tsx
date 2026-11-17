import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { persistence } from './db';
import { deletePhotos, wipePhotos } from './photos';
import { peopleAfterFaceChange } from './faces/logic';
import { Face, Moment, Person, Profile, Story } from './types';

export const defaultProfile: Profile = {
  onboarded: false,
  name: '',
  handle: '',
  bio: '',
  pronoun: 'neutro',
  interests: [],
  theme: 'system',
  voice: true,
  haptics: true,
  showBuddy: true,
  faces: true,
  reminder: 'off',
  plus: false,
  commentsUsed: 0,
};

interface State {
  profile: Profile;
  moments: Moment[];
  stories: Story[];
  people: Person[];
  faces: Face[];
}

/** De quem é um rosto: alguém (personId), você, ninguém, ou volta a ficar sem nome. */
export type FaceOwner = { personId: string } | 'me' | 'ignored' | 'new';

interface Store extends State {
  ready: boolean;
  updateProfile: (p: Partial<Profile>) => void;
  /** Conta um comentário da Lumi (limite do plano grátis). */
  countComment: () => void;
  addMoment: (m: Moment) => void;
  updateMoment: (id: string, m: Partial<Moment>) => void;
  deleteMoment: (id: string) => void;
  addStory: (s: Story) => void;
  updateStory: (id: string, s: Partial<Story>) => void;
  deleteStory: (id: string) => void;
  upsertPerson: (name: string) => Person;
  updatePerson: (id: string, p: Partial<Person>) => void;
  /** Rostos achados nas fotos de um moment (marca o moment como verificado). */
  addFaces: (momentId: string, faces: Face[]) => void;
  setFaceOwner: (faceId: string, owner: FaceOwner) => void;
  /** Junta duas pessoas que são a mesma: tudo de `fromId` vai para `intoId`. */
  mergePeople: (fromId: string, intoId: string) => void;
  reset: () => void;
}

const empty: State = { profile: defaultProfile, moments: [], stories: [], people: [], faces: [] };
const Ctx = createContext<Store | null>(null);

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const byDateDesc = (a: Moment, b: Moment) => +new Date(b.date) - +new Date(a.date);

/**
 * Estado global. A fonte da verdade é `ref.current` (sempre o mais novo, mesmo
 * com várias ações seguidas); o React só recebe a cópia para redesenhar.
 * Cada ação grava no banco local (SQLite) — ver src/db.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<State>(empty);
  const [state, setState] = useState<State>(empty);
  const [ready, setReady] = useState(false);

  const commit = useCallback((next: State) => {
    ref.current = next;
    setState(next);
  }, []);

  useEffect(() => {
    persistence
      .load()
      .then((s) => {
        commit({
          profile: { ...defaultProfile, ...s.profile },
          moments: [...s.moments].sort(byDateDesc),
          stories: s.stories,
          people: s.people,
          faces: s.faces ?? [],
        });
      })
      .catch((e) => console.warn('[memora/store] falha ao carregar', e))
      .finally(() => setReady(true));
  }, [commit]);

  const updateProfile = useCallback(
    (p: Partial<Profile>) => {
      const profile = { ...ref.current.profile, ...p };
      commit({ ...ref.current, profile });
      persistence.saveProfile(profile);
    },
    [commit],
  );

  const countComment = useCallback(() => {
    const profile = { ...ref.current.profile, commentsUsed: ref.current.profile.commentsUsed + 1 };
    commit({ ...ref.current, profile });
    persistence.saveProfile(profile);
  }, [commit]);

  const addMoment = useCallback(
    (m: Moment) => {
      commit({ ...ref.current, moments: [m, ...ref.current.moments].sort(byDateDesc) });
      persistence.upsertMoment(m);
    },
    [commit],
  );

  const updateMoment = useCallback(
    (id: string, patch: Partial<Moment>) => {
      const cur = ref.current.moments.find((x) => x.id === id);
      if (!cur) return;
      const m = { ...cur, ...patch };
      commit({ ...ref.current, moments: ref.current.moments.map((x) => (x.id === id ? m : x)) });
      persistence.upsertMoment(m);
    },
    [commit],
  );

  const deleteMoment = useCallback(
    (id: string) => {
      const gone = ref.current.moments.find((x) => x.id === id);
      const faces = ref.current.faces.filter((f) => f.momentId === id);
      commit({
        ...ref.current,
        moments: ref.current.moments.filter((x) => x.id !== id),
        faces: ref.current.faces.filter((f) => f.momentId !== id),
      });
      persistence.deleteMoment(id); // os rostos saem junto no banco (ON DELETE CASCADE)
      if (gone) deletePhotos([...gone.photos, ...faces.map((f) => f.crop)]);
    },
    [commit],
  );

  const addStory = useCallback(
    (st: Story) => {
      commit({ ...ref.current, stories: [st, ...ref.current.stories] });
      persistence.upsertStory(st);
    },
    [commit],
  );

  const updateStory = useCallback(
    (id: string, patch: Partial<Story>) => {
      const cur = ref.current.stories.find((x) => x.id === id);
      if (!cur) return;
      const st = { ...cur, ...patch };
      commit({ ...ref.current, stories: ref.current.stories.map((x) => (x.id === id ? st : x)) });
      persistence.upsertStory(st);
    },
    [commit],
  );

  const deleteStory = useCallback(
    (id: string) => {
      commit({
        ...ref.current,
        stories: ref.current.stories.filter((x) => x.id !== id),
        // os moments continuam; só deixam de pertencer ao story
        moments: ref.current.moments.map((m) => (m.storyId === id ? { ...m, storyId: undefined } : m)),
      });
      persistence.deleteStory(id);
    },
    [commit],
  );

  const upsertPerson = useCallback(
    (name: string) => {
      const clean = name.replace(/^@/, '').trim();
      const found = ref.current.people.find((p) => p.name.toLowerCase() === clean.toLowerCase());
      if (found) return found;
      const person: Person = { id: uid(), name: clean };
      commit({ ...ref.current, people: [...ref.current.people, person] });
      persistence.upsertPerson(person);
      return person;
    },
    [commit],
  );

  const updatePerson = useCallback(
    (id: string, patch: Partial<Person>) => {
      const cur = ref.current.people.find((x) => x.id === id);
      if (!cur) return;
      const p = { ...cur, ...patch };
      commit({ ...ref.current, people: ref.current.people.map((x) => (x.id === id ? p : x)) });
      persistence.upsertPerson(p);
    },
    [commit],
  );

  /** A pessoa ganha o rosto como foto se ainda não tiver uma. */
  const giveAvatar = (people: Person[], personId: string, crop: string) => {
    const p = people.find((x) => x.id === personId);
    if (!p || p.photo) return people;
    const next = { ...p, photo: crop };
    persistence.upsertPerson(next);
    return people.map((x) => (x.id === personId ? next : x));
  };

  const addFaces = useCallback(
    (momentId: string, faces: Face[]) => {
      const cur = ref.current;
      const m = cur.moments.find((x) => x.id === momentId);
      if (!m) return deletePhotos(faces.map((f) => f.crop)); // o moment foi apagado no meio do caminho
      let people = cur.people;
      for (const f of faces) if (f.status === 'person' && f.personId) people = giveAvatar(people, f.personId, f.crop);
      commit({
        ...cur,
        people,
        faces: [...faces, ...cur.faces],
        moments: cur.moments.map((x) => (x.id === momentId ? { ...x, facesScanned: true } : x)),
      });
      persistence.addFaces(momentId, faces);
    },
    [commit],
  );

  const setFaceOwner = useCallback(
    (faceId: string, owner: FaceOwner) => {
      const cur = ref.current;
      const face = cur.faces.find((f) => f.id === faceId);
      if (!face) return;
      const prev = face.status === 'person' ? face.personId : undefined;
      const next: Face =
        typeof owner === 'object'
          ? { ...face, status: 'person', personId: owner.personId }
          : { ...face, status: owner, personId: undefined };
      const faces = cur.faces.map((f) => (f.id === faceId ? next : f));
      let { people, moments, profile } = cur;

      const moment = moments.find((m) => m.id === face.momentId);
      if (moment) {
        const ids = peopleAfterFaceChange(moment, faces, people, prev, next.personId);
        if (ids !== moment.people) {
          const m = { ...moment, people: ids };
          moments = moments.map((x) => (x.id === m.id ? m : x));
          persistence.upsertMoment(m);
        }
      }
      if (next.personId) people = giveAvatar(people, next.personId, face.crop);
      if (owner === 'me' && !profile.photo) {
        profile = { ...profile, photo: face.crop };
        persistence.saveProfile(profile);
      }
      commit({ ...cur, faces, people, moments, profile });
      persistence.updateFace(next);
    },
    [commit],
  );

  const mergePeople = useCallback(
    (fromId: string, intoId: string) => {
      const cur = ref.current;
      const from = cur.people.find((p) => p.id === fromId);
      if (!from || fromId === intoId || !cur.people.some((p) => p.id === intoId)) return;
      commit({
        ...cur,
        people: cur.people.filter((p) => p.id !== fromId).map((p) => (p.id === intoId && !p.photo ? { ...p, photo: from.photo } : p)),
        moments: cur.moments.map((m) =>
          m.people.includes(fromId) ? { ...m, people: [...new Set(m.people.map((id) => (id === fromId ? intoId : id)))] } : m,
        ),
        faces: cur.faces.map((f) => (f.personId === fromId ? { ...f, personId: intoId } : f)),
      });
      persistence.mergePeople(fromId, intoId);
    },
    [commit],
  );

  const reset = useCallback(() => {
    commit(empty);
    persistence.wipe();
    wipePhotos();
  }, [commit]);

  const value = useMemo(
    () => ({
      ...state,
      ready,
      updateProfile,
      countComment,
      addMoment,
      updateMoment,
      deleteMoment,
      addStory,
      updateStory,
      deleteStory,
      upsertPerson,
      updatePerson,
      addFaces,
      setFaceOwner,
      mergePeople,
      reset,
    }),
    [state, ready, updateProfile, countComment, addMoment, updateMoment, deleteMoment, addStory, updateStory, deleteStory, upsertPerson, updatePerson, addFaces, setFaceOwner, mergePeople, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore precisa estar dentro de <StoreProvider>');
  return ctx;
}
