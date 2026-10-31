import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import {
  Waves,
  ArrowLeft,
  AlertTriangle,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const LakeDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const token = authService.getToken();
    fetch(`${API_BASE}/lakes/${slug}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json);
      })
      .catch((err) => console.warn('[LakeDetailPage] Error fetching details:', err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agri-800"></div>
      </div>
    );
  }

  if (!data || !data.lake) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Lake Not Found</h2>
        <NavLink to="/app/lakes" className="text-agri-800 underline font-semibold text-sm">
          Return to Lakes Directory
        </NavLink>
      </div>
    );
  }

  const { lake, observations = [], latestObservation, providerNote } = data;
  const healthBreakdown = latestObservation?.healthBreakdown || null;

  const chartData = observations.map((obs: any) => ({
    month: obs.month,
    waterAreaHa: obs.waterAreaHa || 0,
    ndti: obs.ndti || 0,
    ndci: obs.ndci || 0,
    healthScore: obs.healthScore || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div>
        <NavLink
          to="/app/lakes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-agri-800 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'hi' ? 'सभी झीलों पर वापस जाएं' : 'Back to Lakes Monitor'}</span>
        </NavLink>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f291e] flex items-center gap-2.5">
              <Waves className="w-7 h-7 text-sky-600" />
              <span>{language === 'hi' ? lake.nameHi || lake.nameEn : lake.nameEn}</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 capitalize">
              {lake.district} District • Built ~{lake.builtYear || 'Historical'} • Baseline Area:{' '}
              {lake.baselineAreaHa} ha • Catchment: {lake.catchmentKm2 || '—'} km²
            </p>
          </div>
          <div className="bg-sky-50 border border-sky-100 px-4 py-2 rounded-2xl flex items-center gap-3">
            <span className="text-xs text-sky-700 font-medium">
              {language === 'hi' ? 'स्वास्थ्य सूचकांक' : 'Health Score'}
            </span>
            {latestObservation?.healthScore !== undefined && latestObservation?.healthScore !== null ? (
              <span className="text-2xl font-black text-sky-900">
                {latestObservation.healthScore}
                <span className="text-xs font-normal text-sky-600">/100</span>
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-800">
                Configuration Required
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lake Description */}
      {(lake.description || lake.descriptionHi) && (
        <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs text-xs sm:text-sm text-gray-700 leading-relaxed">
          {language === 'hi' ? lake.descriptionHi || lake.description : lake.description}
        </div>
      )}

      {/* Health Score Breakdown or Honest Configuration Required Notice */}
      <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs">
        <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">
          {language === 'hi' ? 'झील स्वास्थ्य स्कोर घटक' : 'Health Score Components & Formula Weights'}
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          {language === 'hi'
            ? 'वैज्ञानिक उपग्रह सूचकांकों के आधार पर भारित मूल्यांकन (0-100)'
            : 'Multi-criteria satellite index evaluation according to standard formula'}
        </p>

        {healthBreakdown ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#f0f7f3] border border-agri-100 rounded-xl p-3.5">
              <span className="text-xs text-agri-700 font-semibold block mb-1">
                Water Spread (40%)
              </span>
              <span className="text-xl font-bold text-agri-900">{healthBreakdown.waterAreaScore}/100</span>
              <p className="text-[11px] text-gray-500 mt-1">Vs baseline area</p>
            </div>

            <div className="bg-sky-50 border border-sky-100 rounded-xl p-3.5">
              <span className="text-xs text-sky-700 font-semibold block mb-1">
                Turbidity / NDTI (25%)
              </span>
              <span className="text-xl font-bold text-sky-900">{healthBreakdown.ndtiScore}/100</span>
              <p className="text-[11px] text-gray-500 mt-1">Suspended sediment proxy</p>
            </div>

            <div className="bg-teal-50 border border-teal-100 rounded-xl p-3.5">
              <span className="text-xs text-teal-700 font-semibold block mb-1">
                Algae / NDCI (25%)
              </span>
              <span className="text-xl font-bold text-teal-900">{healthBreakdown.ndciScore}/100</span>
              <p className="text-[11px] text-gray-500 mt-1">Chlorophyll-a bloom proxy</p>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5">
              <span className="text-xs text-amber-700 font-semibold block mb-1">
                Encroachment (10%)
              </span>
              <span className="text-xl font-bold text-amber-900">{healthBreakdown.encroachmentScore}/100</span>
              <p className="text-[11px] text-gray-500 mt-1">Shoreline integrity</p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>No Satellite Observations Available Yet:</strong>{' '}
              {providerNote ||
                'Configure EARTH_ENGINE_PROJECT and EARTH_ENGINE_CREDENTIALS_JSON to compute live Sentinel-2 MNDWI water spread, NDTI turbidity, and NDCI chlorophyll indices.'}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Water Spread Trend Chart */}
      <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">
              {language === 'hi' ? 'मासिक जल फैलाव रुझान (हेक्टेयर)' : 'Monthly Water Spread Trend (Hectares)'}
            </h3>
            <p className="text-xs text-gray-400">
              Sentinel-2 MNDWI multi-spectral water delineation
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-800">
            Baseline: {lake.baselineAreaHa} ha
          </span>
        </div>

        {chartData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="waterSpreadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [`${value} ha`, 'Water Spread Area']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="waterAreaHa"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#waterSpreadGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-gray-400">
            No monthly satellite observation series ingested yet for {lake.nameEn}.
          </div>
        )}
      </div>

      {/* Gemini AI Advisory Explanation (only when observation exists) */}
      {latestObservation && (latestObservation.aiExplanationEn || latestObservation.aiExplanationHi) && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-emerald-900 font-bold text-sm sm:text-base">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span>{language === 'hi' ? 'एआई पर्यावरण विश्लेषण (Gemini)' : 'Gemini AI Lake Analysis'}</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
            {language === 'hi' ? latestObservation.aiExplanationHi : latestObservation.aiExplanationEn}
          </p>
        </div>
      )}

      {/* Satellite Provenance Note */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-3 text-xs text-gray-500">
        <AlertTriangle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
        <p>
          <strong>Scientific Notice:</strong> Spectral indicators (MNDWI, NDTI, NDCI) are satellite-derived proxies for water spread, turbidity and chlorophyll. They should not be used as clinical or laboratory chemical water testing.
        </p>
      </div>
    </div>
  );
};
