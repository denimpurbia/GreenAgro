import React, { useEffect, useState, useCallback } from 'react';
import {
  BookOpen,
  ExternalLink,
  Plus,
  CheckCircle2,
  Filter,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const CATEGORIES = [
  { id: 'all', labelEn: 'All Schemes', labelHi: 'सभी योजनाएं' },
  { id: 'soil', labelEn: 'Soil Health', labelHi: 'मृदा स्वास्थ्य' },
  { id: 'irrigation', labelEn: 'Irrigation & Water', labelHi: 'सिंचाई एवं जल' },
  { id: 'solar', labelEn: 'Solar Energy', labelHi: 'सौर ऊर्जा' },
  { id: 'insurance', labelEn: 'Crop Insurance', labelHi: 'फसल बीमा' },
  { id: 'subsidy', labelEn: 'State Subsidies', labelHi: 'राज्य अनुदान' },
];

export const SchemesPage: React.FC = () => {
  const { user, language } = useApp();
  const isHi = language === 'hi';
  const isGovt = authService.isGovtOrg(user);

  const [schemes, setSchemes] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Admin Form State
  const [code, setCode] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [category, setCategory] = useState<'soil' | 'irrigation' | 'solar' | 'insurance' | 'subsidy'>('subsidy');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [benefitsEn, setBenefitsEn] = useState('');
  const [eligibilityEn, setEligibilityEn] = useState('');
  const [officialUrl, setOfficialUrl] = useState('');
  const [isNational, setIsNational] = useState(false);

  const fetchSchemes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/schemes?category=${selectedCategory}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.schemes)) {
        setSchemes(json.schemes);
      }
    } catch {
      // Ignore fetch errors
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  const handleSaveScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE}/schemes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code,
          nameEn,
          nameHi: nameHi || nameEn,
          category,
          descriptionEn,
          benefitsEn,
          eligibilityEn,
          officialUrl,
          isNational,
          state: 'Rajasthan',
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg(`Scheme "${nameEn}" published successfully.`);
        setShowModal(false);
        setCode('');
        setNameEn('');
        setNameHi('');
        setDescriptionEn('');
        setBenefitsEn('');
        setEligibilityEn('');
        setOfficialUrl('');
        await fetchSchemes();
      } else {
        setError(json.error || json.message || 'Failed to publish scheme.');
      }
    } catch {
      setError('Network error while publishing scheme.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>
              {isHi
                ? 'केंद्र एवं राजस्थान सरकार कृषि योजनाएं'
                : 'Central & Rajasthan Government Agricultural Schemes'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">
            {isHi ? 'सरकारी कृषि योजनाएं एवं अनुदान' : 'Government Schemes & Subsidies'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {isGovt
              ? 'Publish and update official agricultural schemes, eligibility rules, and portal links for farmers.'
              : 'Verified central and Rajasthan state subsidy programs with direct application links.'}
          </p>
        </div>

        {isGovt && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-agri-800 hover:bg-agri-900 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Publish / Update Scheme</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg(null)} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-gray-400 shrink-0" />
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === c.id
                ? 'bg-agri-800 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {isHi ? c.labelHi : c.labelEn}
          </button>
        ))}
      </div>

      {/* Schemes Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agri-700"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {schemes.map((s) => (
            <div
              key={s.code}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                      s.isNational
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {s.isNational ? 'Government of India' : `${s.state || 'Rajasthan'} State Scheme`}
                  </span>
                  <span className="text-[11px] font-mono text-gray-400">{s.code}</span>
                </div>

                <h3 className="text-lg font-black text-gray-900">
                  {isHi ? s.nameHi || s.nameEn : s.nameEn}
                </h3>

                <p className="text-xs text-gray-600 leading-relaxed">
                  {isHi ? s.descriptionHi || s.descriptionEn : s.descriptionEn}
                </p>

                <div className="bg-[#f8faf8] rounded-xl p-3 border border-gray-100 space-y-1.5 text-xs">
                  <div>
                    <strong className="text-emerald-800">
                      {isHi ? 'प्रमुख लाभ:' : 'Key Benefits:'}
                    </strong>{' '}
                    <span className="text-gray-700">
                      {isHi ? s.benefitsHi || s.benefitsEn : s.benefitsEn}
                    </span>
                  </div>
                  <div>
                    <strong className="text-gray-800">
                      {isHi ? 'पात्रता:' : 'Eligibility:'}
                    </strong>{' '}
                    <span className="text-gray-600">
                      {isHi ? s.eligibilityHi || s.eligibilityEn : s.eligibilityEn}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Official Portal Verified
                </span>
                <a
                  href={s.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-colors"
                >
                  <span>{isHi ? 'आधिकारिक पोर्टल खोलें' : 'Official Portal'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Modal to Publish / Update Scheme */}
      {showModal && isGovt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-black text-gray-900">
                Publish / Update Official Agricultural Scheme
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveScheme} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Scheme Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. RAJ_SOLAR_2026"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2"
                  >
                    <option value="subsidy">State Subsidy</option>
                    <option value="soil">Soil Health</option>
                    <option value="irrigation">Irrigation &amp; Water</option>
                    <option value="solar">Solar Energy</option>
                    <option value="insurance">Crop Insurance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Scheme Name (English)</label>
                <input
                  type="text"
                  required
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Rajasthan Micro-Irrigation Subsidy"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Scheme Name (Hindi - Optional)</label>
                <input
                  type="text"
                  value={nameHi}
                  onChange={(e) => setNameHi(e.target.value)}
                  placeholder="e.g. राजस्थान सूक्ष्म सिंचाई अनुदान"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  placeholder="Describe the objective of the scheme..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Benefits</label>
                <input
                  type="text"
                  required
                  value={benefitsEn}
                  onChange={(e) => setBenefitsEn(e.target.value)}
                  placeholder="e.g. Up to 75% subsidy on drip equipment"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Eligibility</label>
                <input
                  type="text"
                  required
                  value={eligibilityEn}
                  onChange={(e) => setEligibilityEn(e.target.value)}
                  placeholder="e.g. Small and marginal farmers in Rajasthan"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Official Government Portal URL</label>
                <input
                  type="url"
                  required
                  value={officialUrl}
                  onChange={(e) => setOfficialUrl(e.target.value)}
                  placeholder="https://rajkisan.rajasthan.gov.in/"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNational}
                  onChange={(e) => setIsNational(e.target.checked)}
                />
                <span className="font-semibold text-gray-700">
                  National Scheme (Government of India)
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-agri-800 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Publishing...' : 'Publish Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

