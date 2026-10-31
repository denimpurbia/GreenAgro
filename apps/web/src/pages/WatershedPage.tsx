import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Mountain,
  ShieldAlert,
  CheckCircle2,
  MapPin,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const WatershedPage: React.FC = () => {
  const { language } = useApp();
  const location = useLocation();
  const [terrain, setTerrain] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customLat, setCustomLat] = useState('24.5854');
  const [customLng, setCustomLng] = useState('73.7125');
  const [soilType, setSoilType] = useState('loam');

  const fetchTerrain = useCallback(async (queryParams: string) => {
    setLoading(true);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE}/watershed/me${queryParams}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.success && data.terrain) {
        setTerrain(data.terrain);
      }
    } catch (err) {
      console.warn('[WatershedPage] Error fetching watershed data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const farmId = params.get('farmId');
    if (farmId) {
      fetchTerrain(`?farmId=${encodeURIComponent(farmId)}`);
    } else {
      fetchTerrain(`?lat=${customLat}&lng=${customLng}&soilType=${soilType}`);
    }
  }, [location.search]);

  const handleAnalyzeCustomPoint = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTerrain(`?lat=${encodeURIComponent(customLat)}&lng=${encodeURIComponent(customLng)}&soilType=${encodeURIComponent(soilType)}`);
  };

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'severe':
        return { badge: 'bg-red-50 text-red-700 border-red-200', text: 'text-red-700' };
      case 'high':
        return { badge: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700' };
      case 'moderate':
        return { badge: 'bg-yellow-50 text-yellow-800 border-yellow-200', text: 'text-yellow-800' };
      default:
        return { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700' };
    }
  };

  const riskStyle = getRiskColor(terrain?.erosionRisk);
  const hasData = terrain && terrain.elevationMeanM !== null && terrain.elevationMeanM !== undefined;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f291e] flex items-center gap-2.5">
            <Mountain className="w-7 h-7 text-agri-700 stroke-[2.2]" />
            <span>{language === 'hi' ? 'जलग्रहण एवं मृदा क्षरण सुरक्षा' : 'Watershed Defense & Soil Erosion'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {language === 'hi'
              ? 'Copernicus DEM स्थलाकृति, ढलान विश्लेषण एवं RUSLE-lite मृदा अपरदन जोखिम गणना'
              : 'Live Copernicus DEM topography, terrain slope profile & RUSLE-lite soil loss risk model'}
          </p>
        </div>

        {/* Coordinate Inspector Form for Govt/Org Officials */}
        <form
          onSubmit={handleAnalyzeCustomPoint}
          className="bg-white border border-gray-200 rounded-2xl p-3 flex flex-wrap items-center gap-2 text-xs shadow-2xs"
        >
          <MapPin className="w-4 h-4 text-agri-700 shrink-0" />
          <input
            type="number"
            step="0.0001"
            value={customLat}
            onChange={(e) => setCustomLat(e.target.value)}
            placeholder="Lat"
            className="w-24 border border-gray-200 rounded-lg px-2 py-1"
          />
          <input
            type="number"
            step="0.0001"
            value={customLng}
            onChange={(e) => setCustomLng(e.target.value)}
            placeholder="Lng"
            className="w-24 border border-gray-200 rounded-lg px-2 py-1"
          />
          <select
            value={soilType}
            onChange={(e) => setSoilType(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1"
          >
            <option value="loam">Loam</option>
            <option value="clay">Clay / Black</option>
            <option value="sandy">Sandy Loam</option>
            <option value="silt">Alluvial Silt</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-agri-800 text-white font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Analyze DEM</span>
          </button>
        </form>
      </div>

      {!hasData && !loading ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3 text-xs text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>{terrain?.status === 'coordinates_required' ? 'Coordinates Required:' : 'Provider Status:'}</strong>{' '}
            {terrain?.providerNote || 'Enter valid coordinates above to compute Copernicus DEM elevation and RUSLE soil loss.'}
          </div>
        </div>
      ) : (
        <>
          {/* Downstream Lake Connection Banner */}
          <div className="bg-gradient-to-r from-sky-50 via-teal-50 to-emerald-50 border border-sky-100 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-sky-800 uppercase block mb-1">
                {language === 'hi' ? 'डाउनस्ट्रीम झील संबंध' : 'Downstream Hydrological Destination'}
              </span>
              <p className="text-sm sm:text-base font-bold text-gray-900">
                {language === 'hi'
                  ? `इस जलग्रहण क्षेत्र का बहाव ${terrain?.downstreamLakeSlug || 'झील'} (दूरी ~${terrain?.downstreamLakeDistKm ?? '—'} किमी) की ओर जाता है।`
                  : `Surface runoff from this catchment drains toward ${terrain?.downstreamLakeSlug?.toUpperCase() || 'REGIONAL LAKE'} (~${terrain?.downstreamLakeDistKm ?? '—'} km away).`}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Source: {terrain?.source || 'Copernicus DEM GLO-90 via Open-Meteo Elevation API'}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-sky-200 text-xs font-semibold text-sky-900 shrink-0">
              Aspect: {terrain?.dominantAspect || 'Measured'}
            </div>
          </div>

          {/* Terrain & RUSLE Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs">
              <span className="text-xs text-gray-500 font-medium block mb-1">
                {language === 'hi' ? 'औसत ऊंचाई (DEM)' : 'Mean Elevation'}
              </span>
              <span className="text-2xl font-extrabold text-gray-900">
                {terrain?.elevationMeanM ?? '—'}
                <span className="text-xs font-normal text-gray-500 ml-1">m MSL</span>
              </span>
              <p className="text-[11px] text-gray-400 mt-1">Copernicus DEM GLO-90</p>
            </div>

            <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs">
              <span className="text-xs text-gray-500 font-medium block mb-1">
                {language === 'hi' ? 'ढलान (Slope)' : 'Slope Steepness'}
              </span>
              <span className="text-2xl font-extrabold text-gray-900">
                {terrain?.slopeMeanDeg ?? '—'}°
                <span className="text-xs font-normal text-gray-500 ml-1">avg</span>
              </span>
              <p className="text-[11px] text-gray-400 mt-1 capitalize">
                {terrain?.slopeClass || 'Measured'} Slope (Max {terrain?.slopeMaxDeg ?? '—'}°)
              </p>
            </div>

            <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs">
              <span className="text-xs text-gray-500 font-medium block mb-1">
                {language === 'hi' ? 'अनुमानित मृदा हानि' : 'Estimated Soil Loss (A)'}
              </span>
              <span className="text-2xl font-extrabold text-gray-900">
                {terrain?.rusleA ?? '—'}
                <span className="text-xs font-normal text-gray-500 ml-1">t/ha/yr</span>
              </span>
              <p className="text-[11px] text-gray-400 mt-1">RUSLE-lite standard calculation</p>
            </div>

            <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs">
              <span className="text-xs text-gray-500 font-medium block mb-1">
                {language === 'hi' ? 'क्षरण जोखिम श्रेणी' : 'Erosion Risk Level'}
              </span>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold border capitalize mt-1 ${riskStyle.badge}`}
              >
                {terrain?.erosionRisk || 'Measured'} Risk
              </span>
              <p className="text-[11px] text-gray-400 mt-1.5">Based on DEM slope and rainfall</p>
            </div>
          </div>

          {/* RUSLE Formula Breakdown */}
          <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">
              {language === 'hi' ? 'RUSLE-lite वैज्ञानिक सूत्र एवं कारक' : 'RUSLE Equation Factor Breakdown'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              A = R (Rainfall Erosivity) × K (Soil Erodibility) × LS (Slope Length/Steepness) × C (Crop Cover) × P (Conservation Practice)
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-center">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <span className="text-xs text-gray-500 font-semibold block">R Factor</span>
                <span className="text-base font-bold text-gray-800">{terrain?.rusleR ?? '—'}</span>
                <span className="text-[10px] text-gray-400 block">Rainfall kinetic energy</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <span className="text-xs text-gray-500 font-semibold block">K Factor</span>
                <span className="text-base font-bold text-gray-800">{terrain?.rusleK ?? '—'}</span>
                <span className="text-[10px] text-gray-400 block">Soil texture vulnerability</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <span className="text-xs text-gray-500 font-semibold block">LS Factor</span>
                <span className="text-base font-bold text-gray-800">{terrain?.rusleLS ?? '—'}</span>
                <span className="text-[10px] text-gray-400 block">Slope length &amp; grade</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <span className="text-xs text-gray-500 font-semibold block">C Factor</span>
                <span className="text-base font-bold text-gray-800">{terrain?.rusleC ?? '—'}</span>
                <span className="text-[10px] text-gray-400 block">Vegetation canopy cover</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <span className="text-xs text-gray-500 font-semibold block">P Factor</span>
                <span className="text-base font-bold text-gray-800">{terrain?.rusleP ?? '—'}</span>
                <span className="text-[10px] text-gray-400 block">Conservation support</span>
              </div>
            </div>
          </div>

          {/* Conservation Recommendations */}
          <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-5 h-5 text-agri-700" />
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                {language === 'hi' ? 'खेत-विशिष्ट जल व मृदा संरक्षण उपाय' : 'Catchment Soil & Water Conservation Actions'}
              </h3>
            </div>

            <div className="space-y-2.5">
              {((language === 'hi' ? terrain?.recommendationsHi : terrain?.recommendations) || []).map(
                (rec: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[#f7f9f6] border border-[#e2e8df]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-agri-700 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-gray-800 leading-snug">{rec}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
