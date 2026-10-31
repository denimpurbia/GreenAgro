import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  Menu,
  X,
  LogOut,
  Check,
  AlertTriangle,
  CloudRain,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

interface HeaderProps {
  onToggleMobileDrawer?: () => void;
  isDrawerOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileDrawer, isDrawerOpen }) => {
  const navigate = useNavigate();
  const { language, setLanguage, user, logout, isAuthenticated } = useApp();

  const [alerts, setAlerts] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isHi = language === 'hi';

  const avatarSrc =
    (user?.avatarUrl && user.avatarUrl !== '/images/farmer-hero.jpg'
      ? user.avatarUrl
      : null) ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('agrin_profile_photo')
      : null) ||
    user?.avatarUrl ||
    '/images/farmer-hero.jpg';

  const fetchAlerts = useCallback(async () => {
    if (!isAuthenticated) return;
    const token = authService.getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/alerts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.alerts)) {
          setAlerts(data.alerts);
        }
      }
    } catch (err) {
      console.warn('[Header] Alerts fetch note:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 45000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleMarkAllRead = async () => {
    const token = authService.getToken();
    if (!token) return;
    try {
      await fetch(`${API_BASE}/alerts/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    } catch (err) {
      console.warn('[Header] Mark all read note:', err);
    }
  };

  const handleMarkRead = async (id: string) => {
    const token = authService.getToken();
    if (!token) return;
    try {
      await fetch(`${API_BASE}/alerts/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts((prev) => prev.map((a) => (a._id === id ? { ...a, isRead: true } : a)));
    } catch (err) {
      console.warn('[Header] Mark read note:', err);
    }
  };

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const getAlertIcon = (category: string, severity: string) => {
    if (
      category === 'heavy_rainfall' ||
      category === 'thunderstorm' ||
      category === 'weather_alert'
    ) {
      return <CloudRain className="w-4 h-4 text-sky-600 shrink-0" />;
    }
    if (severity === 'critical') {
      return <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />;
    }
    return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
  };

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

        {/* Notifications Bell with Interactive Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className={`relative p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
              isDropdownOpen
                ? 'bg-agri-100 text-agri-900 ring-2 ring-agri-300'
                : 'text-gray-600 hover:text-agri-900 hover:bg-[#f2f6f2]'
            }`}
            aria-label="Notifications"
            title={isHi ? 'अलर्ट एवं सूचनाएं' : 'Notifications & Alerts'}
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-xs animate-in zoom-in">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 sm:right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-96 max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Dropdown Header */}
              <div className="p-3.5 bg-gradient-to-r from-[#0f291e] to-[#156637] text-white flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-300" />
                  <span className="text-xs sm:text-sm font-bold">
                    {isHi ? 'अलर्ट एवं सूचनाएं' : 'Notifications & Alerts'}
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500 text-[10px] font-bold">
                      {unreadCount} {isHi ? 'नए' : 'new'}
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-emerald-200 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isHi ? 'सभी पढ़ें' : 'Mark all read'}</span>
                  </button>
                )}
              </div>

              {/* Alerts List */}
              <div className="max-h-80 sm:max-h-96 overflow-y-auto divide-y divide-gray-100">
                {alerts.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 space-y-2">
                    <Sparkles className="w-8 h-8 mx-auto text-gray-300" />
                    <p className="text-xs font-semibold">
                      {isHi ? 'कोई नई सूचना नहीं है' : 'No active notifications'}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {isHi
                        ? 'प्रशासनिक व मौसम चेतावनी यहाँ दिखाई देंगी।'
                        : 'Real weather & administrative alerts will appear here.'}
                    </p>
                  </div>
                ) : (
                  alerts.slice(0, 10).map((alert) => {
                    const alertTitle = isHi ? alert.titleHi || alert.title : alert.title;
                    const alertMsg = isHi ? alert.messageHi || alert.message : alert.message;

                    return (
                      <div
                        key={alert._id}
                        onClick={() => {
                          if (!alert.isRead) handleMarkRead(alert._id);
                        }}
                        className={`p-3.5 hover:bg-gray-50/80 transition-colors cursor-pointer flex gap-3 ${
                          alert.isRead ? 'bg-white opacity-75' : 'bg-emerald-50/20'
                        }`}
                      >
                        <div className="mt-0.5 p-1.5 rounded-lg bg-white border border-gray-100 shadow-2xs shrink-0 h-fit">
                          {getAlertIcon(alert.category, alert.severity)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-xs font-bold text-gray-900 truncate">
                              {alertTitle}
                            </span>
                            {!alert.isRead && (
                              <span className="w-2 h-2 rounded-full bg-agri-600 shrink-0 animate-pulse" />
                            )}
                          </div>
                          <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                            {alertMsg}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                            <span className="capitalize font-semibold text-agri-800">
                              {alert.category ? alert.category.replace(/_/g, ' ') : 'Advisory'}
                            </span>
                            <span>•</span>
                            <span>
                              {alert.createdAt
                                ? new Date(alert.createdAt).toLocaleDateString()
                                : 'Recent'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
                <Link
                  to="/app/alerts"
                  onClick={() => setIsDropdownOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-agri-800 hover:text-agri-950 transition-colors py-1 px-3 w-full"
                >
                  <span>{isHi ? 'सभी अलर्ट देखें' : 'View All Alerts'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile / Auth State */}
        {isAuthenticated ? (
          <>
            <Link
              to="/app/settings"
              className="flex items-center gap-2 pl-1 sm:pl-2 py-1 pr-1 rounded-xl hover:bg-[#f2f6f2] transition-colors"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-agri-200 border border-agri-300 shrink-0">
                <img
                  src={avatarSrc}
                  alt={user?.name ?? 'User'}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith('/images/farmer-hero.jpg')) {
                      target.src = '/images/farmer-hero.jpg';
                    }
                  }}
                />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-gray-900 leading-tight">{user?.name ?? ''}</span>
                <span className="text-[11px] text-gray-500 leading-tight">
                  {user?.role === 'govt_org' ? 'Govt / Org' : 'Farmer'}
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
