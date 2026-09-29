import React from 'react';
import { Bell, Menu, X, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';

interface HeaderProps {
  onToggleMobileDrawer?: () => void;
  isDrawerOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileDrawer, isDrawerOpen }) => {
  const navigate = useNavigate();
  const { language, setLanguage, user, logout, isAuthenticated } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#e8ece8] px-3 sm:px-4 md:px-8 py-2 sm:py-3.5 flex items-center justify-between transition-all">
      {/* Mobile brand & toggle */}
      <div className="flex items-center gap-2 sm:gap-3 md:hidden">
        <button
          onClick={onToggleMobileDrawer}
          className="p-1.5 text-gray-700 hover:text-agri-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle Navigation Drawer"
        >
          {isDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <Link to="/app" className="flex items-center shrink-0">
          <img
            src="/images/greenagro-logo.png"
            alt="GreenAgro"
            className="h-8 sm:h-10 w-auto object-contain"
          />
        </Link>
      </div>

      {/* Right controls: Language, Notification, User */}
      <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-5 ml-auto">
        {/* Language Switcher */}
        <div className="flex items-center bg-[#f2f6f2] p-0.5 sm:p-1 rounded-xl border border-gray-200/60 text-[11px] sm:text-xs font-semibold">
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg transition-all ${
              language === 'en'
                ? 'bg-white text-agri-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            EN
          </button>
          <span className="text-gray-300 mx-0.5">|</span>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg transition-all ${
              language === 'hi'
                ? 'bg-white text-agri-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            हिंदी
          </button>
        </div>

        {/* Notifications */}
        <button
          className="relative p-1.5 sm:p-2 text-gray-500 hover:text-agri-900 hover:bg-[#f2f6f2] rounded-xl transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* User Profile / Auth State */}
        {isAuthenticated ? (
          <>
            <Link
              to="/app/settings"
              className="flex items-center gap-2 pl-1 sm:pl-2 py-1 pr-1 rounded-xl hover:bg-[#f2f6f2] transition-colors"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-agri-200 border border-agri-300 shrink-0">
                <img
                  src="/images/farmer-hero.jpg"
                  alt={user?.name ?? 'User'}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = user?.avatarUrl || '';
                  }}
                />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-gray-900 leading-tight">{user?.name ?? ''}</span>
                <span className="text-[11px] text-gray-500 capitalize leading-tight">
                  {user?.role ?? ''}
                </span>
              </div>
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="hidden sm:flex p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-agri-800 hover:bg-agri-900 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <span>{language === 'hi' ? 'लॉग इन' : 'Log In'}</span>
          </Link>
        )}
      </div>
    </header>
  );
};
