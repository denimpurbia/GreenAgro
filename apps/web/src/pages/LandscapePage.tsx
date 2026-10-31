import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Mountain,
  Waves,
  ArrowRight,
  TrendingUp,
  Sprout,
  Trees,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const LandscapePage: React.FC = () => {
  const { language } = useApp();
  const [data, setData] = useState<any>(null);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const token = authService.getToken();
    fetch(`${API_BASE}/landscape`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json);
      })
      .catch((err) => console.warn('[LandscapePage] Error:', err))
      .finally(() => setLoading(false));
  }, []);

  const index = data?.index || {
    score: null,
    status: 'no_data',
    activeComponents: [],
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f291e] flex items-center gap-2.5">
          <Mountain className="w-7 h-7 text-emerald-800 stroke-[2.2]" />
          <span>{language === 'hi' ? 'रिज-टू-झील परिदृश्य आसूचना' : 'Ridge-to-Lake Intelligence Platform'}</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          {language === 'hi'
            ? 'अरावली पहाड़ से लेकर खेतों, नालों और झीलों तक एकीकृत पारिस्थितिकीय स्वास्थ्य सूचकांक'
            : 'Unified landscape intelligence connecting the Aravalli Ridge, agricultural slopes, drainage basins & terminal lakes'}
        </p>
      </div>

      {/* Flagship Banner Quote */}
      <div className="bg-gradient-to-r from-[#0d2a1c] via-[#143d29] to-[#0a2317] text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
            {language === 'hi' ? 'पारिस्थितिकीय सिद्धांत' : 'Landscape Principle'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black leading-tight text-white">
            "{language === 'hi' ? data?.bannerQuoteHi || 'पहाड़ से निकली हर बूंद और मिट्टी की हर परत आपकी झील तक पहुंचती है।' : data?.bannerQuoteEn || 'What happens upstream reaches your lake.'}"
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed pt-1">
            {language === 'hi'
              ? 'अरावली की चोटी पर होने वाले वन कटाव, खेतों में होने वाले मृदा क्षरण और रासायनिक बहाव का सीधा असर नीचे स्थित पिछोला, फतेह सागर और राजसमंद जैसी झीलों पर पड़ता है।'
              : 'Every hectare of soil stabilized and tree preserved on upstream Aravalli slopes directly preserves freshwater availability and water quality in terminal regional reservoirs.'}
          </p>
        </div>
      </div>

      {/* Landscape Health Index Big Card */}
      <div className="bg-white border border-[#e8ece8] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
          <div>
            <h3 className="font-extrabold text-gray-900 text-lg">
              {language === 'hi' ? 'समग्र परिदृश्य स्वास्थ्य सूचकांक' : 'Unified Landscape Health Index'}
            </h3>
            <p className="text-xs text-gray-400">
              Composite regional score computed from real satellite indices and field conservation data
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status:</span>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 capitalize">
              {index.status === 'no_data' ? 'Awaiting Telemetry' : index.status}
            </span>
            {index.score !== null && index.score !== undefined ? (
              <span className="text-3xl font-black text-emerald-900">
                {index.score}
                <span className="text-sm font-normal text-gray-400">/100</span>
              </span>
            ) : (
              <span className="text-sm font-bold text-amber-800">No data yet</span>
            )}
          </div>
        </div>

        {/* 4 Pillars Breakdown (Real Data Only) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          <div className="bg-[#f0f7f3] border border-agri-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1.5 text-emerald-800 font-bold text-xs">
              <Trees className="w-4 h-4 text-emerald-700" />
              <span>Aravalli Forest (25%)</span>
            </div>
            {data?.summary?.aravalliIntegrityScore !== null &&
            data?.summary?.aravalliIntegrityScore !== undefined ? (
              <span className="text-2xl font-black text-emerald-950">
                {data.summary.aravalliIntegrityScore}/100
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-800 block mt-1">
                Configuration required
              </span>
            )}
            <p className="text-[11px] text-gray-500 mt-1">Canopy cover &amp; fire defense</p>
          </div>

          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1.5 text-sky-800 font-bold text-xs">
              <Mountain className="w-4 h-4 text-sky-700" />
              <span>Watershed Slopes (25%)</span>
            </div>
            {data?.summary?.watershedResilienceScore !== null &&
            data?.summary?.watershedResilienceScore !== undefined ? (
              <span className="text-2xl font-black text-sky-950">
                {data.summary.watershedResilienceScore}/100
              </span>
            ) : (
              <span className="text-xs font-bold text-gray-500 block mt-1">
                No parcels analyzed yet
              </span>
            )}
            <p className="text-[11px] text-gray-500 mt-1">
              RUSLE erosion resilience ({data?.summary?.analyzedWatershedParcelsCount ?? 0} parcels)
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1.5 text-blue-800 font-bold text-xs">
              <Waves className="w-4 h-4 text-blue-700" />
              <span>Lake Health (30%)</span>
            </div>
            {data?.summary?.averageLakeHealth !== null &&
            data?.summary?.averageLakeHealth !== undefined ? (
              <span className="text-2xl font-black text-blue-950">
                {data.summary.averageLakeHealth}/100
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-800 block mt-1">
                Configuration required
              </span>
            )}
            <p className="text-[11px] text-gray-500 mt-1">Water spread, NDTI, NDCI</p>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1.5 text-amber-800 font-bold text-xs">
              <Sprout className="w-4 h-4 text-amber-700" />
              <span>Farm Regeneration (20%)</span>
            </div>
            <span className="text-lg font-black text-amber-950">
              {data?.summary?.farmRegenerativeScore !== null &&
              data?.summary?.farmRegenerativeScore !== undefined
                ? `${data.summary.farmRegenerativeScore}/100`
                : 'Rebalanced'}
            </span>
            <p className="text-[11px] text-gray-500 mt-1">
              {data?.summary?.contributingFarmsCount >= 5
                ? `${data.summary.contributingFarmsCount} contributing farms`
                : `${data?.summary?.contributingFarmsCount ?? 0}/5 farms required`}
            </p>
          </div>
        </div>
      </div>

      {/* Ecological Corridor Flow Visualization */}
      <div className="bg-white border border-[#e8ece8] rounded-2xl p-6 shadow-xs">
        <h3 className="font-bold text-gray-900 text-base mb-4">
          {language === 'hi' ? 'रिज-टू-झील प्राकृतिक प्रवाह तंत्र' : 'Ridge-to-Lake Natural Flow Cascade'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
          <div className="bg-[#f0f6f2] p-4 rounded-xl border border-emerald-100 text-center">
            <Mountain className="w-6 h-6 text-emerald-800 mx-auto mb-2" />
            <h4 className="font-bold text-xs text-gray-900">1. Aravalli Ridge</h4>
            <p className="text-[10px] text-gray-500 mt-0.5">Vegetation &amp; Forest Crown</p>
          </div>

          <div className="hidden md:flex justify-center text-gray-400">
            <ArrowRight className="w-5 h-5" />
          </div>

          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100 text-center">
            <TrendingUp className="w-6 h-6 text-amber-700 mx-auto mb-2" />
            <h4 className="font-bold text-xs text-gray-900">2. Slopes &amp; Farms</h4>
            <p className="text-[10px] text-gray-500 mt-0.5">Contour Bunds &amp; Terraces</p>
          </div>

          <div className="hidden md:flex justify-center text-gray-400">
            <ArrowRight className="w-5 h-5" />
          </div>

          <div className="bg-sky-50 p-4 rounded-xl border border-sky-100 text-center">
            <Waves className="w-6 h-6 text-sky-700 mx-auto mb-2" />
            <h4 className="font-bold text-xs text-gray-900">3. Drainage &amp; Lakes</h4>
            <p className="text-[10px] text-gray-500 mt-0.5">Berach Basin &amp; Pichola Sink</p>
          </div>
        </div>
      </div>

      {/* Monitored Lakes Snapshot */}
      <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-base">
            {language === 'hi' ? 'निगरानीधीन प्रमुख झीलें' : 'Monitored Regional Reservoirs'}
          </h3>
          <NavLink
            to="/app/lakes"
            className="text-xs font-bold text-agri-800 hover:underline flex items-center gap-1"
          >
            <span>View All Lakes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(data?.lakes || []).map((l: any) => (
            <NavLink
              key={l.slug}
              to={`/app/lakes/${l.slug}`}
              className="p-3 rounded-xl border border-gray-100 hover:border-sky-300 hover:bg-sky-50/40 transition-all text-center block"
            >
              <span className="font-bold text-xs text-gray-800 block truncate">
                {language === 'hi' ? l.nameHi || l.nameEn : l.nameEn}
              </span>
              <span className="text-[11px] text-sky-800 font-extrabold block mt-1">
                {l.healthScore !== null && l.healthScore !== undefined
                  ? `${l.healthScore}/100`
                  : `${l.baselineAreaHa} ha`}
              </span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};
