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
  commentPending?: boolean; // a Lumi está escrevendo o comentário
  commentAt?: string; // quando o comentário chegou (anima só os recentes)
  facesScanned?: boolean; // já procuramos rostos nas fotos deste moment
}

/**
 * Um rosto encontrado numa foto (detecção feita no aparelho).
 * `status`: new = ainda sem nome · person = é alguém (personId) · me = é você · ignored = não é ninguém
 */
export type FaceStatus = 'new' | 'person' | 'me' | 'ignored';

export interface Face {
  id: string;
  momentId: string;
  photo: string; // foto de onde saiu
  crop: string; // recorte quadrado do rosto (caminho relativo, ver src/photos.ts)
  box: { x: number; y: number; w: number; h: number }; // posição na foto, de 0 a 1
  personId?: string;
  status: FaceStatus;
  createdAt: string;
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
  handle: string; // @usuario, sem o @
  bio: string;
  photo?: string; // caminho relativo (ver src/photos.ts)
  joinedAt?: string;
  pronoun: Pronoun;
  interests: string[];
  theme: ThemeMode;
  voice: boolean;
  haptics: boolean;
  showBuddy: boolean;
  faces: boolean; // procurar rostos nas fotos (no aparelho)
  reminder: Reminder;
  plus: boolean;
  commentsUsed: number;
}

export const FREE_COMMENTS = 10;
export const FREE_STORIES = 4;
