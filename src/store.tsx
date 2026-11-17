import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { persistence } from './db';
import { deletePhotos, wipePhotos } from './photos';
import { Moment, Person, Profile, Story } from './types';

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
  reminder: 'off',
  plus: false,
  commentsUsed: 0,
};

interface State {
  profile: Profile;
  moments: Moment[];
  stories: Story[];
  people: Person[];
}

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
  reset: () => void;
}

const empty: State = { profile: defaultProfile, moments: [], stories: [], people: [] };
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
      commit({ ...ref.current, moments: ref.current.moments.filter((x) => x.id !== id) });
      persistence.deleteMoment(id);
      if (gone) deletePhotos(gone.photos);
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
      reset,
    }),
    [state, ready, updateProfile, countComment, addMoment, updateMoment, deleteMoment, addStory, updateStory, deleteStory, upsertPerson, updatePerson, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore precisa estar dentro de <StoreProvider>');
  return ctx;
}
