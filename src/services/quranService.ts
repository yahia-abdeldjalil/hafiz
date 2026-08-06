import { Surah, Ayah } from '../types';

const BASE_URL = 'https://api.alquran.cloud/v1';

export const quranService = {
  async getAllSurahs(): Promise<Surah[]> {
    const response = await fetch(`${BASE_URL}/surah`);
    const data = await response.json();
    return data.data;
  },

  async getSurahAyahs(surahNumber: number): Promise<Ayah[]> {
    const response = await fetch(`${BASE_URL}/surah/${surahNumber}`);
    const data = await response.json();
    return data.data.ayahs;
  },

  async getAyahRange(surahNumber: number, start: number, end: number): Promise<Ayah[]> {
    const ayahs = await this.getSurahAyahs(surahNumber);
    return ayahs.filter(a => a.numberInSurah >= start && a.numberInSurah <= end);
  }
};
