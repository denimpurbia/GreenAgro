import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  AlertTriangle,
  Info,
  Check,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const AlertsPage: React.FC = () => {
  const { language, user } = useApp();
  const isHi = language === 'hi';
  const isGovt = authService.isGovtOrg(user);

  const [alerts, setAlerts] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('severe_erosion');
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
          message: message.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTitle('');
        setMessage('');
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

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'critical':
        return {
          border: 'border-red-200 bg-red-50/70',
          badge: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertTriangle,
          iconColor: 'text-red-600',
        };
      case 'warning':
        return {
          border: 'border-amber-200 bg-amber-50/60',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
        };
      default:
        return {
          border: 'border-sky-200 bg-sky-50/50',
          badge: 'bg-sky-100 text-sky-800 border-sky-200',
          icon: Info,
          iconColor: 'text-sky-600',
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
            <span>{isHi ? 'अलर्ट एवं एकीकृत सूचना केंद्र' : 'Unified Regional Alerts Center'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {isHi
              ? 'मृदा क्षरण, अग्नि, जल तनाव, मंडी भाव एवं झील स्तर से संबंधित वास्तविक अलर्ट'
              : 'Real-time ecological, watershed, fire, and market advisory notifications'}
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

      {/* Govt / Org Broadcast Regional Alert Form */}
      {isGovt && (
        <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-black text-gray-900">
            Broadcast Official Regional Environmental / Agricultural Alert
          </h3>
          <form onSubmit={handleCreateAlert} className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="md:col-span-3 border border-gray-200 rounded-xl px-3 py-2 bg-[#f8faf8]"
            >
              <option value="severe_erosion">Watershed Erosion Warning</option>
              <option value="lake_water_drop">Lake Water / Quality Notice</option>
              <option value="fire_nearby">Aravalli Thermal / Fire Alert</option>
              <option value="mandi_below_msp">Mandi Below MSP Alert</option>
              <option value="heatwave">Heatwave / Weather Advisory</option>
            </select>

            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="md:col-span-2 border border-gray-200 rounded-xl px-3 py-2 bg-[#f8faf8]"
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>

            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Alert Title"
              className="md:col-span-3 border border-gray-200 rounded-xl px-3 py-2"
            />

            <input
              type="text"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Alert message details..."
              className="md:col-span-3 border border-gray-200 rounded-xl px-3 py-2"
            />

            <button
              type="submit"
              disabled={creating}
              className="md:col-span-1 bg-agri-800 hover:bg-agri-900 text-white rounded-xl font-bold flex items-center justify-center py-2 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Alerts Feed */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="bg-white border border-[#e8ece8] rounded-2xl p-12 text-center text-gray-400">
            <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-semibold">No active regional alerts in database.</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Zero fabricated alerts are displayed. Real alerts appear here when triggered or issued by an administrator.
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const style = getSeverityStyle(alert.severity);
            const Icon = style.icon;

            return (
              <div
                key={alert._id}
                className={`border rounded-2xl p-4 sm:p-5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  alert.isRead ? 'bg-white border-gray-100 opacity-80' : `${style.border} shadow-sm`
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl bg-white/90 border border-gray-100 shrink-0`}>
                    <Icon className={`w-5 h-5 ${style.iconColor}`} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-gray-900">
                        {isHi ? alert.titleHi || alert.title : alert.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${style.badge}`}
                      >
                        {alert.severity}
                      </span>
                      {!alert.isRead && (
                        <span className="w-2 h-2 rounded-full bg-agri-600 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 leading-snug">
                      {isHi ? alert.messageHi || alert.message : alert.message}
                    </p>
                    <span className="text-[11px] text-gray-400 block pt-0.5">
                      Category: {alert.category?.replace(/_/g, ' ')} •{' '}
                      {alert.createdAt ? new Date(alert.createdAt).toLocaleDateString() : ''}
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
