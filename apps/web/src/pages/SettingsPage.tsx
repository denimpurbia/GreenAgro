import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, ShieldAlert, Globe, Bell, Lock, User as UserIcon, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, user, setUser, language, setLanguage, logout } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'language' | 'notifications' | 'privacy'>('profile');
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
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
  const [preferences, setPreferences] = useState(user?.preferences ?? {
    weatherAlerts: true,
    diseaseAlerts: true,
    weeklyReports: true,
    marketUpdates: false,
  });

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

    // Allow images only
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      event.target.value = '';
      return;
    }

    // Maximum 5 MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageUrl = reader.result as string;

      // Immediately update image on screen
      setProfilePhoto(imageUrl);

      // Save photo locally so it survives refresh/login on this browser
      localStorage.setItem(
        'agrin_profile_photo',
        imageUrl
      );

      // Update React user state
      setUser((prev) =>
        prev
          ? {
              ...prev,
              avatarUrl: imageUrl,
            }
          : null
      );

      // Update cached logged-in user
      const storedUser = localStorage.getItem(
        'agrin_current_user'
      );

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

    // Allow selecting the same image again later
    event.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header matching Screen 12 */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f291e]">
          {t('settings.title')}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          {t('settings.subtitle')}
        </p>
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

              {/* Hidden file input */}
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

          {/* Right Column: App Preferences Toggles matching Screen 12 */}
          <div className="lg:col-span-5 space-y-6">
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
                ({user?.role ?? ''})
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

            {/* Danger Zone matching Screen 12 */}
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
              <span className="text-xs font-bold text-rose-900 block">
                {t('settings.dangerZone')}
              </span>

              <p className="text-[11px] text-rose-700">
                Permanently deletes your farm context, observations, and regenerative score history.
              </p>

              <button
                type="button"
                onClick={() => alert('Account deletion simulated for demo.')}
                className="text-xs font-bold text-rose-700 hover:text-rose-900 underline"
              >
                {t('settings.deleteAccount')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};