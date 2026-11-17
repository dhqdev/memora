import AsyncStorage from '@react-native-async-storage/async-storage';
import { Face, Moment, Person, Profile, Story } from '../types';
import type { Snapshot } from './repo';

/**
 * Na web (só usada para prévias), o "banco" é um JSON no localStorage.
 * No iPhone e no Android o app usa o SQLite de ./index.ts.
 */
const KEY = 'memora:v1';
let snap: Required<Snapshot> = { profile: {}, moments: [], stories: [], people: [], faces: [] };
const save = () => AsyncStorage.setItem(KEY, JSON.stringify(snap)).catch(() => {});
const put = <T extends { id: string }>(list: T[], item: T) => [item, ...list.filter((x) => x.id !== item.id)];

export const persistence = {
  load: async (): Promise<Snapshot> => {
    const raw = await AsyncStorage.getItem(KEY).catch(() => null);
    if (raw) {
      const s = JSON.parse(raw) as Snapshot;
      snap = { profile: s.profile ?? {}, moments: s.moments ?? [], stories: s.stories ?? [], people: s.people ?? [], faces: s.faces ?? [] };
    }
    return snap;
  },
  saveProfile: async (p: Profile) => { snap.profile = p; await save(); },
  upsertMoment: async (m: Moment) => { snap.moments = put(snap.moments, m); await save(); },
  deleteMoment: async (id: string) => {
    snap.moments = snap.moments.filter((m) => m.id !== id);
    snap.faces = snap.faces.filter((f) => f.momentId !== id);
    await save();
  },
  upsertStory: async (s: Story) => { snap.stories = put(snap.stories, s); await save(); },
  deleteStory: async (id: string) => {
    snap.stories = snap.stories.filter((s) => s.id !== id);
    snap.moments = snap.moments.map((m) => (m.storyId === id ? { ...m, storyId: undefined } : m));
    await save();
  },
  upsertPerson: async (p: Person) => { snap.people = [...snap.people.filter((x) => x.id !== p.id), p]; await save(); },
  addFaces: async (momentId: string, faces: Face[]) => {
    snap.faces = [...faces, ...snap.faces.filter((f) => !faces.some((x) => x.id === f.id))];
    snap.moments = snap.moments.map((m) => (m.id === momentId ? { ...m, facesScanned: true } : m));
    await save();
  },
  updateFace: async (f: Face) => { snap.faces = snap.faces.map((x) => (x.id === f.id ? f : x)); await save(); },
  mergePeople: async (fromId: string, intoId: string) => {
    const from = snap.people.find((p) => p.id === fromId);
    snap.people = snap.people.filter((p) => p.id !== fromId).map((p) => (p.id === intoId && !p.photo ? { ...p, photo: from?.photo } : p));
    snap.moments = snap.moments.map((m) => (m.people.includes(fromId) ? { ...m, people: [...new Set(m.people.map((id) => (id === fromId ? intoId : id)))] } : m));
    snap.faces = snap.faces.map((f) => (f.personId === fromId ? { ...f, personId: intoId } : f));
    await save();
  },
  wipe: async () => { snap = { profile: {}, moments: [], stories: [], people: [], faces: [] }; await save(); },
};
