import React, { useState, useEffect, useCallback } from 'react';
import {
  Store,
  Truck,
  Sparkles,
  ExternalLink,
  AlertCircle,
  Plus,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const MarketPage: React.FC = () => {
  const { language, user } = useApp();
  const isHi = language === 'hi';
  const isGovt = authService.isGovtOrg(user);

  const [selectedCommodity, setSelectedCommodity] = useState('Maize');
  const [transportRate, setTransportRate] = useState(1.8); // Rs / km / quintal
  const [rankedMandis, setRankedMandis] = useState<any[]>([]);
  const [mandisList, setMandisList] = useState<any[]>([]);
  const [mspRates, setMspRates] = useState<any[]>([]);
  const [advisory, setAdvisory] = useState<any>(null);
  const [providerStatus, setProviderStatus] = useState<string>('configuration_required');
  const [loading, setLoading] = useState(true);

  // Govt Admin APMC Bulletin Form
  const [selectedMandiCode, setSelectedMandiCode] = useState('RAJ_UDR');
  const [modalPriceInput, setModalPriceInput] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);

  const commodities = ['Maize', 'Wheat', 'Soybean', 'Mustard', 'Gram', 'Urad', 'Groundnut', 'Barley'];

  const fetchMarketComparison = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/market/compare?commodity=${selectedCommodity}&transportCostPerKm=${transportRate}`
      );
      const data = await res.json();
      if (data.success) {
        setRankedMandis(data.rankedMandis || []);
        setAdvisory(data.advisory || null);
        setMandisList(data.mandis || []);
        setMspRates(data.mspRates || []);
        setProviderStatus(data.providerStatus || 'configuration_required');
      }
    } catch (err) {
      console.warn('[MarketPage] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCommodity, transportRate]);

  useEffect(() => {
    fetchMarketComparison();
  }, [fetchMarketComparison]);

  const handlePublishBulletin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPriceInput || !isFinite(Number(modalPriceInput))) return;
    setPublishing(true);
    setPublishMsg(null);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE}/market/prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          mandiCode: selectedMandiCode,
          commodity: selectedCommodity,
          modalPrice: Number(modalPriceInput),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setPublishMsg(`Published official APMC modal price ₹${modalPriceInput}/q for ${selectedCommodity}.`);
        setModalPriceInput('');
        await fetchMarketComparison();
      }
    } catch {
      // Ignore error
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f291e] flex items-center gap-2.5">
            <Store className="w-7 h-7 text-agri-700 stroke-[2.2]" />
            <span>
              {isGovt
                ? isHi
                  ? 'उचित बाजार निगरानी एवं एपीएमसी बुलेटिन'
                  : 'Fair Market Monitoring & APMC Bulletin'
                : isHi
                  ? 'उचित बाजार एवं शुद्ध मंडी भाव'
                  : 'Fair Market Access & Net Price Engine'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {isHi
              ? 'परिवहन खर्च व मंडी शुल्क घटाकर सर्वाधिक शुद्ध लाभ (Net in-pocket) देने वाली मंडियों की रैंकिंग'
              : 'Mandi comparison ranked by true net price after transport cost and APMC mandi fees'}
          </p>
        </div>

        {isGovt && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900 text-white text-xs font-bold shrink-0">
            <ShieldCheck className="w-4 h-4" />
            <span>APMC Market Authority Access</span>
          </span>
        )}
      </div>

      {/* Commodity Selector & Transport Rate Slider */}
      <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-gray-500 block">
            {isHi ? 'फसल चुनें' : 'Select Commodity'}
          </span>
          <div className="flex flex-wrap gap-2">
            {commodities.map((crop) => (
              <button
                key={crop}
                onClick={() => setSelectedCommodity(crop)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCommodity === crop
                    ? 'bg-agri-800 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {crop}
              </button>
            ))}
          </div>
        </div>

        {/* Transport Cost Config */}
        <div className="bg-[#f8faf7] border border-gray-200 rounded-xl p-3.5 min-w-[240px]">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1.5">
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-agri-700" />
              <span>{isHi ? 'परिवहन दर (₹/किमी/क्विंटल)' : 'Transport Rate (₹/km/q)'}</span>
            </span>
            <span className="text-agri-800 font-extrabold">₹{transportRate}</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="4.0"
            step="0.2"
            value={transportRate}
            onChange={(e) => setTransportRate(parseFloat(e.target.value))}
            className="w-full accent-agri-800 cursor-pointer"
          />
        </div>
      </div>

      {/* Govt / Org Official APMC Bulletin Entry Form */}
      {isGovt && (
        <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-gray-900">
                Publish Official APMC Mandi Arrival Price ({selectedCommodity})
              </h3>
              <p className="text-xs text-gray-500">
                Verified Government / APMC officials can record daily modal prices to power net-price rankings for farmers.
              </p>
            </div>
          </div>

          {publishMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{publishMsg}</span>
            </div>
          )}

          <form onSubmit={handlePublishBulletin} className="flex flex-wrap items-center gap-3 text-xs">
            <select
              value={selectedMandiCode}
              onChange={(e) => setSelectedMandiCode(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 bg-[#f8faf8] font-semibold"
            >
              {(mandisList.length > 0 ? mandisList : [
                { mandiCode: 'RAJ_UDR', nameEn: 'Udaipur APMC (Savina Krishi Mandi)' },
                { mandiCode: 'RAJ_FTN', nameEn: 'Fatehnagar Krishi Mandi' },
                { mandiCode: 'RAJ_SLM', nameEn: 'Salumber Mandi Yard' },
                { mandiCode: 'RAJ_RJS', nameEn: 'Rajsamand (Kankroli Mandi)' },
                { mandiCode: 'RAJ_DNP', nameEn: 'Dungarpur Mandi' },
                { mandiCode: 'RAJ_BSW', nameEn: 'Banswara APMC Market' },
                { mandiCode: 'RAJ_CTG', nameEn: 'Chittorgarh Krishi Mandi' },
                { mandiCode: 'RAJ_BLW', nameEn: 'Bhilwara Grain Market' },
              ]).map((m: any) => (
                <option key={m.mandiCode} value={m.mandiCode}>
                  {m.nameEn}
                </option>
              ))}
            </select>

            <input
              type="number"
              required
              min="500"
              max="25000"
              value={modalPriceInput}
              onChange={(e) => setModalPriceInput(e.target.value)}
              placeholder={`Modal Price for ${selectedCommodity} (₹/q)`}
              className="border border-gray-200 rounded-xl px-3.5 py-2 w-60"
            />

            <button
              type="submit"
              disabled={publishing}
              className="px-4 py-2 rounded-xl bg-agri-800 hover:bg-agri-900 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{publishing ? 'Publishing...' : 'Publish APMC Price'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Advisory / Provider Status Card */}
      {advisory && (
        <div
          className={`border rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            advisory.action === 'SELL'
              ? 'bg-emerald-50/80 border-emerald-200'
              : advisory.action === 'HOLD'
                ? 'bg-amber-50/80 border-amber-200'
                : 'bg-blue-50/70 border-blue-200'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {advisory.action === 'UNAVAILABLE' ? (
                <AlertCircle className="w-4 h-4 text-blue-700" />
              ) : (
                <Sparkles className="w-4 h-4 text-agri-800" />
              )}
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-700">
                {isHi ? 'बाजार सलाह एवं एमएसपी स्थिति' : 'Market Advisory & Statutory MSP Status'}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                  advisory.action === 'SELL'
                    ? 'bg-emerald-600 text-white'
                    : advisory.action === 'HOLD'
                      ? 'bg-amber-600 text-white'
                      : 'bg-blue-700 text-white'
                }`}
              >
                {advisory.action === 'SELL'
                  ? 'SELL NOW (बिक्री करें)'
                  : advisory.action === 'HOLD'
                    ? 'HOLD (रोकें)'
                    : `MSP 2024-25: ₹${advisory.mspPrice || '—'}/q`}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-800 leading-snug">
              {isHi ? advisory.reasonHi : advisory.reasonEn}
            </p>
          </div>
        </div>
      )}

      {/* Ranked Mandis Table (or Honest No Live Arrival Data State) */}
      <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base">
              {isHi
                ? `शीर्ष मंडियां — शुद्ध लाभ अनुसार (${selectedCommodity})`
                : `Top Mandis by Net Realization (${selectedCommodity})`}
            </h3>
            <p className="text-xs text-gray-400">
              Formula: Net Price = Modal Mandi Price − Transport Cost − APMC Mandi Fee (1.6%)
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-agri-50 text-agri-800 border border-agri-200">
            {rankedMandis.length > 0 ? 'Ranked by Net Return' : 'Statutory MSP Reference Active'}
          </span>
        </div>

        {rankedMandis.length === 0 && !loading ? (
          <div className="py-8 px-4 text-center bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
            <p className="text-xs sm:text-sm font-bold text-gray-700">
              {providerStatus === 'configuration_required'
                ? 'Live Agmarknet Daily Arrival Feed Not Configured (Zero Fabricated Prices Shown)'
                : `No verified mandi arrival quotes recorded for ${selectedCommodity} today.`}
            </p>
            <p className="text-xs text-gray-500 max-w-xl mx-auto">
              Set <code className="bg-gray-200 px-1 rounded">DATA_GOV_IN_API_KEY</code> in <code className="bg-gray-200 px-1 rounded">apps/api/.env</code> to ingest live data.gov.in Agmarknet arrivals, or publish official APMC bulletin prices from a verified Government / Organization account.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase text-[11px]">
                  <th className="pb-3 font-semibold text-center w-12">#</th>
                  <th className="pb-3 font-semibold">{isHi ? 'मंडी' : 'Mandi'}</th>
                  <th className="pb-3 font-semibold text-center">{isHi ? 'दूरी' : 'Distance'}</th>
                  <th className="pb-3 font-semibold text-right">{isHi ? 'मॉडल भाव' : 'Mandi Price'}</th>
                  <th className="pb-3 font-semibold text-right text-red-600">{isHi ? 'परिवहन' : 'Transport'}</th>
                  <th className="pb-3 font-semibold text-right text-agri-800">{isHi ? 'शुद्ध भाव (Net)' : 'Net In-Pocket'}</th>
                  <th className="pb-3 font-semibold text-center">e-NAM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rankedMandis.map((m) => (
                  <tr key={m.mandiCode} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 text-center font-extrabold text-gray-500">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                          m.rank === 1
                            ? 'bg-amber-100 text-amber-900 font-black'
                            : m.rank === 2
                              ? 'bg-gray-200 text-gray-800'
                              : m.rank === 3
                                ? 'bg-orange-100 text-orange-900'
                                : 'text-gray-400'
                        }`}
                      >
                        {m.rank}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className="font-bold text-gray-900 block">{m.mandiName}</span>
                      <span className="text-[11px] text-gray-400 capitalize">{m.district} District</span>
                    </td>
                    <td className="py-3.5 text-center text-gray-600 font-medium">
                      {m.distanceKm} km
                    </td>
                    <td className="py-3.5 text-right font-bold text-gray-800">
                      ₹{m.modalPrice}
                      <span className="text-[10px] text-gray-400 block font-normal">/quintal</span>
                    </td>
                    <td className="py-3.5 text-right text-red-600 font-semibold">
                      -₹{m.transportCost}
                    </td>
                    <td className="py-3.5 text-right">
                      <span className="text-base font-black text-agri-900">
                        ₹{m.netPrice}
                      </span>
                      {typeof m.differenceFromMsp === 'number' && (
                        <span
                          className={`text-[10px] block font-semibold ${
                            m.differenceFromMsp >= 0 ? 'text-emerald-600' : 'text-red-500'
                          }`}
                        >
                          {m.differenceFromMsp >= 0
                            ? `+₹${m.differenceFromMsp} vs MSP`
                            : `-₹${Math.abs(m.differenceFromMsp)} vs MSP`}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-center">
                      <a
                        href={`https://enam.gov.in/web/dashboard/trade-data`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-agri-800 hover:underline"
                      >
                        <span>Trade</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Statutory CACP Minimum Support Prices (2024-25) Reference Grid */}
      {mspRates.length > 0 && (
        <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-3">
            {isHi
              ? 'भारत सरकार न्यूनतम समर्थन मूल्य (CACP MSP 2024-25)'
              : 'Statutory Minimum Support Prices (GOI CACP 2024-25 Reference)'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs">
            {mspRates.map((r: any) => (
              <div
                key={r.commodity}
                className={`p-3 rounded-xl border text-center ${
                  r.commodity === selectedCommodity
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="font-bold text-gray-800">{r.commodity}</div>
                <div className="text-sm font-black text-agri-800 mt-0.5">₹{r.mspPrice}/q</div>
                <div className="text-[10px] text-gray-400">{r.season}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
