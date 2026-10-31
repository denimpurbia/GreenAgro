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

export const Sidebar: React.FC = () => {
  const { t, user, language } = useApp();
  const isGovt = authService.isGovtOrg(user);
  const isSuper = authService.isSuperAdmin(user);
  const canVerify = authService.canVerifyAccounts(user);

  const isHi = language === 'hi';

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

  const navItems = isGovt ? govtNavItems : farmerNavItems;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#e8ece8] min-h-screen max-h-screen overflow-y-auto py-5 px-4 select-none shrink-0">
      {/* Brand Header */}
      <NavLink to="/" className="flex items-center justify-center py-1 mb-4">
        <img
          src="/images/greenagro-logo.png"
          alt="GreenAgro"
          className="h-20 w-auto max-w-[240px] object-contain"
        />
      </NavLink>

      {/* Role Portal Header Pill */}
      <div className="mb-3 px-2">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${
            isGovt
              ? 'bg-emerald-900 text-white border-emerald-800'
              : 'bg-[#f2f7f3] text-agri-900 border-agri-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {isSuper
              ? (isHi ? 'सुपर एडमिन पोर्टल' : 'SUPER ADMIN PORTAL')
              : isGovt
                ? (isHi ? 'सरकारी / संस्था पोर्टल' : 'GOVT / ORG ADMIN PORTAL')
                : (isHi ? 'किसान पोर्टल' : 'FARMER PORTAL')}
          </span>
        </div>
      </div>

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
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Portal Identity Footer */}
      <div className="mt-auto pt-4 border-t border-gray-100 px-2">
        <div className="bg-[#f2f7f3] border border-agri-100 rounded-xl p-3 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="text-xs font-semibold text-agri-900 truncate">
              {isGovt
                ? user?.organizationName || (isHi ? 'सत्यापित सरकारी / संस्था खाता' : 'Verified Govt / Org')
                : (isHi ? 'सत्यापित किसान खाता' : 'Verified Farmer Account')}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 leading-tight truncate">
            {isGovt
              ? `${user?.designation || (isHi ? 'अधिकारी' : 'Official')} • ${user?.district || (isHi ? 'राजस्थान' : 'Rajasthan')}`
              : (isHi ? 'दक्षिणी राजस्थान कृषि नेटवर्क' : 'Southern Rajasthan Intelligence Network')}
          </p>
        </div>
      </div>
    </aside>
  );
};
