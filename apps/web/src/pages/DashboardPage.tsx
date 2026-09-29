import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sun,
  CloudRain,
  HeartPulse,
  ShieldCheck,
  Droplets,
  Sprout,
  Activity,
  CalendarCheck,
  ArrowRight,
  MapPin,
  Stethoscope,
  Bot,
  CloudSun,
  RefreshCw,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LocationDateCard } from '../components/common/LocationDateCard';

/** Skeleton placeholder card for loading state */
const SkeletonCard: React.FC = () => (
  <div className="bg-white p-3.5 rounded-2xl border border-[#e8ece8] shadow-card flex flex-col justify-between animate-pulse">
    <div className="w-8 h-8 rounded-xl bg-gray-100 mb-2" />
    <div>
      <div className="h-5 w-12 bg-gray-200 rounded mb-1" />
      <div className="h-3 w-20 bg-gray-100 rounded" />
    </div>
  </div>
);

/** Helper to generate dynamic, accurate greeting */
function getGreeting(user: { name?: string }, language: 'en' | 'hi', isAuthenticated: boolean): string {
  const hour = new Date().getHours();
  let timePeriodEn = 'Morning';
  let timePeriodHi = 'प्रभात';

  if (hour >= 12 && hour < 17) {
    timePeriodEn = 'Afternoon';
    timePeriodHi = 'दोपहर';
  } else if (hour >= 17 && hour < 21) {
    timePeriodEn = 'Evening';
    timePeriodHi = 'संध्या';
  } else if (hour >= 21 || hour < 5) {
    timePeriodEn = 'Evening';
    timePeriodHi = 'संध्या';
  }

  const userName = user?.name || '';
  const isRealUser = isAuthenticated && Boolean(userName) && userName !== 'Guest User';
  const firstName = isRealUser ? userName.split(' ')[0] : '';

  if (language === 'hi') {
    return isRealUser
      ? `शुभ ${timePeriodHi}, ${firstName} जी! 👋`
      : `शुभ ${timePeriodHi}! 👋`;
  }

  return isRealUser
    ? `Good ${timePeriodEn}, ${firstName}! 👋`
    : `Good ${timePeriodEn}! 👋`;
}

export const DashboardPage: React.FC = () => {
  const {
    t,
    weather,
    weatherLoading,
    weatherError,
    soil,
    satellite,
    refreshWeather,
    user,
    isAuthenticated,
    language,
  } = useApp();

  // Dynamic greeting
  const greetingText = getGreeting(user ?? {}, language, isAuthenticated);

  // Derive stat values from REAL data — no hardcoded values
  const hasWeather = !weatherLoading && !!weather;
  const temp = hasWeather ? `${weather.current.temp}°C` : weatherLoading ? null : '—';
  const rainProb = hasWeather ? `${weather.current.rainProbability}%` : weatherLoading ? null : '—';

  // Crop health from NDVI (satellite). ndvi null = not configured
  const cropHealthValue = satellite.ndvi !== null
    ? `${Math.round(satellite.ndvi * 100)} / 100`
    : '—';

  // Disease risk derived from rain probability + humidity
  const diseaseRisk = (() => {
    if (!weather) return '—';
    const h = weather.current.humidity;
    const r = weather.current.rainProbability;
    if (h > 80 && r > 60) return 'High';
    if (h > 65 || r > 40) return 'Medium';
    return 'Low';
  })();

  // Irrigation need from rain probability
  const irrigationNeed = (() => {
    if (!weather) return '—';
    const r = weather.current.rainProbability;
    if (r > 70) return 'Not Needed';
    if (r > 40) return 'Low';
    if (r > 20) return 'Moderate';
    return 'High';
  })();

  // Outlook from next 3 days of forecast
  const outlook = (() => {
    if (!weather || weather.forecast.length === 0) return '—';
    const maxRain = Math.max(...weather.forecast.slice(0, 3).map((d) => d.rainProbability));
    if (maxRain > 70) return 'Rainy';
    if (maxRain > 40) return 'Mixed';
    return 'Favorable';
  })();

  const statCards = [
    {
      value: temp,
      label: t('dashboard.temp'),
      sublabel: weatherLoading ? 'Fetching...' : hasWeather ? 'Live' : 'Unavailable',
      icon: Sun,
      color: 'text-amber-500 bg-amber-50 border-amber-100',
      loading: weatherLoading,
    },
    {
      value: rainProb,
      label: t('dashboard.rainProb'),
      sublabel: weatherLoading ? 'Fetching...' : hasWeather ? 'Today' : 'Unavailable',
      icon: CloudRain,
      color: 'text-sky-500 bg-sky-50 border-sky-100',
      loading: weatherLoading,
    },
    {
      value: cropHealthValue,
      label: t('dashboard.cropHealth'),
      sublabel: satellite.ndvi !== null ? 'NDVI Index' : 'Unconfigured',
      icon: HeartPulse,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      loading: false,
    },
    {
      value: diseaseRisk,
      label: t('dashboard.diseaseRisk'),
      sublabel: hasWeather ? 'Weather Index' : 'Unavailable',
      icon: ShieldCheck,
      color: 'text-green-600 bg-green-50 border-green-100',
      loading: weatherLoading,
    },
    {
      value: irrigationNeed,
      label: t('dashboard.irrigationNeed'),
      sublabel: hasWeather ? 'Precipitation' : 'Unavailable',
      icon: Droplets,
      color: 'text-blue-500 bg-blue-50 border-blue-100',
      loading: weatherLoading,
    },
    {
      value: soil ? `${soil.score}/100` : '—',
      label: t('dashboard.soilHealth'),
      sublabel: soil ? soil.rating : 'Test Needed',
      icon: Sprout,
      color: 'text-lime-600 bg-lime-50 border-lime-100',
      loading: false,
    },
    {
      value: satellite.ndvi !== null ? satellite.status : '—',
      label: t('dashboard.vegetation'),
      sublabel: satellite.ndvi !== null ? 'Sentinel-2' : 'Unconfigured',
      icon: Activity,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
      loading: false,
    },
    {
      value: outlook,
      label: t('dashboard.next7Days'),
      sublabel: hasWeather ? '3-Day Trend' : 'Unavailable',
      icon: CalendarCheck,
      color: 'text-teal-600 bg-teal-50 border-teal-100',
      loading: weatherLoading,
    },
  ];

  // Derive honest recommendation banner content
  const recommendation = (() => {
    if (weather?.aiAlert?.description) {
      return {
        available: true,
        title: t('dashboard.recommendationTitle'),
        badge: 'Live Weather Advisory',
        text: weather.aiAlert.description,
        link: '/app/weather',
      };
    }
    if (soil?.recommendations && soil.recommendations.length > 0) {
      return {
        available: true,
        title: 'Soil Health Advisory',
        badge: 'Soil Test Result',
        text: soil.recommendations[0],
        link: '/app/soil',
      };
    }
    return {
      available: false,
      title: t('dashboard.recommendationTitle'),
      badge: 'Live Data Unavailable',
      text: 'Recommendation unavailable — live farm data is currently unavailable. Allow location access or input soil test values to generate tailored recommendations.',
      link: '/app/weather',
    };
  })();

  return (
    <div className="space-y-6">
      {/* Top Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f291e]">
            {greetingText}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {t('dashboard.subgreeting')}
          </p>
        </div>
        <LocationDateCard />
      </div>

      {/* Weather Alert / Error Banner */}
      {!weatherLoading && weatherError && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="flex-1">
            {weatherError.includes('Waiting')
              ? 'Detecting your location to load weather data...'
              : 'Live weather data is temporarily unavailable. Check backend connection.'}
          </span>
          <button
            onClick={refreshWeather}
            className="flex items-center gap-1 text-amber-700 hover:text-amber-900 font-semibold cursor-pointer"
            title="Retry weather fetch"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Today's Overview Section: 8 Cards Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-gray-900">
            {t('dashboard.overviewTitle')}
          </h2>
          <span className="text-[11px] text-agri-700 font-medium bg-agri-50 px-2 py-0.5 rounded-md border border-agri-100 flex items-center gap-1">
            {weatherLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            {weatherLoading ? 'Loading...' : weather ? 'Live Data' : 'Awaiting data'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3.5">
          {statCards.map((card, idx) =>
            card.loading ? (
              <SkeletonCard key={idx} />
            ) : (
              <div
                key={idx}
                className="bg-white p-2.5 sm:p-3.5 rounded-2xl border border-[#e8ece8] shadow-card flex flex-col justify-between hover:shadow-elevated transition-shadow"
              >
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center border ${card.color}`}>
                    <card.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-sm sm:text-base lg:text-lg font-extrabold text-gray-950 block leading-tight truncate">
                    {card.value}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-gray-700 block truncate mt-0.5 font-bold">
                    {card.label}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-gray-400 block truncate">
                    {card.sublabel}
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      {/* Today's Recommendation Banner — STRICT: Only shows real recommendations */}
      <section
        className={`border rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          recommendation.available
            ? 'bg-gradient-to-r from-[#edf7ee] via-white to-[#edf7ee] border-agri-200'
            : 'bg-[#fafbfa] border-gray-200'
        }`}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
              recommendation.available
                ? 'bg-agri-100 border-agri-200 text-agri-700'
                : 'bg-gray-100 border-gray-200 text-gray-400'
            }`}
          >
            <Sprout className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-gray-950">
                {recommendation.title}
              </h3>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  recommendation.available
                    ? 'bg-agri-700 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {recommendation.badge}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-3xl">
              {recommendation.text}
            </p>
          </div>
        </div>
        <Link
          to={recommendation.link}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105 self-end sm:self-auto ${
            recommendation.available
              ? 'bg-agri-800 hover:bg-agri-900'
              : 'bg-gray-400 hover:bg-gray-500'
          }`}
          aria-label="View advisory details"
        >
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </Link>
      </section>

      {/* Quick Action Tiles */}
      <section className="space-y-3 pt-1">
        <h2 className="text-sm sm:text-base font-bold text-gray-900">
          {t('dashboard.quickActions')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link
            to="/app/disease"
            className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#e8ece8] shadow-card hover:shadow-elevated transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 leading-tight">{t('dashboard.analyzeCrop')}</p>
              <p className="text-[11px] text-gray-400">AI Leaf Scanner</p>
            </div>
          </Link>

          <Link
            to="/app/weather"
            className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#e8ece8] shadow-card hover:shadow-elevated transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 leading-tight">{t('dashboard.checkWeather')}</p>
              <p className="text-[11px] text-gray-400">5-Day Outlook</p>
            </div>
          </Link>

          <Link
            to="/app/farm"
            className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#e8ece8] shadow-card hover:shadow-elevated transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 leading-tight">{t('dashboard.viewFarm')}</p>
              <p className="text-[11px] text-gray-400">Boundaries &amp; Crop</p>
            </div>
          </Link>

          <Link
            to="/app/assistant"
            className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#e8ece8] shadow-card hover:shadow-elevated transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 leading-tight">{t('dashboard.askAssistant')}</p>
              <p className="text-[11px] text-gray-400">GreenAgro AI Assistant</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
};
