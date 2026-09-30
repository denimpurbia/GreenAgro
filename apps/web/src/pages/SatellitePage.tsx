import React, { useState } from 'react';
import { ChevronDown, Plus, Minus, Info, Satellite, AlertTriangle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useApp } from '../context/AppContext';

export const SatellitePage: React.FC = () => {
  const { t, satellite } = useApp();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [timeframe, setTimeframe] = useState('Last 3 Months');

  const isConfigured =
  satellite.ndvi !== null &&
  satellite.status !== 'not_configured';
  const chartData = satellite.trendMonths.length > 0 ? satellite.trendMonths : [];

  // Compute growth trend from real data
  const growthTrend = (() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].value;
    const last = chartData[chartData.length - 1].value;
    const pct = Math.round(((last - first) / Math.max(first, 0.01)) * 100);
    return { pct, label: pct >= 0 ? `+${pct}% Growth` : `${pct}% Decline` };
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f291e]">
            {t('satellite.title')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {t('satellite.subtitle')}
          </p>
        </div>
        <div className="relative self-start sm:self-auto">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="appearance-none bg-white border border-gray-200/80 rounded-xl px-4 py-2 pr-9 text-xs sm:text-sm font-semibold text-gray-700 shadow-2xs focus:outline-hidden focus:border-agri-600"
          >
            <option value="Last 3 Months">Last 3 Months</option>
            <option value="Last 6 Months">Last 6 Months</option>
            <option value="Current Season">Current Season</option>
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* ── Not Configured State ─────────────────────────────────────────── */}
      {!isConfigured && (
        <div className="bg-white rounded-3xl p-8 border border-[#e8ece8] shadow-card flex flex-col items-center text-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">
            <Satellite className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-base text-gray-900">Satellite NDVI Data Not Configured</h3>
            <p className="text-xs text-gray-500 mt-2 max-w-md leading-relaxed">
              {satellite.configMessage || 'Live satellite vegetation data requires a configured satellite provider.'}
            </p>
          </div>
          <div className="bg-[#f8faf7] rounded-2xl border border-agri-100 p-4 text-left w-full max-w-md">
            <p className="text-xs font-bold text-gray-700 mb-2">To enable live NDVI:</p>
            <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
              <li>Set <code className="bg-gray-100 px-1 rounded">SATELLITE_PROVIDER=earth-engine</code></li>
              <li>Set <code className="bg-gray-100 px-1 rounded">EARTH_ENGINE_PROJECT</code> to your Google Cloud Project ID</li>
              <li>Vercel/Production: Set <code className="bg-gray-100 px-1 rounded">EARTH_ENGINE_CREDENTIALS_JSON</code> to the full service-account JSON string</li>
              <li>Local dev: Set <code className="bg-gray-100 px-1 rounded">GOOGLE_APPLICATION_CREDENTIALS</code> to the JSON file path</li>
            </ol>
          </div>
        </div>
      )}

      {/* ── Configured: Full Satellite Intelligence Card ─────────────────── */}
      {isConfigured && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#e8ece8] shadow-card">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Satellite Map with False-Color NDVI Overlay */}
            <div className="lg:col-span-7 flex flex-col space-y-3">
              <div className="relative w-full h-[260px] sm:h-[400px] rounded-2xl overflow-hidden border border-gray-200 bg-[#2b3a2d] shadow-inner flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-300"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    backgroundImage:
                      'url("https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80")',
                  }}
                />
                {/* NDVI false-color overlay */}
                <div
                  className="absolute inset-0 transition-transform duration-300 pointer-events-none opacity-85"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <svg className="w-full h-full" viewBox="0 0 500 400" preserveAspectRatio="none">
                    <defs>
                      <radialGradient id="ndviFieldGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.85" />
                        <stop offset="45%" stopColor="#84cc16" stopOpacity="0.8" />
                        <stop offset="75%" stopColor="#eab308" stopOpacity="0.75" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.7" />
                      </radialGradient>
                    </defs>
                    <polygon
                      points="130,80 370,60 410,320 160,300"
                      fill="url(#ndviFieldGrad)"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>

                {/* Zoom Controls */}
                <div className="absolute top-4 left-4 flex flex-col bg-white/90 backdrop-blur-md rounded-xl shadow-md border border-gray-200 overflow-hidden z-10">
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 1.8))}
                    className="p-2 hover:bg-gray-100 text-gray-700 transition-colors border-b border-gray-100"
                    aria-label="Zoom In"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
                    className="p-2 hover:bg-gray-100 text-gray-700 transition-colors"
                    aria-label="Zoom Out"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>

                {/* NDVI Scale Legend */}
                <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-64 bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-gray-200 shadow-elevated z-10">
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 mb-1">
                    <span>NDVI</span>
                    <span>0.0 — 0.5 — 1.0</span>
                  </div>
                  <div className="h-2.5 rounded-full ndvi-gradient w-full shadow-inner"></div>
                  <div className="flex justify-between text-[9px] text-gray-500 mt-1 font-medium">
                    <span>Stressed (0.0)</span>
                    <span>Moderate (0.5)</span>
                    <span>Healthy (1.0)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Info className="w-3.5 h-3.5 text-gray-400" />
                <span>Data source: {satellite.source || 'Satellite Provider'}</span>
              </div>
            </div>

            {/* Right Column: Health Score & Trend Chart */}
            <div className="lg:col-span-5 flex flex-col space-y-6">
              {/* Health Score */}
              <div className="bg-[#f8faf7] p-5 rounded-2xl border border-agri-100/80">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">
                  {t('satellite.vegHealth')}
                </span>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-4xl sm:text-5xl font-extrabold text-[#0f291e] tracking-tight">
                    {satellite.ndvi !== null
                        ? satellite.ndvi.toFixed(4)
                         : '—'}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                    {satellite.status}
                  </span>
                </div>
                {satellite.lastUpdated && (
                  <p className="text-[11px] text-gray-400 mt-1">Last updated: {satellite.lastUpdated}</p>
                )}
              </div>

              {/* Trend Bar Chart */}
              {chartData.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('satellite.trendTitle')}
                    </h3>
                    {growthTrend && (
                      <span className={`text-[11px] font-semibold ${growthTrend.pct >= 0 ? 'text-agri-700' : 'text-red-600'}`}>
                        {growthTrend.label}
                      </span>
                    )}
                  </div>
                  <div className="h-44 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 1.0]}
                          ticks={[0, 0.25, 0.5, 0.75, 1.0]}
                          tick={{ fontSize: 10, fill: '#9ca3af' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(val: any) => [`${val}`, 'NDVI Value']}
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderColor: '#e5e7eb',
                            borderRadius: '12px',
                            fontSize: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                          }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {chartData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={index === chartData.length - 1 ? '#15803d' : '#86efac'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Explanation Callout */}
              {satellite.explanation && (
                <div className="p-4 rounded-2xl bg-[#edf7ee] border border-agri-200/80 text-xs text-gray-700 leading-relaxed">
                  <p className="font-semibold text-agri-950 mb-0.5">Vegetation Insight</p>
                  <p>{satellite.explanation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
