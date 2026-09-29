import React from 'react';
import { NavLink } from 'react-router-dom';
import {
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

export const Sidebar: React.FC = () => {
  const { t } = useApp();

  const navItems = [
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
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#e8ece8] min-h-screen py-5 px-4 select-none shrink-0">
      {/* Brand Header — centered so left and right gaps are equal */}
      <NavLink to="/" className="flex items-center justify-center py-1 mb-5">
        <img
          src="/images/greenagro-logo.png"
          alt="GreenAgro"
          className="h-20 w-auto max-w-[240px] object-contain"
        />
      </NavLink>

      {/* Nav List */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-agri-800 text-white shadow-sm'
                  : 'text-gray-600 hover:text-agri-900 hover:bg-[#f2f6f2]'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0 stroke-[2]" />
            <span className="truncate">{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      {/* Provenance demo badge */}
      <div className="mt-auto pt-4 border-t border-gray-100 px-2">
        <div className="bg-[#f2f7f3] border border-agri-100 rounded-xl p-3 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-agri-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-agri-900">Demo Environment</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-tight">
            Deterministic engines &amp; Gemini fallback active.
          </p>
        </div>
      </div>
    </aside>
  );
};
