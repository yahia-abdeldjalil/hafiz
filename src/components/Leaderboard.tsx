import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { motion } from 'motion/react';
import { Trophy, Medal, Flame, Star, Crown, User as UserIcon } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [tab, setTab] = useState<'total' | 'streak'>('total');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const field = tab === 'total' ? 'totalCorrect' : 'streak';
        const q = query(
          collection(db, 'users'),
          orderBy(field, 'desc'),
          limit(10)
        );
        const snap = await getDocs(q);
        const usersList: UserProfile[] = snap.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        } as UserProfile));
        setTopUsers(usersList);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [tab]);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold shadow-inner">
            <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
            <Medal className="w-5 h-5 text-slate-400 fill-slate-300" />
          </div>
        );
      case 3:
        return (
          <div className="w-8 h-8 rounded-full bg-amber-700/10 text-amber-800 flex items-center justify-center font-bold">
            <Medal className="w-5 h-5 text-amber-700 fill-amber-600" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-semibold text-xs">
            #{rank}
          </div>
        );
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-50 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-emerald-900">{t('globalLeaderboard')}</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">{t('leaderboardDesc')}</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setTab('total')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'total'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-500" />
            {t('memorizedAyat')}
          </button>
          <button
            onClick={() => setTab('streak')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'streak'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            {t('streakDays')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : topUsers.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No users on the leaderboard yet.
        </div>
      ) : (
        <div className="space-y-2">
          {topUsers.map((u, index) => {
            const rank = index + 1;
            const isCurrentUser = user?.uid === u.uid;

            return (
              <motion.div
                key={u.uid}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`flex items-center justify-between p-3.5 rounded-2xl transition-all border ${
                  isCurrentUser
                    ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400'
                    : rank === 1
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-white border-gray-100 hover:border-emerald-100'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {getRankBadge(rank)}

                  {u.photoURL ? (
                    <img
                      src={u.photoURL}
                      alt={u.displayName || 'User'}
                      className="w-10 h-10 rounded-full object-cover border border-emerald-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                      <UserIcon className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-emerald-900 truncate text-sm">
                        {u.displayName || u.email?.split('@')[0] || 'Anonymous'}
                      </p>
                      {isCurrentUser && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-full uppercase tracking-wider">
                          {t('you')}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">
                      {u.streak || 0} {t('streakDays')} • {u.totalCorrect || 0} {t('ayat')}
                    </p>
                  </div>
                </div>

                <div className="text-right rtl:text-left pl-3 rtl:pl-0 rtl:pr-3">
                  <p className="font-black text-emerald-800 text-base">
                    {tab === 'total' ? (u.totalCorrect || 0) : (u.streak || 0)}
                  </p>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    {tab === 'total' ? t('ayat') : t('days')}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
