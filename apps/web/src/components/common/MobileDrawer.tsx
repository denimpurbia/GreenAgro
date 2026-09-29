import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  X,
  Home,
  MapPin,
  Satellite,
  Sprout,
  CloudSun,
  Stethoscope,
  Leaf,
  Bot,
  Globe2,
  Settings,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const { t, user } = useApp();

  if (!isOpen) return null;

  const allNavItems = [
    { to: '/app', icon: Home, labelKey: 'nav.home', exact: true },
    { to: '/app/farm', icon: MapPin, labelKey: 'nav.myFarm' },
    { to: '/app/satellite', icon: Satellite, labelKey: 'nav.satellite' },
    { to: '/app/soil', icon: Sprout, labelKey: 'nav.soilHealth' },
    { to: '/app/weather', icon: CloudSun, labelKey: 'nav.weather' },
    { to: '/app/disease', icon: Stethoscope, labelKey: 'nav.cropDoctor' },
    { to: '/app/regenerative', icon: Leaf, labelKey: 'nav.regenerativePlan' },
    { to: '/app/assistant', icon: Bot, labelKey: 'nav.aiAssistant' },
    { to: '/app/knowledge', icon: Globe2, labelKey: 'nav.knowledgeExchange' },
    { to: '/app/settings', icon: Settings, labelKey: 'nav.settings' },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col p-5 z-10 overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <img
              src="/images/greenagro-logo.png"
              alt="GreenAgro"
              className="h-12 w-auto object-contain"
            />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="mt-4 space-y-1">
          {allNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  isActive
                    ? 'bg-agri-800 text-white'
                    : 'text-gray-700 hover:bg-[#f2f6f2] hover:text-agri-900'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer info */}
        <div className="mt-auto pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">GreenAgro Intelligence Network</p>
        </div>
      </div>
    </div>
  );
};
