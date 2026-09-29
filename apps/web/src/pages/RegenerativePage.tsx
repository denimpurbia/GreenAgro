import React from 'react';
import { Leaf, Droplets, RotateCcw, Sprout, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const RegenerativePage: React.FC = () => {
  const { t, regenerative, regenerativeLoading } = useApp();

  const getRecIcon = (category: string) => {
    switch (category) {
      case 'soil':
        return <Leaf className="w-5 h-5 text-emerald-700" />;
      case 'water':
        return <Droplets className="w-5 h-5 text-blue-700" />;
      case 'crop':
        return <RotateCcw className="w-5 h-5 text-teal-700" />;
      default:
        return <Sprout className="w-5 h-5 text-green-700" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header matching Screen 9 */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f291e]">
          {t('regenerative.title')}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          {t('regenerative.subtitle')}
        </p>
      </div>

      {/* Empty state: soil not yet entered */}
      {!regenerative && !regenerativeLoading && (
        <div className="bg-white rounded-3xl p-8 border border-[#e8ece8] shadow-card flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#edf7ee] border border-agri-200 flex items-center justify-center text-agri-700">
            <Sprout className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-base text-gray-900">Regenerative Score Not Yet Calculated</h3>
            <p className="text-xs text-gray-500 mt-2 max-w-sm leading-relaxed">
              Enter your soil parameters on the{' '}
              <a href="/app/soil" className="text-agri-700 font-semibold underline">Soil Health page</a>{' '}
              to unlock your personalized Regenerative Farming Plan.
            </p>
          </div>
        </div>
      )}

      {regenerativeLoading && (
        <div className="flex items-center justify-center py-10 gap-3">
          <div className="w-6 h-6 border-2 border-agri-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Computing regenerative plan...</span>
        </div>
      )}

      {/* Full content — only rendered when regenerative plan is available */}
      {regenerative && !regenerativeLoading && (
      <>
      {/* Top Metrics Row: Score Gauge & Pillar Breakdown matching Screen 9 */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#e8ece8] shadow-card">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Circular Gauge */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 border-b lg:border-b-0 lg:border-r border-gray-100">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              {t('regenerative.scoreTitle')}
            </span>

            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  stroke="#e8ede8"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  stroke="#15803d"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - regenerative.overallScore / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-[#0f291e] leading-none">
                  {regenerative.overallScore} / 100
                </span>
                <span className="text-xs font-semibold text-agri-700 bg-agri-50 px-2.5 py-0.5 rounded-full mt-2 border border-agri-200/60">
                  {regenerative.ratingLabel || t('regenerative.goodProgress')}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Score Breakdown Progress Bars matching Screen 9 */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                {t('regenerative.breakdownTitle')}
              </h2>
            </div>

            <div className="space-y-3">
              {regenerative.pillars.map((pillar, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                    <span className="text-gray-700">{pillar.name}</span>
                    <span className="font-bold text-gray-900">{pillar.score}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pillar.score}%`,
                        backgroundColor:
                          pillar.score > 75
                            ? '#15803d'
                            : pillar.score > 65
                            ? '#22c55e'
                            : '#eab308',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key Recommendations matching Screen 9 */}
      <div className="space-y-3 pt-2">
        <h2 className="text-base font-bold text-gray-900">
          {t('regenerative.recommendationsTitle')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {regenerative.keyRecommendations.map((rec) => (
            <div
              key={rec.id}
              className="bg-white p-5 rounded-3xl border border-[#e8ece8] shadow-card hover:shadow-elevated transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-[#f0fdf4] border border-agri-100 flex items-center justify-center mb-3.5">
                  {getRecIcon(rec.category)}
                </div>
                <h3 className="font-bold text-sm text-gray-900 leading-snug">
                  {rec.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  {rec.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
                <span className="text-agri-700 font-semibold">{rec.timeHorizon}</span>
                <span className="text-gray-400">Target</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      </>
      )}
    </div>
  );
};
