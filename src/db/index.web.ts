import AsyncStorage from '@react-native-async-storage/async-storage';
import { Moment, Person, Profile, Story } from '../types';
import type { Snapshot } from './repo';

/**
 * Na web (só usada para prévias), o "banco" é um JSON no localStorage.
 * No iPhone e no Android o app usa o SQLite de ./index.ts.
 */
const KEY = 'memora:v1';
let snap: Snapshot = { profile: {}, moments: [], stories: [], people: [] };
const save = () => AsyncStorage.setItem(KEY, JSON.stringify(snap)).catch(() => {});
const put = <T extends { id: string }>(list: T[], item: T) => [item, ...list.filter((x) => x.id !== item.id)];

export const persistence = {
  load: async (): Promise<Snapshot> => {
    const raw = await AsyncStorage.getItem(KEY).catch(() => null);
    if (raw) {
      const s = JSON.parse(raw) as Snapshot;
      snap = { profile: s.profile ?? {}, moments: s.moments ?? [], stories: s.stories ?? [], people: s.people ?? [] };
    }
    return snap;
  },
  saveProfile: async (p: Profile) => { snap.profile = p; await save(); },
  upsertMoment: async (m: Moment) => { snap.moments = put(snap.moments, m); await save(); },
  deleteMoment: async (id: string) => { snap.moments = snap.moments.filter((m) => m.id !== id); await save(); },
  upsertStory: async (s: Story) => { snap.stories = put(snap.stories, s); await save(); },
  deleteStory: async (id: string) => {
    snap.stories = snap.stories.filter((s) => s.id !== id);
    snap.moments = snap.moments.map((m) => (m.storyId === id ? { ...m, storyId: undefined } : m));
    await save();
  },
  upsertPerson: async (p: Person) => { snap.people = [...snap.people.filter((x) => x.id !== p.id), p]; await save(); },
  wipe: async () => { snap = { profile: {}, moments: [], stories: [], people: [] }; await save(); },
};
