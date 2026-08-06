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
import { TrendingUp, Award, Calendar, AlertCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [weakAyat, setWeakAyat] = useState<AyahProgress[]>([]);
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const chartData = sessions.slice().reverse().map(s => ({
    date: new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    correct: s.correctCount,
    mistakes: s.mistakeCount
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">Welcome back, {profile?.displayName}!</h1>
          <p className="text-gray-500">Here's your memorization progress at a glance.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Current Streak</p>
              <p className="text-xl font-bold text-emerald-900">{profile?.streak || 0} Days</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Correct</p>
              <p className="text-xl font-bold text-emerald-900">{profile?.totalCorrect || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-emerald-50 space-y-6"
        >
          <h2 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Recent Activity
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
            Weak Areas
          </h2>
          <div className="space-y-4">
            {weakAyat.length > 0 ? (
              weakAyat.map((ayah, i) => (
                <div key={i} className="p-4 bg-red-50 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="font-bold text-emerald-900">Surah {ayah.surahNumber}</p>
                    <p className="text-xs text-gray-500">Ayah {ayah.ayahNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{ayah.mistakeCount} mistakes</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Needs Review</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400">No weak areas identified yet. Keep practicing!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-50 space-y-6">
        <h2 className="text-xl font-bold text-emerald-900">Recent Sessions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="pb-4">Surah</th>
                <th className="pb-4">Mode</th>
                <th className="pb-4">Range</th>
                <th className="pb-4">Score</th>
                <th className="pb-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sessions.map((session) => (
                <tr key={session.id} className="text-sm">
                  <td className="py-4 font-semibold text-emerald-900">Surah {session.surahNumber}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      session.mode === 'next-ayah' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                    }`}>
                      {session.mode.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="py-4 text-gray-500">{session.ayahRange}</td>
                  <td className="py-4 font-bold text-emerald-600">
                    {session.correctCount} / {session.correctCount + session.mistakeCount}
                  </td>
                  <td className="py-4 text-gray-400">
                    {new Date(session.timestamp).toLocaleDateString()}
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
