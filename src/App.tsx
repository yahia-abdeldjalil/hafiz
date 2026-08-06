import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { LanguageProvider, useLanguage } from './LanguageContext';
import Navbar from './components/Navbar';
import SurahSelector from './components/SurahSelector';
import Quiz from './components/Quiz';
import Dashboard from './components/Dashboard';
import { Surah, Ayah } from './types';
import { quranService } from './services/quranService';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Brain, Sparkles, LogIn, Trophy } from 'lucide-react';

const HomeContent: React.FC = () => {
  const { user, signIn } = useAuth();
  const { t, language } = useLanguage();
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [mode, setMode] = useState<'next-ayah' | 'fill-blank' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSurahSelect = async (surah: Surah, start: number, end: number) => {
    setLoading(true);
    try {
      const data = await quranService.getAyahRange(surah.number, start, end);
      setAyahs(data);
      setSelectedSurah(surah);
    } catch (error) {
      console.error('Error fetching ayahs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="w-24 h-24 bg-emerald-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-emerald-200">
            <BookOpen className="text-white w-12 h-12" />
          </div>
          <h1 className="text-5xl font-bold text-emerald-900 tracking-tight">
            {t('heroTitlePre')} <br />
            <span className="text-emerald-600">{t('heroTitleSub')}</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Brain, title: t('featureQuizzesTitle'), desc: t('featureQuizzesDesc') },
            { icon: Sparkles, title: t('featureAdaptiveTitle'), desc: t('featureAdaptiveDesc') },
            { icon: Trophy, title: t('featureTrackTitle'), desc: t('featureTrackDesc') },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-emerald-50 space-y-4"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mx-auto">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-emerald-900">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={signIn}
          className="inline-flex items-center px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all gap-2"
        >
          <LogIn className="w-5 h-5 rtl:rotate-180" /> {t('startJourney')}
        </motion.button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600"></div>
        <p className="text-emerald-600 font-medium animate-pulse">{t('fetchingQuran')}</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <AnimatePresence mode="wait">
        {!selectedSurah ? (
          <motion.div
            key="selector"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <SurahSelector onSelect={handleSurahSelect} />
          </motion.div>
        ) : !mode ? (
          <motion.div
            key="mode-selector"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-2xl mx-auto bg-white p-10 rounded-3xl shadow-xl border border-emerald-50 space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-emerald-900">{t('selectMode')}</h2>
              <p className="text-gray-500">
                {t('selectModeDesc')} {language === 'ar' ? selectedSurah.name : selectedSurah.englishName}?
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => {
                  if (ayahs.length < 2) {
                    alert(t('nextAyahAlert'));
                    return;
                  }
                  setMode('next-ayah');
                }}
                className="p-6 bg-emerald-50 border-2 border-emerald-100 rounded-2xl text-left rtl:text-right hover:border-emerald-500 transition-all group"
              >
                <h3 className="text-xl font-bold text-emerald-900 group-hover:text-emerald-600">{t('nextAyahMode')}</h3>
                <p className="text-sm text-gray-600">{t('nextAyahDesc')}</p>
              </button>
              <button
                onClick={() => setMode('fill-blank')}
                className="p-6 bg-emerald-50 border-2 border-emerald-100 rounded-2xl text-left rtl:text-right hover:border-emerald-500 transition-all group"
              >
                <h3 className="text-xl font-bold text-emerald-900 group-hover:text-emerald-600">{t('fillBlankMode')}</h3>
                <p className="text-sm text-gray-600">{t('fillBlankDesc')}</p>
              </button>
            </div>

            <button
              onClick={() => setSelectedSurah(null)}
              className="w-full py-4 text-gray-500 font-medium hover:text-emerald-600 transition-colors"
            >
              {t('cancelChooseAnother')}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Quiz
              surah={selectedSurah}
              ayahs={ayahs}
              mode={mode}
              onFinish={() => {
                setSelectedSurah(null);
                setMode(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FooterContent: React.FC = () => {
  const { t } = useLanguage();
  return (
    <footer className="py-8 text-center text-gray-400 text-sm">
      <p>© {new Date().getFullYear()} {t('footerRights')}</p>
    </footer>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-gray-50/50">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomeContent />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <FooterContent />
          </div>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}
