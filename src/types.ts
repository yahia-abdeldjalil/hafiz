export interface Surah {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  streak: number;
  lastActive: string;
  totalCorrect: number;
  totalMistakes: number;
  createdAt: string;
}

export interface SessionRecord {
  id?: string;
  userId: string;
  surahNumber: number;
  ayahRange: string;
  mode: 'next-ayah' | 'fill-blank';
  correctCount: number;
  mistakeCount: number;
  timestamp: string;
}

export interface AyahProgress {
  id?: string;
  userId: string;
  surahNumber: number;
  ayahNumber: number;
  correctCount: number;
  mistakeCount: number;
  lastAttempt: string;
}
