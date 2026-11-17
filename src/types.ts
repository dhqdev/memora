export type Pronoun = 'ele' | 'ela' | 'neutro';
export type ThemeMode = 'light' | 'dark' | 'system';
export type Reminder = 'off' | '21' | '22';

export interface Place {
  name: string;
  latitude: number;
  longitude: number;
}

export interface Moment {
  id: string;
  title: string;
  text: string;
  photos: string[];
  people: string[]; // person ids
  place?: Place;
  date: string; // ISO
  storyId?: string;
  companionComment?: string;
}

export interface Story {
  id: string;
  title: string;
  category: string; // ex.: "Dia a dia", "Amigos"
  year: number;
  body?: string; // capítulo escrito pela Lumi
  updatedAt: string;
}

export interface Person {
  id: string;
  name: string;
  photo?: string;
  note?: string; // descrição curta escrita pela Lumi
}

export interface Profile {
  onboarded: boolean;
  name: string;
  pronoun: Pronoun;
  interests: string[];
  theme: ThemeMode;
  voice: boolean;
  haptics: boolean;
  showBuddy: boolean;
  reminder: Reminder;
  plus: boolean;
  commentsUsed: number;
}

export const FREE_COMMENTS = 10;
export const FREE_STORIES = 4;
