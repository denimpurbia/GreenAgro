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
  Globe2,
  Settings,
  Store,
  Mountain,
  Waves,
  Shield,
  Users,
  Bell,
  Building2,
  BarChart3,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { authService } from '../../services/authService';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const { t, user, language } = useApp();

  if (!isOpen) return null;

  const isHi = language === 'hi';
  const isGovt = authService.isGovtOrg(user);
  const canVerify = authService.canVerifyAccounts(user);

  const farmerNavItems = [
    { to: '/app', icon: Home, label: isHi ? 'होम' : 'Dashboard', exact: true },
    { to: '/app/farm', icon: MapPin, label: isHi ? 'मेरा खेत' : 'My Farm' },
    { to: '/app/satellite', icon: Satellite, label: isHi ? 'सैटेलाइट व्यू' : 'Satellite View' },
    { to: '/app/soil', icon: Sprout, label: isHi ? 'मिट्टी की सेहत' : 'Soil Health' },
    { to: '/app/weather', icon: CloudSun, label: isHi ? 'मौसम' : 'Weather' },
    { to: '/app/disease', icon: Stethoscope, label: isHi ? 'फसल डॉक्टर' : 'Crop Doctor' },
    { to: '/app/market', icon: Store, label: isHi ? 'उचित बाजार भाव' : 'Fair Market' },
    { to: '/app/reports', icon: Users, label: isHi ? 'सामुदायिक रिपोर्ट' : 'Community Reports' },
    { to: '/app/regenerative', icon: Leaf, label: isHi ? 'पुनर्योजी योजना' : 'Regenerative Plan' },
    { to: '/app/knowledge', icon: Globe2, label: isHi ? 'ज्ञान विनिमय' : 'Knowledge Exchange' },
    { to: '/app/settings', icon: Settings, label: isHi ? 'सेटिंग्स' : 'Settings' },
  ];

  const govtNavItems = [
    { to: '/app/gov', icon: Building2, label: isHi ? 'सरकारी डैशबोर्ड' : 'Government Dashboard', exact: true },
    ...(canVerify
      ? [{ to: '/app/admin/verifications', icon: ShieldCheck, label: isHi ? 'खाता सत्यापन' : 'Account Verification' }]
      : []),
    { to: '/app/lakes', icon: Waves, label: isHi ? 'झील निगरानी' : 'Lakes Monitor' },
    { to: '/app/watershed', icon: Mountain, label: isHi ? 'जलग्रहण सुरक्षा' : 'Watershed Defense' },
    { to: '/app/aravalli', icon: Shield, label: isHi ? 'अरावली संरक्षण' : 'Aravalli Guard' },
    { to: '/app/reports', icon: Users, label: isHi ? 'सामुदायिक रिपोर्ट मॉडरेशन' : 'Community Reports Moderation' },
    { to: '/app/landscape', icon: Mountain, label: isHi ? 'रिज-टू-झील परिदृश्य' : 'Ridge-to-Lake Landscape' },
    { to: '/app/alerts', icon: Bell, label: isHi ? 'एकीकृत अलर्ट केंद्र' : 'Unified Alerts' },
    { to: '/app/market', icon: Store, label: isHi ? 'मंडी भाव निगरानी' : 'Fair Market Monitoring' },
    { to: '/app/gov/regional', icon: BarChart3, label: isHi ? 'किसान व क्षेत्रीय अवलोकन' : 'Farmer / Regional Overview' },
    { to: '/app/schemes', icon: BookOpen, label: isHi ? 'सरकारी योजनाएं' : 'Government Schemes' },
    { to: '/app/settings', icon: Settings, label: isHi ? 'सेटिंग्स' : 'Settings' },
  ];

  const allNavItems = isGovt ? govtNavItems : farmerNavItems;

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

        {/* Role Portal Pill */}
        <div className="mt-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${
              isGovt
                ? 'bg-emerald-900 text-white border-emerald-800'
                : 'bg-[#f2f7f3] text-agri-900 border-agri-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {isGovt
                ? (isHi ? 'सरकारी / संस्था पोर्टल' : 'GOVT / ORG ADMIN PORTAL')
                : (isHi ? 'किसान पोर्टल' : 'FARMER PORTAL')}
            </span>
          </div>
        </div>

        {/* Links */}
        <nav className="mt-3 space-y-1">
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
              <span>{item.label}</span>
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
