import React, { useState, useEffect } from 'react';
import { quranService } from '../services/quranService';
import { Surah } from '../types';
import { Search, ChevronRight, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

interface SurahSelectorProps {
  onSelect: (surah: Surah, start: number, end: number) => void;
}

const SurahSelector: React.FC<SurahSelectorProps> = ({ onSelect }) => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [startAyah, setStartAyah] = useState(1);
  const [endAyah, setEndAyah] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const data = await quranService.getAllSurahs();
        setSurahs(data);
        setFilteredSurahs(data);
      } catch (error) {
        console.error('Error fetching surahs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSurahs();
  }, []);

  useEffect(() => {
    const filtered = surahs.filter(
      (s) =>
        s.englishName.toLowerCase().includes(search.toLowerCase()) ||
        s.name.includes(search) ||
        s.number.toString().includes(search)
    );
    setFilteredSurahs(filtered);
  }, [search, surahs]);

  const handleSurahClick = (surah: Surah) => {
    setSelectedSurah(surah);
    setStartAyah(1);
    setEndAyah(Math.min(10, surah.numberOfAyahs));
  };

  const handleStart = () => {
    if (selectedSurah) {
      onSelect(selectedSurah, startAyah, endAyah);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {!selectedSurah ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-emerald-900">Choose a Surah</h1>
            <p className="text-gray-500">Select the Surah you want to memorize or review.</p>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or number..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-emerald-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSurahs.map((surah) => (
              <motion.button
                key={surah.number}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSurahClick(surah)}
                className="flex items-center p-4 bg-white border border-emerald-50 rounded-2xl hover:border-emerald-200 hover:shadow-md transition-all text-left group"
              >
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700 font-bold mr-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  {surah.number}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-emerald-900">{surah.englishName}</h3>
                  <p className="text-xs text-gray-500">{surah.numberOfAyahs} Ayat</p>
                </div>
                <div className="text-right">
                  <p className="font-arabic text-lg text-emerald-800">{surah.name}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-3xl shadow-xl border border-emerald-50 space-y-8"
        >
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedSurah(null)}
              className="text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4 rotate-180" /> Back to list
            </button>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-emerald-900">{selectedSurah.englishName}</h2>
              <p className="font-arabic text-xl text-emerald-600">{selectedSurah.name}</p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              Select Ayah Range
            </h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">From Ayah</label>
                <input
                  type="number"
                  min={1}
                  max={selectedSurah.numberOfAyahs}
                  value={startAyah}
                  onChange={(e) => setStartAyah(Math.max(1, Math.min(selectedSurah.numberOfAyahs, parseInt(e.target.value) || 1)))}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">To Ayah</label>
                <input
                  type="number"
                  min={startAyah}
                  max={selectedSurah.numberOfAyahs}
                  value={endAyah}
                  onChange={(e) => setEndAyah(Math.max(startAyah, Math.min(selectedSurah.numberOfAyahs, parseInt(e.target.value) || startAyah)))}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl">
              <p className="text-sm text-emerald-800">
                You will be practicing <strong>{endAyah - startAyah + 1}</strong> Ayat from Surah {selectedSurah.englishName}.
              </p>
            </div>

            <button
              onClick={handleStart}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
            >
              Start Practice
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SurahSelector;
