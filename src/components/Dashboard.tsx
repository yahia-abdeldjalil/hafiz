import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { SessionRecord, AyahProgress } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { motion } from 'motion/react';
import { TrendingUp, Award, Calendar, AlertCircle, Clock, CheckCircle, BrainCircuit, Target, Edit2, Check } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import Leaderboard from './Leaderboard';

const CircularProgressRing: React.FC<{
  current: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}> = ({ current, goal, size = 120, strokeWidth = 10 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(100, Math.round((current / Math.max(1, goal)) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const isGoalReached = current >= goal && goal > 0;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-emerald-100"
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          strokeLinecap="round"
          fill="transparent"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isGoalReached ? '#f59e0b' : '#059669'} />
            <stop offset="100%" stopColor={isGoalReached ? '#10b981' : '#10b981'} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className={`text-2xl font-black ${isGoalReached ? 'text-amber-600' : 'text-emerald-900'}`}>
          {percentage}%
        </span>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          {current}/{goal}
        </span>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [weakAyat, setWeakAyat] = useState<AyahProgress[]>([]);
  const [srsReviews, setSrsReviews] = useState<AyahProgress[]>([]);
  const [loading, setLoading] = useState(true);

  // Daily Goal state
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    const saved = localStorage.getItem('hafiz_daily_goal');
    return saved ? parseInt(saved, 10) || 10 : 10;
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(dailyGoal.toString());

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const sessionsQuery = query(
          collection(db, 'users', user.uid, 'sessions'),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        const sessionsSnap = await getDocs(sessionsQuery);
        setSessions(sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SessionRecord)));

        const progressQuery = query(
          collection(db, 'users', user.uid, 'progress'),
          where('mistakeCount', '>', 0),
          orderBy('mistakeCount', 'desc'),
          limit(5)
        );
        const progressSnap = await getDocs(progressQuery);
        setWeakAyat(progressSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AyahProgress)));

        // Fetch all progress records to evaluate SRS schedules
        const srsQuery = query(collection(db, 'users', user.uid, 'progress'), limit(20));
        const srsSnap = await getDocs(srsQuery);
        const allProgress = srsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AyahProgress));
        setSrsReviews(allProgress);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleSaveGoal = () => {
    const val = Math.max(1, Math.min(100, parseInt(goalInput, 10) || 10));
    setDailyGoal(val);
    localStorage.setItem('hafiz_daily_goal', val.toString());
    setIsEditingGoal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const now = new Date();
  const todayStr = now.toDateString();

  // Calculate today's completed Ayat from sessions
  const todayCompletedCount = sessions
    .filter(s => new Date(s.timestamp).toDateString() === todayStr)
    .reduce((sum, s) => sum + (s.correctCount || 0), 0);

  const isGoalReached = todayCompletedCount >= dailyGoal;

  const dueForReview = srsReviews.filter(p => p.nextReview && new Date(p.nextReview) <= now);
  const scheduledReviews = srsReviews.filter(p => p.nextReview && new Date(p.nextReview) > now);

  const chartData = sessions.slice().reverse().map(s => ({
    date: new Date(s.timestamp).toLocaleDateString(language === 'ar' ? 'ar-EG' : undefined, { month: 'short', day: 'numeric' }),
    correct: s.correctCount,
    mistakes: s.mistakeCount
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">
            {t('welcomeBack')}{profile?.displayName ? `, ${profile.displayName}` : ''}!
          </h1>
          <p className="text-gray-500">{t('memorizationProgressGlance')}</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{t('currentStreak')}</p>
              <p className="text-xl font-bold text-emerald-900">
                {profile?.streak || 0} {profile?.streak === 1 ? t('day') : t('days')}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{t('totalCorrect')}</p>
              <p className="text-xl font-bold text-emerald-900">{profile?.totalCorrect || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Goal Circular Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="flex items-center gap-6 flex-1">
          <CircularProgressRing current={todayCompletedCount} goal={dailyGoal} size={130} strokeWidth={12} />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <Target className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-emerald-900">{t('dailyGoal')}</h2>
            </div>
            <p className="text-sm text-gray-500">{t('dailyGoalDesc')}</p>
            
            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <span className="text-lg font-bold text-emerald-900">
                {todayCompletedCount} / {dailyGoal} {t('ayat')}
              </span>
              {isGoalReached && (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full border border-amber-200">
                  {t('goalReached')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Goal Setting Control */}
        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100/60 w-full md:w-auto flex flex-col items-center md:items-end gap-2">
          <span className="text-xs font-semibold text-emerald-800">{t('targetGoal')}</span>
          {isEditingGoal ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-20 p-2 text-center bg-white border border-emerald-300 rounded-xl font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleSaveGoal}
                className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                title={t('saveGoal')}
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-emerald-900">{dailyGoal} {t('ayat')}</span>
              <button
                onClick={() => {
                  setGoalInput(dailyGoal.toString());
                  setIsEditingGoal(true);
                }}
                className="p-2 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors"
                title={t('editGoal')}
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex gap-1.5 pt-1">
            {[5, 10, 15, 20].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setDailyGoal(preset);
                  setGoalInput(preset.toString());
                  localStorage.setItem('hafiz_daily_goal', preset.toString());
                  setIsEditingGoal(false);
                }}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                  dailyGoal === preset
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* SRS Spaced Repetition Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-900 text-white p-6 rounded-3xl shadow-lg space-y-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-800 rounded-2xl flex items-center justify-center text-emerald-300">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t('srsTitle')}</h2>
              <p className="text-emerald-200 text-sm">{t('srsSubtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-800/80 px-4 py-2 rounded-xl text-center">
              <p className="text-xs text-emerald-300 font-medium">{t('dueNow')}</p>
              <p className="text-2xl font-bold text-amber-300">{dueForReview.length}</p>
            </div>
            <div className="bg-emerald-800/80 px-4 py-2 rounded-xl text-center">
              <p className="text-xs text-emerald-300 font-medium">{t('scheduled')}</p>
              <p className="text-2xl font-bold text-emerald-100">{scheduledReviews.length}</p>
            </div>
          </div>
        </div>

        {srsReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {srsReviews.slice(0, 6).map((item) => {
              const isDue = item.nextReview && new Date(item.nextReview) <= now;
              return (
                <div 
                  key={item.id || `${item.surahNumber}_${item.ayahNumber}`}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDue 
                      ? 'bg-amber-500/10 border-amber-400/30 text-amber-100' 
                      : 'bg-emerald-800/40 border-emerald-700/50 text-emerald-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-white">
                        {t('surah')} {item.surahNumber}, {t('ayah')} {item.ayahNumber}
                      </p>
                      <p className="text-xs opacity-80 mt-1">
                        {t('interval')}: {item.interval || 1} {t('days')} • {t('repetitions')}: {item.repetition || 0}
                      </p>
                    </div>
                    {isDue ? (
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-400 text-emerald-950 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {t('due')}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-800 text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {t('scheduled')}
                      </span>
                    )}
                  </div>
                  {item.nextReview && (
                    <p className="text-[11px] opacity-70 mt-3 pt-2 border-t border-emerald-700/40">
                      {t('nextReview')}: {new Date(item.nextReview).toLocaleDateString(language === 'ar' ? 'ar-EG' : undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-emerald-200">{t('srsEmpty')}</p>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-emerald-50 space-y-6"
        >
          <h2 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            {t('recentActivity')}
          </h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCorrect" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="correct" stroke="#10b981" fillOpacity={1} fill="url(#colorCorrect)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-50 space-y-6"
        >
          <h2 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            {t('weakAreas')}
          </h2>
          <div className="space-y-4">
            {weakAyat.length > 0 ? (
              weakAyat.map((ayah, i) => (
                <div key={i} className="p-4 bg-red-50 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="font-bold text-emerald-900">{t('surah')} {ayah.surahNumber}</p>
                    <p className="text-xs text-gray-500">{t('ayah')} {ayah.ayahNumber}</p>
                  </div>
                  <div className="text-right rtl:text-left">
                    <p className="text-sm font-bold text-red-600">{ayah.mistakeCount} {t('mistakes')}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t('needsReview')}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400">{t('noWeakAreas')}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Global Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Leaderboard />
      </motion.div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-50 space-y-6">
        <h2 className="text-xl font-bold text-emerald-900">{t('recentSessions')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right">
            <thead>
              <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="pb-4">{t('surah')}</th>
                <th className="pb-4">{t('mode')}</th>
                <th className="pb-4">{t('range')}</th>
                <th className="pb-4">{t('score')}</th>
                <th className="pb-4">{t('date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sessions.map((session) => (
                <tr key={session.id} className="text-sm">
                  <td className="py-4 font-semibold text-emerald-900">{t('surah')} {session.surahNumber}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      session.mode === 'next-ayah' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                    }`}>
                      {session.mode === 'next-ayah' ? t('nextAyahMode') : t('fillBlankMode')}
                    </span>
                  </td>
                  <td className="py-4 text-gray-500">{session.ayahRange}</td>
                  <td className="py-4 font-bold text-emerald-600">
                    {session.correctCount} / {session.correctCount + session.mistakeCount}
                  </td>
                  <td className="py-4 text-gray-400">
                    {new Date(session.timestamp).toLocaleDateString(language === 'ar' ? 'ar-EG' : undefined)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
