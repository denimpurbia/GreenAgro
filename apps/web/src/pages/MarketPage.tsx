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

const COMMODITY_MAP: Record<string, { en: string; hi: string }> = {
  Maize: { en: 'Maize', hi: 'मक्का' },
  Wheat: { en: 'Wheat', hi: 'गेहूं' },
  Soybean: { en: 'Soybean', hi: 'सोयाबीन' },
  Mustard: { en: 'Mustard', hi: 'सरसों' },
  Gram: { en: 'Gram', hi: 'चना' },
  Urad: { en: 'Urad', hi: 'उड़द' },
  Groundnut: { en: 'Groundnut', hi: 'मूंगफली' },
  Barley: { en: 'Barley', hi: 'जौ' },
};

const MANDI_LOCATIONS: Record<string, { nameHi: string; districtHi: string }> = {
  RAJ_UDR: { nameHi: 'उदयपुर कृषि मंडी (सवीना)', districtHi: 'उदयपुर' },
  RAJ_FTN: { nameHi: 'फतहनगर कृषि मंडी', districtHi: 'उदयपुर' },
  RAJ_SLM: { nameHi: 'सलूम्बर मंडी यार्ड', districtHi: 'सलूम्बर' },
  RAJ_RJS: { nameHi: 'राजसमंद (कांकरोली मंडी)', districtHi: 'राजसमंद' },
  RAJ_DNP: { nameHi: 'डूंगरपुर कृषि उपज मंडी', districtHi: 'डूंगरपुर' },
  RAJ_BSW: { nameHi: 'बांसवाड़ा एपीएमसी मंडी', districtHi: 'बांसवाड़ा' },
  RAJ_CTG: { nameHi: 'चित्तौड़गढ़ कृषि मंडी', districtHi: 'चित्तौड़गढ़' },
  RAJ_BLW: { nameHi: 'भीलवाड़ा अनाज मंडी', districtHi: 'भीलवाड़ा' },
};

const MANDI_NAME_FALLBACK_HI: Record<string, { nameHi: string; districtHi: string }> = {
  'Udaipur APMC (Savina Krishi Mandi)': { nameHi: 'उदयपुर कृषि मंडी (सवीना)', districtHi: 'उदयपुर' },
  'Fatehnagar Krishi Mandi': { nameHi: 'फतहनगर कृषि मंडी', districtHi: 'उदयपुर' },
  'Rajsamand (Kankroli Mandi)': { nameHi: 'राजसमंद (कांकरोली मंडी)', districtHi: 'राजसमंद' },
  'Chittorgarh Krishi Mandi': { nameHi: 'चित्तौड़गढ़ कृषि मंडी', districtHi: 'चित्तौड़गढ़' },
  'Salumber Mandi Yard': { nameHi: 'सलूम्बर मंडी यार्ड', districtHi: 'सलूम्बर' },
  'Dungarpur Mandi': { nameHi: 'डूंगरपुर कृषि उपज मंडी', districtHi: 'डूंगरपुर' },
  'Banswara APMC Market': { nameHi: 'बांसवाड़ा एपीएमसी मंडी', districtHi: 'बांसवाड़ा' },
  'Bhilwara Grain Market': { nameHi: 'भीलवाड़ा अनाज मंडी', districtHi: 'भीलवाड़ा' },
};

const DISTRICT_HI: Record<string, string> = {
  udaipur: 'उदयपुर',
  Udaipur: 'उदयपुर',
  'Udaipur District': 'उदयपुर जिला',
  rajsamand: 'राजसमंद',
  Rajsamand: 'राजसमंद',
  'Rajsamand District': 'राजसमंद जिला',
  chittorgarh: 'चित्तौड़गढ़',
  Chittorgarh: 'चित्तौड़गढ़',
  'Chittorgarh District': 'चित्तौड़गढ़ जिला',
  salumber: 'सलूम्बर',
  Salumber: 'सलूम्बर',
  'Salumber District': 'सलूम्बर जिला',
  dungarpur: 'डूंगरपुर',
  Dungarpur: 'डूंगरपुर',
  'Dungarpur District': 'डूंगरपुर जिला',
  banswara: 'बांसवाड़ा',
  Banswara: 'बांसवाड़ा',
  'Banswara District': 'बांसवाड़ा जिला',
  bhilwara: 'भीलवाड़ा',
  Bhilwara: 'भीलवाड़ा',
  'Bhilwara District': 'भीलवाड़ा जिला',
};

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
        setPublishMsg(
          isHi
            ? `${selectedCommodity} के लिए आधिकारिक मंडी मॉडल भाव ₹${modalPriceInput}/क्विंटल सफलतापूर्वक दर्ज किया गया।`
            : `Published official APMC modal price ₹${modalPriceInput}/q for ${selectedCommodity}.`
        );
        setModalPriceInput('');
        await fetchMarketComparison();
      }
    } catch {
      // Ignore error
    } finally {
      setPublishing(false);
    }
  };

  const selectedCropLabel = isHi
    ? COMMODITY_MAP[selectedCommodity]?.hi || selectedCommodity
    : selectedCommodity;

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
            <span>{isHi ? 'एपीएमसी प्राधिकरण नियंत्रण' : 'APMC Market Authority Access'}</span>
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
            {commodities.map((crop) => {
              const label = isHi ? COMMODITY_MAP[crop]?.hi || crop : crop;
              return (
                <button
                  key={crop}
                  onClick={() => setSelectedCommodity(crop)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCommodity === crop
                      ? 'bg-agri-800 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
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
                {isHi
                  ? `आधिकारिक एपीएमसी मंडी भाव दर्ज करें (${selectedCropLabel})`
                  : `Publish Official APMC Mandi Arrival Price (${selectedCommodity})`}
              </h3>
              <p className="text-xs text-gray-500">
                {isHi
                  ? 'सत्यापित सरकारी व एपीएमसी अधिकारी दैनिक मॉडल भाव दर्ज कर सकते हैं, जिससे किसानों को सही रैंकिंग मिलती है।'
                  : 'Verified Government / APMC officials can record daily modal prices to power net-price rankings for farmers.'}
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
              {(mandisList.length > 0
                ? mandisList
                : [
                    { mandiCode: 'RAJ_UDR', nameEn: 'Udaipur APMC (Savina Krishi Mandi)' },
                    { mandiCode: 'RAJ_FTN', nameEn: 'Fatehnagar Krishi Mandi' },
                    { mandiCode: 'RAJ_SLM', nameEn: 'Salumber Mandi Yard' },
                    { mandiCode: 'RAJ_RJS', nameEn: 'Rajsamand (Kankroli Mandi)' },
                    { mandiCode: 'RAJ_DNP', nameEn: 'Dungarpur Mandi' },
                    { mandiCode: 'RAJ_BSW', nameEn: 'Banswara APMC Market' },
                    { mandiCode: 'RAJ_CTG', nameEn: 'Chittorgarh Krishi Mandi' },
                    { mandiCode: 'RAJ_BLW', nameEn: 'Bhilwara Grain Market' },
                  ]
              ).map((m: any) => {
                const mandiName = isHi
                  ? MANDI_LOCATIONS[m.mandiCode]?.nameHi || m.nameEn || m.mandiName
                  : m.nameEn || m.mandiName;
                return (
                  <option key={m.mandiCode} value={m.mandiCode}>
                    {mandiName}
                  </option>
                );
              })}
            </select>

            <input
              type="number"
              required
              min="500"
              max="25000"
              value={modalPriceInput}
              onChange={(e) => setModalPriceInput(e.target.value)}
              placeholder={isHi ? `मॉडल भाव ${selectedCropLabel} (₹/क्विंटल)` : `Modal Price for ${selectedCommodity} (₹/q)`}
              className="border border-gray-200 rounded-xl px-3.5 py-2 w-60"
            />

            <button
              type="submit"
              disabled={publishing}
              className="px-4 py-2 rounded-xl bg-agri-800 hover:bg-agri-900 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{publishing ? (isHi ? 'दर्ज हो रहा है...' : 'Publishing...') : (isHi ? 'भाव दर्ज करें' : 'Publish APMC Price')}</span>
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
            <div className="flex items-center gap-2 flex-wrap">
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
                  ? isHi
                    ? 'बिक्री करें (SELL NOW)'
                    : 'SELL NOW'
                  : advisory.action === 'HOLD'
                    ? isHi
                      ? 'रोकें (HOLD)'
                      : 'HOLD'
                    : isHi
                      ? `एमएसपी 2024-25: ₹${advisory.mspPrice || '—'}/क्विंटल`
                      : `MSP 2024-25: ₹${advisory.mspPrice || '—'}/q`}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-800 leading-snug">
              {isHi ? advisory.reasonHi : advisory.reasonEn}
            </p>
          </div>
        </div>
      )}

      {/* Ranked Mandis Table */}
      <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="font-bold text-gray-900 text-base">
              {isHi
                ? `शीर्ष मंडियां — शुद्ध लाभ अनुसार (${selectedCropLabel})`
                : `Top Mandis by Net Realization (${selectedCommodity})`}
            </h3>
            <p className="text-xs text-gray-400">
              {isHi
                ? 'सूत्र: शुद्ध भाव = मॉडल मंडी भाव − परिवहन लागत − एपीएमसी मंडी शुल्क (1.6%)'
                : 'Formula: Net Price = Modal Mandi Price − Transport Cost − APMC Mandi Fee (1.6%)'}
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-agri-50 text-agri-800 border border-agri-200 self-start sm:self-auto">
            {rankedMandis.length > 0
              ? isHi
                ? 'सर्वाधिक शुद्ध लाभ अनुसार'
                : 'Ranked by Net Return'
              : isHi
                ? 'सरकारी एमएसपी संदर्भ सक्रिय'
                : 'Statutory MSP Reference Active'}
          </span>
        </div>

        {rankedMandis.length === 0 && !loading ? (
          <div className="py-8 px-4 text-center bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
            <p className="text-xs sm:text-sm font-bold text-gray-700">
              {providerStatus === 'configuration_required'
                ? isHi
                  ? 'दैनिक मंडी आवक का लाइव डेटा कॉन्फ़िगर नहीं है (कोई मनगढ़ंत भाव नहीं दिखाया जा रहा)'
                  : 'Live Agmarknet Daily Arrival Feed Not Configured (Zero Fabricated Prices Shown)'
                : isHi
                  ? `आज ${selectedCropLabel} के लिए कोई सत्यापित मंडी भाव दर्ज नहीं है।`
                  : `No verified mandi arrival quotes recorded for ${selectedCommodity} today.`}
            </p>
            <p className="text-xs text-gray-500 max-w-xl mx-auto">
              {isHi
                ? 'सत्यापित सरकारी अथवा एपीएमसी अधिकारी से आधिकारिक दैनिक भाव दर्ज कराए जा सकते हैं।'
                : 'Set DATA_GOV_IN_API_KEY in apps/api/.env or publish official APMC bulletin prices from a verified Government account.'}
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
                  <th className="pb-3 font-semibold text-right text-agri-800">{isHi ? 'शुद्ध भाव (नेट)' : 'Net In-Pocket'}</th>
                  <th className="pb-3 font-semibold text-center">{isHi ? 'ई-नाम' : 'e-NAM'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rankedMandis.map((m) => {
                  const mandiObj = MANDI_LOCATIONS[m.mandiCode] || MANDI_NAME_FALLBACK_HI[m.mandiName];
                  const mandiDisplayName = isHi
                    ? mandiObj?.nameHi || m.nameHi || m.mandiName
                    : m.nameEn || m.mandiName;
                  const rawDistrict = m.district || mandiObj?.districtHi || '';
                  const districtDisplayName = isHi
                    ? DISTRICT_HI[rawDistrict] || (mandiObj ? `${mandiObj.districtHi} जिला` : `${rawDistrict} जिला`)
                    : `${rawDistrict} District`;

                  return (
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
                        <span className="font-bold text-gray-900 block">{mandiDisplayName}</span>
                        <span className="text-[11px] text-gray-400">{districtDisplayName}</span>
                      </td>
                      <td className="py-3.5 text-center text-gray-600 font-medium">
                        {m.distanceKm} {isHi ? 'किमी' : 'km'}
                      </td>
                      <td className="py-3.5 text-right font-bold text-gray-800">
                        ₹{m.modalPrice}
                        <span className="text-[10px] text-gray-400 block font-normal">
                          {isHi ? '/क्विंटल' : '/quintal'}
                        </span>
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
                              ? isHi
                                ? `+₹${m.differenceFromMsp} (MSP से अधिक)`
                                : `+₹${m.differenceFromMsp} vs MSP`
                              : isHi
                                ? `-₹${Math.abs(m.differenceFromMsp)} (MSP से कम)`
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
                          <span>{isHi ? 'व्यापार' : 'Trade'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
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
              ? 'भारत सरकार न्यूनतम समर्थन मूल्य (CACP MSP 2024-25 संदर्भ)'
              : 'Statutory Minimum Support Prices (GOI CACP 2024-25 Reference)'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs">
            {mspRates.map((r: any) => {
              const cropLabel = isHi ? COMMODITY_MAP[r.commodity]?.hi || r.commodity : r.commodity;
              const seasonLabel = isHi
                ? r.season === 'Kharif'
                  ? 'खरीफ'
                  : 'रबी'
                : r.season;

              return (
                <div
                  key={r.commodity}
                  className={`p-3 rounded-xl border text-center ${
                    r.commodity === selectedCommodity
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="font-bold text-gray-800 truncate">{cropLabel}</div>
                  <div className="text-sm font-black text-agri-800 mt-0.5">
                    ₹{r.mspPrice}{isHi ? '/क्विंटल' : '/q'}
                  </div>
                  <div className="text-[10px] text-gray-400">{seasonLabel}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
export default MarketPage;
