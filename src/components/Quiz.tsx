import React, { useState, useEffect, useRef } from 'react';
import { Ayah, Surah } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Home, Play, Pause, Volume2 } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { calculateNextSRS, SRSState } from '../utils/srs';
import { useLanguage } from '../LanguageContext';

interface QuizProps {
  surah: Surah;
  ayahs: Ayah[];
  mode: 'next-ayah' | 'fill-blank';
  onFinish: () => void;
}

const Quiz: React.FC<QuizProps> = ({ surah, ayahs, mode, onFinish }) => {
  const { user } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [blankWord, setBlankWord] = useState('');
  const [displayAyah, setDisplayAyah] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentAyah = ayahs[currentIndex];
  const nextAyah = ayahs[currentIndex + 1];

  if (!currentAyah) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-white rounded-3xl shadow-xl border border-emerald-50 space-y-4">
        <p className="text-gray-500">{t('noAyatFound')}</p>
        <button onClick={onFinish} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold">
          {t('goBack')}
        </button>
      </div>
    );
  }

  useEffect(() => {
    // Stop audio when changing Ayah
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }

    if (mode === 'next-ayah' && nextAyah) {
      const otherAyahs = ayahs.filter((_, i) => i !== currentIndex + 1);
      const shuffled = [...otherAyahs].sort(() => 0.5 - Math.random()).slice(0, 3);
      const allOptions = [...shuffled.map(a => a.text), nextAyah.text].sort(() => 0.5 - Math.random());
      setOptions(allOptions);
    } else if (mode === 'fill-blank') {
      const words = currentAyah.text.split(' ');
      const randomIndex = Math.floor(Math.random() * words.length);
      const word = words[randomIndex];
      setBlankWord(word);
      const newWords = [...words];
      newWords[randomIndex] = '_____';
      setDisplayAyah(newWords.join(' '));
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentIndex, mode, ayahs, nextAyah, currentAyah]);

  const toggleAudio = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${currentAyah.number}.mp3`;
        audioRef.current = new Audio(audioUrl);
        audioRef.current.volume = volume;
        audioRef.current.onended = () => setIsPlaying(false);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleOptionSelect = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
    const correct = option === nextAyah.text;
    setIsCorrect(correct);
    if (correct) setCorrectCount(c => c + 1);
    else setMistakeCount(m => m + 1);
    
    updateProgress(currentAyah.numberInSurah, correct);
  };

  const handleFillSubmit = () => {
    if (selectedOption) return;
    const correct = userInput.trim() === blankWord.trim();
    setIsCorrect(correct);
    setSelectedOption(userInput);
    if (correct) setCorrectCount(c => c + 1);
    else setMistakeCount(m => m + 1);

    updateProgress(currentAyah.numberInSurah, correct);
  };

  const updateProgress = async (ayahNum: number, correct: boolean) => {
    if (!user) return;
    const progressId = `${surah.number}_${ayahNum}`;
    const progressRef = doc(db, 'users', user.uid, 'progress', progressId);
    
    try {
      const existingSnap = await getDoc(progressRef);
      let currentState: Partial<SRSState> = {};
      let prevCorrect = 0;
      let prevMistakes = 0;

      if (existingSnap.exists()) {
        const data = existingSnap.data();
        currentState = {
          interval: data.interval,
          repetition: data.repetition,
          easeFactor: data.easeFactor,
          nextReview: data.nextReview,
        };
        prevCorrect = data.correctCount || 0;
        prevMistakes = data.mistakeCount || 0;
      }

      const srsMetrics = calculateNextSRS(correct, currentState);

      await setDoc(progressRef, {
        userId: user.uid,
        surahNumber: surah.number,
        ayahNumber: ayahNum,
        correctCount: prevCorrect + (correct ? 1 : 0),
        mistakeCount: prevMistakes + (correct ? 0 : 1),
        lastAttempt: new Date().toISOString(),
        interval: srsMetrics.interval,
        repetition: srsMetrics.repetition,
        easeFactor: srsMetrics.easeFactor,
        nextReview: srsMetrics.nextReview,
      }, { merge: true });

      await updateDoc(doc(db, 'users', user.uid), {
        totalCorrect: increment(correct ? 1 : 0),
        totalMistakes: increment(correct ? 0 : 1),
        lastActive: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error updating progress:', e);
    }
  };

  const handleNext = async () => {
    const isLast = mode === 'next-ayah' ? currentIndex >= ayahs.length - 2 : currentIndex >= ayahs.length - 1;
    
    if (isLast) {
      setShowSummary(true);
      if (user && ayahs.length > 0) {
        await addDoc(collection(db, 'users', user.uid, 'sessions'), {
          userId: user.uid,
          surahNumber: surah.number,
          ayahRange: `${ayahs[0]?.numberInSurah || 0}-${ayahs[ayahs.length-1]?.numberInSurah || 0}`,
          mode,
          correctCount,
          mistakeCount,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsCorrect(null);
      setUserInput('');
    }
  };

  if (showSummary) {
    const total = correctCount + mistakeCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-2xl border border-emerald-50 text-center space-y-8"
      >
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-emerald-900">{t('sessionComplete')}</h2>
          <p className="text-gray-500">
            {t('greatJob')} {language === 'ar' ? surah.name : surah.englishName}.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50 rounded-2xl">
            <p className="text-sm text-emerald-600 font-medium">{t('correct')}</p>
            <p className="text-2xl font-bold text-emerald-900">{correctCount}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-2xl">
            <p className="text-sm text-red-600 font-medium">{t('mistakes')}</p>
            <p className="text-2xl font-bold text-red-900">{mistakeCount}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-2xl">
            <p className="text-sm text-blue-600 font-medium">{t('accuracy')}</p>
            <p className="text-2xl font-bold text-blue-900">{accuracy}%</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
          >
            <RotateCcw className="w-5 h-5" /> {t('practiceAgain')}
          </button>
          <button
            onClick={onFinish}
            className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
          >
            <Home className="w-5 h-5" /> {t('finish')}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-emerald-900">
            {language === 'ar' ? surah.name : surah.englishName}
          </h2>
          <p className="text-sm text-gray-500">
            {t('ayah')} {currentAyah.numberInSurah} {t('of')} {surah.numberOfAyahs}
          </p>
        </div>
        <div className="flex gap-4 text-sm font-medium">
          <span className="text-emerald-600">✓ {correctCount}</span>
          <span className="text-red-500">✗ {mistakeCount}</span>
        </div>
      </div>

      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
        <motion.div
          className="bg-emerald-500 h-full"
          initial={{ width: 0 }}
          animate={{ width: `${(currentIndex / (ayahs.length - 1)) * 100}%` }}
        />
      </div>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl border border-emerald-50 space-y-8"
      >
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <p className="text-sm font-medium text-emerald-600 uppercase tracking-wider">
              {mode === 'next-ayah' ? t('whatComesNext') : t('fillInBlankPrompt')}
            </p>
            <div className="flex items-center gap-2 bg-emerald-50/50 p-1.5 rounded-full border border-emerald-100">
              <button
                onClick={toggleAudio}
                className={`p-2.5 rounded-full transition-all shadow-sm ${
                  isPlaying ? 'bg-emerald-600 text-white animate-pulse' : 'bg-white text-emerald-600 hover:bg-emerald-50'
                }`}
                title={isPlaying ? t('pauseRecitation') : t('playRecitation')}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-2 px-3 border-l rtl:border-r rtl:border-l-0 border-emerald-100">
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            </div>
          </div>
          <div 
            className="font-arabic text-4xl leading-relaxed text-emerald-900 text-right rtl:text-right cursor-pointer hover:text-emerald-700 transition-colors" 
            dir="rtl"
            onClick={toggleAudio}
          >
            {mode === 'next-ayah' ? currentAyah.text : displayAyah}
          </div>
        </div>

        {mode === 'next-ayah' ? (
          <div className="grid grid-cols-1 gap-4">
            {options.map((option, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleOptionSelect(option)}
                disabled={!!selectedOption}
                className={`p-6 rounded-2xl text-right font-arabic text-xl border-2 transition-all ${
                  selectedOption === option
                    ? isCorrect
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                      : 'bg-red-50 border-red-500 text-red-900'
                    : selectedOption && option === nextAyah.text
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                    : 'bg-white border-emerald-50 hover:border-emerald-200 text-gray-700'
                }`}
                dir="rtl"
              >
                {option}
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative">
              <input
                type="text"
                placeholder={t('typeMissingWord')}
                className="w-full p-6 text-right font-arabic text-2xl bg-gray-50 border-2 border-emerald-50 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                dir="rtl"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={!!selectedOption}
                onKeyPress={(e) => e.key === 'Enter' && handleFillSubmit()}
              />
              {selectedOption && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-right font-arabic text-xl text-emerald-800" dir="rtl">
                  {t('correctWord')}: {blankWord}
                </div>
              )}
            </div>
            {!selectedOption && (
              <button
                onClick={handleFillSubmit}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all"
              >
                {t('checkAnswer')}
              </button>
            )}
          </div>
        )}

        <AnimatePresence>
          {selectedOption && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className={`flex items-center gap-2 font-bold ${isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
                {isCorrect ? (
                  <><CheckCircle2 className="w-6 h-6" /> {t('correct')}</>
                ) : (
                  <><XCircle className="w-6 h-6" /> {t('incorrect')}</>
                )}
              </div>
              <button
                onClick={handleNext}
                className="w-full py-4 bg-emerald-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all"
              >
                {t('nextAyah')} <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Quiz;
