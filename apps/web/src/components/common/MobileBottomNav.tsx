import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MapPin, Satellite, Bot, MoreHorizontal, Building2, Waves, Users, Mountain } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { authService } from '../../services/authService';

interface MobileBottomNavProps {
  onToggleMore: () => void;
  isMoreOpen: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onToggleMore, isMoreOpen }) => {
  const { t, user } = useApp();
  const isGovt = authService.isGovtOrg(user);

  const navItems = isGovt
    ? [
        { to: '/app/gov', icon: Building2, label: 'Admin', exact: true },
        { to: '/app/lakes', icon: Waves, label: 'Lakes' },
        { to: '/app/reports', icon: Users, label: 'Reports' },
        { to: '/app/landscape', icon: Mountain, label: 'Landscape' },
      ]
    : [
        { to: '/app', icon: Home, label: t('nav.home'), exact: true },
        { to: '/app/farm', icon: MapPin, label: t('nav.myFarm') },
        { to: '/app/satellite', icon: Satellite, label: t('nav.satellite') },
        { to: '/app/assistant', icon: Bot, label: t('nav.aiAssistant') },
      ];

  return (
    <nav
      aria-label="App Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#e8ece8] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-15 max-w-lg mx-auto px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 rounded-xl transition-colors relative ${
                isActive
                  ? 'text-agri-800 font-bold'
                  : 'text-gray-500 font-medium hover:text-agri-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.9]'}`} />
                <span className="text-[11px] mt-0.5 truncate max-w-[64px] text-center leading-tight">
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-agri-800" />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* More Trigger */}
        <button
          onClick={onToggleMore}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 rounded-xl transition-colors cursor-pointer ${
            isMoreOpen
              ? 'text-agri-800 font-bold'
              : 'text-gray-500 font-medium hover:text-agri-700'
          }`}
          aria-label="Open More Menu"
        >
          <MoreHorizontal className="w-5 h-5 stroke-[2]" />
          <span className="text-[11px] mt-0.5 leading-tight">{t('nav.more')}</span>
        </button>
      </div>
    </nav>
  );
};
