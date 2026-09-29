import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2, FlaskConical } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SoilHealthPage: React.FC = () => {
  const { t, soil, soilLoading, calculateSoilScore } = useApp();

  // Form starts EMPTY — no fake pre-filled Udaipur soil values
  const [soilType, setSoilType] = useState('');
  const [ph, setPh] = useState('');
  const [nitrogen, setNitrogen] = useState('');
  const [phosphorus, setPhosphorus] = useState('');
  const [potassium, setPotassium] = useState('');
  const [organicCarbon, setOrganicCarbon] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await calculateSoilScore({
      ph: parseFloat(ph) || 7.0,
      n: parseFloat(nitrogen) || 0,
      p: parseFloat(phosphorus) || 0,
      k: parseFloat(potassium) || 0,
      oc: parseFloat(organicCarbon) || 0,
    });
  };

  const hasResults = soil !== null && soil.nutrients.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f291e]">
          {t('soil.title')}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          {t('soil.subtitle')}
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#e8ece8] shadow-card">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Form: Soil Parameters */}
          <div className="lg:col-span-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900 pb-2 border-b border-gray-100">
              {t('soil.parameters')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Soil Type</label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-hidden focus:border-agri-600"
                >
                  <option value="">Select soil type</option>
                  <option value="Loamy">Loamy</option>
                  <option value="Sandy Loam">Sandy Loam</option>
                  <option value="Clay">Clay</option>
                  <option value="Black Soil">Black Soil</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('soil.ph')} <span className="text-gray-400 font-normal">(e.g. 6.5)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  placeholder="Enter soil pH (0–14)"
                  value={ph}
                  onChange={(e) => setPh(e.target.value)}
                  className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-hidden focus:border-agri-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('soil.nitrogen')} <span className="text-gray-400 font-normal">(kg/ha)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 45"
                  value={nitrogen}
                  onChange={(e) => setNitrogen(e.target.value)}
                  className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-hidden focus:border-agri-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('soil.phosphorus')} <span className="text-gray-400 font-normal">(kg/ha)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 25"
                  value={phosphorus}
                  onChange={(e) => setPhosphorus(e.target.value)}
                  className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-hidden focus:border-agri-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('soil.potassium')} <span className="text-gray-400 font-normal">(kg/ha)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 35"
                  value={potassium}
                  onChange={(e) => setPotassium(e.target.value)}
                  className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-hidden focus:border-agri-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('soil.organicCarbon')} <span className="text-gray-400 font-normal">(%)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="e.g. 0.72"
                  value={organicCarbon}
                  onChange={(e) => setOrganicCarbon(e.target.value)}
                  className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-hidden focus:border-agri-600"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={soilLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-agri-800 hover:bg-agri-900 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {soilLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Computing Soil Index...</span>
                  </>
                ) : (
                  <>
                    <span>{t('soil.analyzeButton')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Score & Nutrients */}
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-base font-bold text-gray-900 pb-2 border-b border-gray-100">
              {t('soil.scoreTitle')}
            </h2>

            {/* Empty state before first submission */}
            {!hasResults && !soilLoading && (
              <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-4">
                  <FlaskConical className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">Enter soil parameters to calculate your soil health index.</p>
                <p className="text-xs text-gray-400 mt-1">Results will appear here after you submit the form.</p>
              </div>
            )}

            {/* Loading state */}
            {soilLoading && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-agri-600" />
                <p className="text-xs text-gray-500">Computing soil health index...</p>
              </div>
            )}

            {/* Results */}
            {hasResults && !soilLoading && (
              <>
                {/* Circular Gauge */}
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="48" stroke="#e8ede8" strokeWidth="10" fill="transparent" />
                      <circle
                        cx="60"
                        cy="60"
                        r="48"
                        stroke="#22c55e"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={2 * Math.PI * 48 * (1 - soil!.score / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#0f291e] leading-none">
                        {soil!.score} / 100
                      </span>
                      <span className="text-xs font-semibold text-agri-700 bg-agri-50 px-2.5 py-0.5 rounded-full mt-1.5 border border-agri-200/60">
                        {soil!.rating}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nutrient Status List */}
                <div className="space-y-2.5 bg-[#f8faf7] p-4 rounded-2xl border border-agri-100/80">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    {t('soil.nutrientStatus')}
                  </h3>
                  <div className="space-y-2 pt-1">
                    {soil!.nutrients.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium text-gray-700">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-xs">
                            {item.value} {item.unit}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                              item.color === 'red'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : item.color === 'amber'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.color === 'red'
                                  ? 'bg-red-500'
                                  : item.color === 'amber'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                            <span>{item.status}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Insight Box */}
                <div className="p-4 rounded-2xl bg-[#edf7ee] border border-agri-200 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-agri-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-agri-950 uppercase tracking-wide">
                      {t('soil.aiInsightTitle')}
                    </h4>
                    <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">
                      {soil!.aiInsight}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
