import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Check,
  LogOut,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, user, setUser, language, setLanguage, logout } = useApp();
  const isGovt = authService.isGovtOrg(user);

  const [activeTab, setActiveTab] = useState<'profile' | 'language' | 'notifications' | 'privacy'>('profile');
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [organizationName, setOrganizationName] = useState(user?.organizationName ?? '');
  const [designation, setDesignation] = useState(user?.designation ?? '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Profile photo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profilePhoto, setProfilePhoto] = useState<string>(
    user?.avatarUrl || '/images/farmer-hero.jpg'
  );

  // Load saved profile photo
  useEffect(() => {
    const savedPhoto = localStorage.getItem('agrin_profile_photo');

    if (savedPhoto) {
      setProfilePhoto(savedPhoto);
    } else if (user?.avatarUrl) {
      setProfilePhoto(user.avatarUrl);
    }
  }, [user?.avatarUrl]);

  // Preference toggles matching Screen 12
  const [preferences, setPreferences] = useState(
    user?.preferences ?? {
      weatherAlerts: true,
      diseaseAlerts: true,
      weeklyReports: true,
      marketUpdates: false,
    }
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token =
        localStorage.getItem('agrin_auth_token') ||
        sessionStorage.getItem('agrin_auth_token');

      if (!token || !user?.id) {
        alert('Your session has expired. Please login again.');
        return;
      }

      const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: fullName,
          phone,
          location,
          language,
          preferences,
          avatarUrl: profilePhoto,
          ...(isGovt
            ? {
                organizationName,
                designation,
              }
            : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status !== 'success' || !data.user) {
        throw new Error(data.message || 'Failed to save profile.');
      }

      // Update React state
      setUser(data.user);

      // Update cached logged-in user
      localStorage.setItem(
        'agrin_current_user',
        JSON.stringify(data.user)
      );

      if (data.user.avatarUrl) {
        localStorage.setItem('agrin_profile_photo', data.user.avatarUrl);
      }

      setSavedSuccess(true);

      setTimeout(() => {
        setSavedSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Profile save error:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to save profile. Please try again.'
      );
    }
  };

  // Open native image picker
  const handleChangePhoto = () => {
    fileInputRef.current?.click();
  };

  // Handle selected profile photo
  const handlePhotoChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageUrl = reader.result as string;

      setProfilePhoto(imageUrl);
      localStorage.setItem('agrin_profile_photo', imageUrl);

      setUser((prev) =>
        prev
          ? {
              ...prev,
              avatarUrl: imageUrl,
            }
          : null
      );

      const storedUser = localStorage.getItem('agrin_current_user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          localStorage.setItem(
            'agrin_current_user',
            JSON.stringify({
              ...parsedUser,
              avatarUrl: imageUrl,
            })
          );
        } catch {
          // Ignore invalid cached user data
        }
      }
    };

    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      {/* Header matching Screen 12 */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f291e]">
          {t('settings.title')}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Role & Account Verification Identity Banner */}
      <div
        className={`rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isGovt
            ? 'bg-emerald-950 text-white border-emerald-800'
            : 'bg-[#f2f7f3] text-agri-950 border-agri-200'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isGovt ? 'bg-emerald-800 text-emerald-200' : 'bg-white text-agri-800 border border-agri-200'
            }`}
          >
            {isGovt ? <Building2 className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider">
                Account Type: {isGovt ? 'Govt / Org' : 'Farmer'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  isGovt
                    ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                Status: {user?.accountStatus || 'verified'}
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isGovt ? 'text-emerald-200' : 'text-gray-600'}`}>
              {isGovt
                ? `${user?.organizationName || 'Government / Organization'} • ${user?.designation || 'Official'} • ${[user?.district, user?.state].filter(Boolean).join(', ') || 'Rajasthan'}`
                : 'Verified Farmer Portal Access (Farm Management, Soil, Weather, Crop Doctor, Fair Market)'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Row matching Screen 12 */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-gray-200 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-agri-800 text-agri-900 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          {t('settings.profile')}
        </button>

        <button
          onClick={() => setActiveTab('language')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'language'
              ? 'border-agri-800 text-agri-900 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          {t('settings.language')}
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'border-agri-800 text-agri-900 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          {t('settings.notifications')}
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'privacy'
              ? 'border-agri-800 text-agri-900 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          {t('settings.privacy')}
        </button>
      </div>

      {/* Profile & Settings Content */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#e8ece8] shadow-card">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form: Profile matching Screen 12 */}
          <div className="lg:col-span-7 space-y-5">
            <h2 className="text-base font-bold text-gray-900">
              {t('settings.profile')} Details
            </h2>

            {/* Avatar & Change Photo */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-agri-100 border-2 border-agri-200">
                <img
                  src={profilePhoto}
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

              <button
                type="button"
                onClick={handleChangePhoto}
                className="text-xs font-semibold text-agri-800 bg-[#f2f6f2] hover:bg-agri-100 px-3 py-1.5 rounded-xl border border-agri-200/80 transition-colors flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Change Photo</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('settings.fullName')}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-hidden focus:border-agri-600"
                  required
                />
              </div>

              {isGovt && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Organization / Department Name
                    </label>
                    <input
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-hidden focus:border-agri-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Designation / Role Title
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-hidden focus:border-agri-600"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('settings.phone')}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-hidden focus:border-agri-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('settings.location')}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-hidden focus:border-agri-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('settings.preferredLanguage')}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'hi')}
                  className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-hidden focus:border-agri-600"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                </select>
              </div>

              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-agri-800 hover:bg-agri-900 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>{t('settings.saveChanges')}</span>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: App Preferences & Approved Permissions */}
          <div className="lg:col-span-5 space-y-6">
            {isGovt && user?.permissions && user.permissions.length > 0 && (
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <span className="text-xs font-bold text-emerald-950 block">
                  Approved Administrative Permissions ({user.permissions.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {user.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-[10px] font-mono text-emerald-900"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <h2 className="text-base font-bold text-gray-900">
              {t('settings.appPreferences')}
            </h2>

            <div className="space-y-3 bg-[#f8faf7] p-5 rounded-2xl border border-agri-100/80">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">
                    {t('settings.weatherAlerts')}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    High disease susceptibility notifications
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.weatherAlerts}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      weatherAlerts: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded text-agri-700 focus:ring-agri-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">
                    {t('settings.diseaseAlerts')}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Regional spore outbreaks &amp; pest alerts
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.diseaseAlerts}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      diseaseAlerts: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded text-agri-700 focus:ring-agri-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">
                    {t('settings.weeklyReports')}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Satellite NDVI vegetative trend digest
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.weeklyReports}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      weeklyReports: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded text-agri-700 focus:ring-agri-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">
                    {t('settings.marketUpdates')}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    e-NAM commodity price trend advisory
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketUpdates}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      marketUpdates: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded text-agri-700 focus:ring-agri-500"
                />
              </div>
            </div>

            {/* Session Management / Log Out */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-xs font-bold text-gray-800 block">
                Session Management
              </span>

              <p className="text-[11px] text-gray-500">
                Signed in as{' '}
                <strong className="text-gray-700">
                  {user?.email ?? ''}
                </strong>{' '}
                ({isGovt ? 'Govt / Org' : 'Farmer'})
              </p>

              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login', { replace: true });
                }}
                className="w-full py-2 px-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
