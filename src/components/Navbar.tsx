import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Trophy, LogOut, Menu, X, Globe } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

const Navbar: React.FC = () => {
  const { user, profile, logout, signIn } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { name: t('memorize'), path: '/', icon: BookOpen },
    { name: t('dashboard'), path: '/dashboard', icon: Trophy },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-emerald-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <BookOpen className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-bold text-emerald-900 tracking-tight">{t('appTitle')}</span>
            </Link>
            <div className="hidden sm:flex sm:space-x-4 ltr:sm:space-x-4 rtl:sm:space-x-reverse">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-gray-500 hover:text-emerald-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-4 h-4 mx-2" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden sm:flex sm:items-center gap-4">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all"
              title={language === 'en' ? 'Switch to Arabic' : 'التحويل إلى الإنجليزية'}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end rtl:items-start">
                  <span className="text-sm font-semibold text-gray-900">{profile?.displayName}</span>
                  <span className="text-xs text-emerald-600 font-medium">
                    {t('streak')}: {profile?.streak || 0} {profile?.streak === 1 ? t('day') : t('days')}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title={t('logout')}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={signIn}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all"
              >
                {t('signIn')}
              </button>
            )}
          </div>

          <div className="flex items-center sm:hidden gap-2">
            <button
              onClick={toggleLanguage}
              className="p-2 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg"
            >
              {language === 'en' ? 'عربي' : 'EN'}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-gray-100 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden bg-white border-b border-emerald-50"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.path)
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-gray-500 hover:text-emerald-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mx-3" />
                    {item.name}
                  </div>
                </Link>
              ))}
              {!user && (
                <button
                  onClick={() => {
                    signIn();
                    setIsOpen(false);
                  }}
                  className="w-full text-left rtl:text-right px-3 py-2 rounded-md text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  {t('signIn')}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
