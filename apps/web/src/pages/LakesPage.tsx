import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Waves, ArrowRight, AlertCircle, Compass } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';
import { GeoMap, GeoMapMarker } from '../components/common/GeoMap';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface LakeListItem {
  slug: string;
  nameEn: string;
  nameHi: string;
  district: string;
  baselineAreaHa: number;
  healthScore: number | null;
  observationStatus?: 'available' | 'no_data_yet' | 'configuration_required';
  providerNote?: string;
  location?: {
    coordinates: [number, number]; // [lng, lat]
  };
  latestObservation?: {
    waterAreaHa?: number;
    month?: string;
    ndti?: number;
    ndci?: number;
  } | null;
}

export const LakesPage: React.FC = () => {
  const { language } = useApp();
  const [lakes, setLakes] = useState<LakeListItem[]>([]);
  const [satelliteConfigured, setSatelliteConfigured] = useState<boolean>(false);
  const [districtFilter, setDistrictFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authService.getToken();
    fetch(`${API_BASE}/lakes`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.lakes)) {
          setLakes(data.lakes);
          setSatelliteConfigured(Boolean(data.satelliteConfigured));
        }
      })
      .catch((err) => console.warn('[LakesPage] Failed to fetch lakes:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredLakes = lakes.filter((l) => {
    if (districtFilter === 'all') return true;
    return l.district.toLowerCase() === districtFilter.toLowerCase();
  });

  const getStatusBadge = (score: number | null) => {
    if (score === null || score === undefined) {
      return {
        label: language === 'hi' ? 'कॉन्फ़िगरेशन आवश्यक' : 'Configuration Required',
        color: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    }
    if (score >= 80) {
      return {
        label: language === 'hi' ? 'उत्कृष्ट (Pristine)' : 'Pristine',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
    if (score >= 65) {
      return {
        label: language === 'hi' ? 'संतोषजनक (Good)' : 'Good',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    }
    if (score >= 50) {
      return {
        label: language === 'hi' ? 'मध्यम (Moderate)' : 'Moderate',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }
    return {
      label: language === 'hi' ? 'चिंताजनक (Poor)' : 'Poor',
      color: 'bg-red-50 text-red-700 border-red-200',
    };
  };

  const mapMarkers: GeoMapMarker[] = lakes
    .filter((l) => l.location?.coordinates)
    .map((l) => ({
      id: l.slug,
      lat: l.location!.coordinates[1],
      lng: l.location!.coordinates[0],
      title: language === 'hi' ? l.nameHi || l.nameEn : l.nameEn,
      category: 'lake',
      badge: l.healthScore !== null ? `Score: ${l.healthScore}/100` : 'Baseline Registry',
      description: `Baseline: ${l.baselineAreaHa} ha`,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f291e] flex items-center gap-2.5">
            <Waves className="w-7 h-7 text-sky-600 stroke-[2.2]" />
            <span>{language === 'hi' ? 'दक्षिणी राजस्थान झील निगरानी' : 'Regional Lake Monitor'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {language === 'hi'
              ? 'सेंटिनल-2 उपग्रह जल फैलाव (MNDWI), टर्बिडिटी (NDTI) एवं शैवाल (NDCI) विश्लेषण'
              : 'Sentinel-2 satellite water spread (MNDWI), turbidity (NDTI) and algal bloom (NDCI) tracking'}
          </p>
        </div>

        {/* District Filter */}
        <div className="flex items-center gap-2">
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-gray-700 shadow-xs focus:outline-hidden focus:border-agri-600"
          >
            <option value="all">{language === 'hi' ? 'सभी जिले (All Districts)' : 'All Districts'}</option>
            <option value="udaipur">Udaipur (उदयपुर)</option>
            <option value="rajsamand">Rajsamand (राजसमंद)</option>
            <option value="salumber">Salumber (सलूम्बर)</option>
            <option value="dungarpur">Dungarpur (डूंगरपुर)</option>
            <option value="banswara">Banswara (बांसवाड़ा)</option>
          </select>
        </div>
      </div>

      {!satelliteConfigured && !loading && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Sentinel-2 Live Observation Provider (Configuration Required):</strong> The 12 Southern Rajasthan lakes below are loaded from the verified hydrological registry with their historical baseline areas and coordinates. Live monthly MNDWI/NDTI/NDCI spectral observations require <code className="bg-amber-100 px-1 rounded">EARTH_ENGINE_PROJECT</code> and <code className="bg-amber-100 px-1 rounded">EARTH_ENGINE_CREDENTIALS_JSON</code> in <code className="bg-amber-100 px-1 rounded">apps/api/.env</code>. No fabricated lake scores are shown.
          </div>
        </div>
      )}

      {/* Regional Lake Map */}
      <div className="bg-white border border-[#e8ece8] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">
              {language === 'hi' ? 'झीलों का भू-स्थानिक मानचित्र' : 'Geospatial Lake Registry Map'}
            </h3>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            {filteredLakes.length} {language === 'hi' ? 'झीलें प्रदर्शित' : 'lakes monitored'}
          </span>
        </div>
        <GeoMap markers={mapMarkers} center={[24.571, 73.674]} zoom={9} height="360px" />
      </div>

      {/* Lake Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredLakes.map((lake) => {
          const badge = getStatusBadge(lake.healthScore);
          const hasObs = Boolean(lake.latestObservation && typeof lake.latestObservation.waterAreaHa === 'number');
          const ratio = hasObs
            ? Math.round(((lake.latestObservation!.waterAreaHa || 0) / Math.max(1, lake.baselineAreaHa)) * 100)
            : null;

          return (
            <div
              key={lake.slug}
              className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-base text-gray-900 leading-snug">
                    {language === 'hi' ? lake.nameHi || lake.nameEn : lake.nameEn}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.color}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400 capitalize mb-4">
                  {lake.district} District • {lake.baselineAreaHa} ha baseline
                </p>

                {/* Score & Spread Indicators */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3 text-center">
                    <span className="text-[11px] text-sky-700 font-medium block">
                      {language === 'hi' ? 'स्वास्थ्य स्कोर' : 'Health Score'}
                    </span>
                    {lake.healthScore !== null && lake.healthScore !== undefined ? (
                      <span className="text-xl font-extrabold text-sky-900">
                        {lake.healthScore}
                        <span className="text-xs font-normal text-sky-600">/100</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-800 block mt-1">
                        No data yet
                      </span>
                    )}
                  </div>

                  <div className="bg-[#f4f7f4] border border-agri-100 rounded-xl p-3 text-center">
                    <span className="text-[11px] text-agri-700 font-medium block">
                      {language === 'hi' ? 'वर्तमान जल स्तर' : 'Water Spread'}
                    </span>
                    {ratio !== null ? (
                      <span className="text-xl font-extrabold text-agri-900">{ratio}%</span>
                    ) : (
                      <span className="text-xs font-bold text-gray-500 block mt-1">
                        {lake.baselineAreaHa} ha (Baseline)
                      </span>
                    )}
                  </div>
                </div>

                {/* Formula Transparency Note */}
                <p className="text-[11px] text-gray-500 leading-tight mb-4">
                  {language === 'hi'
                    ? 'सूत्र: जल फैलाव 40% + टर्बिडिटी (NDTI) 25% + शैवाल (NDCI) 25% + अतिक्रमण 10%'
                    : 'Weights: Spread 40% + Turbidity (NDTI) 25% + Algae (NDCI) 25% + Encroachment 10%'}
                </p>
              </div>

              <NavLink
                to={`/app/lakes/${lake.slug}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-agri-800 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-agri-900 transition-colors"
              >
                <span>{language === 'hi' ? 'विस्तृत विवरण देखें' : 'Inspect Lake Details'}</span>
                <ArrowRight className="w-4 h-4" />
              </NavLink>
            </div>
          );
        })}
      </div>
    </div>
  );
};
