import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  AlertTriangle,
  Info,
  Check,
  Plus,
  CloudRain,
  Sun,
  Snowflake,
  Wind,
  Bug,
  Megaphone,
  TrendingUp,
  Waves,
  Mountain,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const SEVERITY_MAP_HI: Record<string, string> = {
  critical: 'अति-गंभीर (Critical)',
  warning: 'चेतावनी (Warning)',
  info: 'सूचना (Info)',
};

const CATEGORY_MAP_HI: Record<string, string> = {
  heavy_rainfall: 'अतिवृष्टि / भारी वर्षा',
  weather_alert: 'मौसम चेतावनी',
  heatwave: 'भीषण गर्मी / लू',
  cold_wave: 'शीतलहर / पाला',
  high_wind: 'तेज़ हवा / आंधी',
  crop_disease: 'कीट व फसल रोग',
  pest_outbreak: 'कीट प्रकोप',
  admin_broadcast: 'प्रशासनिक सूचना',
  general_advisory: 'सामान्य कृषि सलाह',
  severe_erosion: 'मृदा क्षरण',
  lake_water_drop: 'झील जल स्तर',
  fire_nearby: 'अग्नि अलर्ट',
  mandi_below_msp: 'मंडी भाव / एमएसपी',
};

export const AlertsPage: React.FC = () => {
  const { language, user } = useApp();
  const isHi = language === 'hi';
  const isGovt = authService.isGovtOrg(user);

  const [alerts, setAlerts] = useState<any[]>([]);
  const [, setLoading] = useState(true);

  // Admin Broadcast form fields
  const [title, setTitle] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [message, setMessage] = useState('');
  const [messageHi, setMessageHi] = useState('');
  const [category, setCategory] = useState('heavy_rainfall');
  const [severity, setSeverity] = useState<'info' | 'warning' | 'critical'>('warning');
  const [creating, setCreating] = useState(false);

  const fetchAlerts = useCallback(() => {
    const token = authService.getToken();
    fetch(`${API_BASE}/alerts`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.alerts)) {
          setAlerts(data.alerts);
        }
      })
      .catch((err) => console.warn('[AlertsPage] Error:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setCreating(true);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          category,
          severity,
          title: title.trim(),
          titleHi: (titleHi || title).trim(),
          message: message.trim(),
          messageHi: (messageHi || message).trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTitle('');
        setTitleHi('');
        setMessage('');
        setMessageHi('');
        fetchAlerts();
      }
    } catch {
      // Ignore error
    } finally {
      setCreating(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const token = authService.getToken();
      await fetch(`${API_BASE}/alerts/${id}/read`, {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      setAlerts((prev) => prev.map((a) => (a._id === id ? { ...a, isRead: true } : a)));
    } catch (err) {
      console.warn('[AlertsPage] Mark read error:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = authService.getToken();
      await fetch(`${API_BASE}/alerts/read-all`, {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    } catch (err) {
      console.warn('[AlertsPage] Mark all read error:', err);
    }
  };

  const getAlertIcon = (cat: string, sev: string) => {
    switch (cat) {
      case 'heavy_rainfall':
      case 'weather_alert':
      case 'thunderstorm':
        return { icon: CloudRain, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100' };
      case 'heatwave':
        return { icon: Sun, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' };
      case 'cold_wave':
      case 'frost':
        return { icon: Snowflake, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' };
      case 'high_wind':
        return { icon: Wind, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-100' };
      case 'crop_disease':
      case 'pest_outbreak':
        return { icon: Bug, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' };
      case 'admin_broadcast':
        return { icon: Megaphone, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' };
      case 'mandi_below_msp':
      case 'target_price_reached':
        return { icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' };
      case 'lake_water_drop':
      case 'ndci_increase':
        return { icon: Waves, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-100' };
      case 'severe_erosion':
      case 'land_disturbance':
        return { icon: Mountain, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' };
      case 'fire_nearby':
        return { icon: Flame, color: 'text-red-600', bg: 'bg-red-50 border-red-100' };
      default:
        return sev === 'critical'
          ? { icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50 border-red-100' }
          : { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' };
    }
  };

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'critical':
        return {
          border: 'border-red-200 bg-red-50/70',
          badge: 'bg-red-100 text-red-800 border-red-200',
        };
      case 'warning':
        return {
          border: 'border-amber-200 bg-amber-50/60',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
        };
      default:
        return {
          border: 'border-sky-200 bg-sky-50/50',
          badge: 'bg-sky-100 text-sky-800 border-sky-200',
        };
    }
  };

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f291e] flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-agri-700 stroke-[2.2]" />
            <span>{isHi ? 'अलर्ट एवं एकीकृत सूचना केंद्र' : 'Unified Alerts & Advisory Center'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {isHi
              ? 'वास्तविक मौसम चेतावनी, फसल रोग अलर्ट, मंडी भाव एवं प्रशासनिक सूचनाएं'
              : 'Real weather warnings, crop disease alerts, market prices & official broadcast notices'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-700 shadow-2xs cursor-pointer transition-colors"
          >
            <Check className="w-4 h-4 text-agri-700" />
            <span>{isHi ? 'सभी को पढ़ा हुआ चिन्हित करें' : 'Mark all as read'}</span>
          </button>
        )}
      </div>

      {/* Govt / Super Admin Broadcast Alert Form */}
      {isGovt && (
        <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-agri-700" />
              <span>Broadcast Official Advisory / Alert to Farmers</span>
            </h3>
            <span className="text-[11px] font-semibold text-agri-700 bg-agri-50 px-2 py-0.5 rounded-md border border-agri-200">
              Admin & Govt Portal
            </span>
          </div>

          <form onSubmit={handleCreateAlert} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-6">
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Alert Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-[#f8faf8] font-medium"
                >
                  <option value="heavy_rainfall">🌧️ Heavy Rainfall / Storm Alert (अतिवृष्टि)</option>
                  <option value="weather_alert">⛅ Severe Weather Advisory (मौसम चेतावनी)</option>
                  <option value="heatwave">☀️ Heatwave / High Temp (भीषण गर्मी / लू)</option>
                  <option value="cold_wave">❄️ Cold Wave & Frost Warning (शीतलहर / पाला)</option>
                  <option value="high_wind">💨 High Wind / Gale Warning (तेज़ हवा / आंधी)</option>
                  <option value="crop_disease">🐛 Pest & Disease Outbreak (कीट व रोग प्रकोप)</option>
                  <option value="admin_broadcast">📢 Official Admin Broadcast (प्रशासनिक सूचना)</option>
                  <option value="general_advisory">🌾 General Agricultural Advisory (कृषि सलाह)</option>
                  <option value="severe_erosion">⛰️ Watershed Erosion Warning (मृदा क्षरण)</option>
                  <option value="lake_water_drop">🌊 Lake Water / Quality Notice (झील जल स्तर)</option>
                  <option value="fire_nearby">🔥 Aravalli Thermal / Fire Alert (अग्नि अलर्ट)</option>
                  <option value="mandi_below_msp">💰 Mandi Below MSP Notice (मंडी भाव)</option>
                </select>
              </div>

              <div className="md:col-span-6">
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Severity Level</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-[#f8faf8] font-medium"
                >
                  <option value="info">ℹ️ Info (Low urgency)</option>
                  <option value="warning">⚠️ Warning (Moderate urgency)</option>
                  <option value="critical">🚨 Critical (Immediate action required)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Title (English) *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Heavy Rainfall Expected in Udaipur Catchment"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Title (Hindi / मेवाड़ी)</label>
                <input
                  type="text"
                  value={titleHi}
                  onChange={(e) => setTitleHi(e.target.value)}
                  placeholder="उदा. उदयपुर क्षेत्र में भारी वर्षा की चेतावनी"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Message (English) *</label>
                <textarea
                  required
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detailed instructions for farmers..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Message (Hindi / मेवाड़ी)</label>
                <textarea
                  rows={2}
                  value={messageHi}
                  onChange={(e) => setMessageHi(e.target.value)}
                  placeholder="किसानों के लिए विस्तृत सलाह..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2.5 bg-agri-800 hover:bg-agri-900 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{creating ? 'Publishing...' : 'Broadcast Alert to All Farmers'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Alerts Feed */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="bg-white border border-[#e8ece8] rounded-2xl p-12 text-center text-gray-400">
            <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-semibold">
              {isHi ? 'डेटाबेस में कोई सक्रिय अलर्ट नहीं है।' : 'No active alerts in database.'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {isHi
                ? 'प्रशासनिक सूचना अथवा वास्तविक मौसम स्थिति बदलने पर अलर्ट यहाँ दिखाई देंगे।'
                : 'Real alerts appear here automatically when triggered by live weather or broadcast by an administrator.'}
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const style = getSeverityStyle(alert.severity);
            const iconObj = getAlertIcon(alert.category, alert.severity);
            const Icon = iconObj.icon;

            return (
              <div
                key={alert._id}
                className={`border rounded-2xl p-4 sm:p-5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  alert.isRead ? 'bg-white border-gray-100 opacity-80' : `${style.border} shadow-sm`
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${iconObj.bg}`}>
                    <Icon className={`w-5 h-5 ${iconObj.color}`} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-gray-900">
                        {isHi ? alert.titleHi || alert.title : alert.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${style.badge}`}
                      >
                        {isHi ? SEVERITY_MAP_HI[alert.severity] || alert.severity : alert.severity}
                      </span>
                      {!alert.isRead && (
                        <span className="w-2 h-2 rounded-full bg-agri-600 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 leading-snug">
                      {isHi ? alert.messageHi || alert.message : alert.message}
                    </p>
                    <span className="text-[11px] text-gray-400 block pt-0.5">
                      {isHi ? 'श्रेणी:' : 'Category:'}{' '}
                      {isHi
                        ? CATEGORY_MAP_HI[alert.category] || alert.category?.replace(/_/g, ' ') || 'कृषि सलाह'
                        : alert.category ? alert.category.replace(/_/g, ' ') : 'Advisory'}{' '}
                      • {alert.createdAt ? new Date(alert.createdAt).toLocaleString(isHi ? 'hi-IN' : 'en-US') : ''}
                    </span>
                  </div>
                </div>

                {!alert.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(alert._id)}
                    className="self-end sm:self-center px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-agri-800 hover:bg-white/80 border border-gray-200/80 cursor-pointer shrink-0"
                  >
                    {isHi ? 'पढ़ा हुआ चिन्हित करें' : 'Mark as read'}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
