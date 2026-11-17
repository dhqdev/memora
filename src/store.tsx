import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Moment, Person, Profile, Story } from './types';

const KEY = 'memora:v1';

export const defaultProfile: Profile = {
  onboarded: false,
  name: '',
  pronoun: 'neutro',
  interests: [],
  theme: 'light',
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
  addMoment: (m: Moment) => void;
  updateMoment: (id: string, m: Partial<Moment>) => void;
  deleteMoment: (id: string) => void;
  addStory: (s: Story) => void;
  updateStory: (id: string, s: Partial<Story>) => void;
  upsertPerson: (name: string) => Person;
  updatePerson: (id: string, p: Partial<Person>) => void;
  reset: () => void;
}

const empty: State = { profile: defaultProfile, moments: [], stories: [], people: [] };
const Ctx = createContext<Store | null>(null);

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw) as State;
          setState({
            ...empty,
            ...saved,
            profile: { ...defaultProfile, ...saved.profile },
            // um comentário que ficou "escrevendo" quando o app fechou não vai mais chegar
            moments: (saved.moments ?? []).map((m) => (m.commentPending ? { ...m, commentPending: false } : m)),
          });
        }
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const updateProfile = useCallback(
    (p: Partial<Profile>) => setState((s) => ({ ...s, profile: { ...s.profile, ...p } })),
    [],
  );

  const addMoment = useCallback(
    (m: Moment) => setState((s) => ({ ...s, moments: [m, ...s.moments] })),
    [],
  );
  const updateMoment = useCallback(
    (id: string, m: Partial<Moment>) =>
      setState((s) => ({ ...s, moments: s.moments.map((x) => (x.id === id ? { ...x, ...m } : x)) })),
    [],
  );
  const deleteMoment = useCallback(
    (id: string) => setState((s) => ({ ...s, moments: s.moments.filter((x) => x.id !== id) })),
    [],
  );

  const addStory = useCallback((st: Story) => setState((s) => ({ ...s, stories: [st, ...s.stories] })), []);
  const updateStory = useCallback(
    (id: string, st: Partial<Story>) =>
      setState((s) => ({ ...s, stories: s.stories.map((x) => (x.id === id ? { ...x, ...st } : x)) })),
    [],
  );

  const upsertPerson = useCallback(
    (name: string) => {
      const clean = name.replace(/^@/, '').trim();
      const found = state.people.find((p) => p.name.toLowerCase() === clean.toLowerCase());
      if (found) return found;
      const person: Person = { id: uid(), name: clean };
      setState((s) => ({ ...s, people: [...s.people, person] }));
      return person;
    },
    [state.people],
  );
  const updatePerson = useCallback(
    (id: string, p: Partial<Person>) =>
      setState((s) => ({ ...s, people: s.people.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
    [],
  );

  const reset = useCallback(() => setState(empty), []);

  const value = useMemo(
    () => ({
      ...state,
      ready,
      updateProfile,
      addMoment,
      updateMoment,
      deleteMoment,
      addStory,
      updateStory,
      upsertPerson,
      updatePerson,
      reset,
    }),
    [state, ready, updateProfile, addMoment, updateMoment, deleteMoment, addStory, updateStory, upsertPerson, updatePerson, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore precisa estar dentro de <StoreProvider>');
  return ctx;
}
