import React, { useState, useEffect } from 'react';
import {
  Shield,
  Flame,
  AlertTriangle,
  Compass,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';
import { GeoMap, GeoMapMarker } from '../components/common/GeoMap';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const AravalliPage: React.FC = () => {
  const { language } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authService.getToken();
    fetch(`${API_BASE}/aravalli`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json);
      })
      .catch((err) => console.warn('[AravalliPage] Error fetching Aravalli data:', err))
      .finally(() => setLoading(false));
  }, []);

  const fireMarkers: GeoMapMarker[] =
    data?.recentFires?.map((f: any, idx: number) => ({
      id: `fire-${idx}`,
      lat: f.location?.coordinates?.[1] || 24.6,
      lng: f.location?.coordinates?.[0] || 73.5,
      title: `Thermal Anomaly (${f.satellite || 'VIIRS'})`,
      category: 'fire',
      badge: `${f.confidence || 'nominal'} confidence`,
      description: `Detected: ${f.acqDate || 'Recent'} | FRP: ${f.frp || 'N/A'} MW`,
    })) || [];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f291e] flex items-center gap-2.5">
          <Shield className="w-7 h-7 text-emerald-700 stroke-[2.2]" />
          <span>{language === 'hi' ? 'अरावली संरक्षण एवं अग्नि निगरानी' : 'Aravalli Guard & Ridge Conservation'}</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          {language === 'hi'
            ? 'डायनेमिक वर्ल्ड वन आवरण परिवर्तन, भूमि क्षरण एवं नासा फर्म्स (FIRMS) अग्नि निगरानी'
            : 'Google Dynamic World canopy tracking, disturbance monitoring & NASA FIRMS thermal anomaly detection'}
        </p>
      </div>

      {/* Mandatory Field Verification Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong>{language === 'hi' ? 'महत्वपूर्ण विधिक एवं वैज्ञानिक सूचना: ' : 'Field Verification Notice: '}</strong>
          {language === 'hi'
            ? 'उपग्रह से पहचाने गए किसी भी भू-परिवर्तन को कानूनी रूप से "संभावित परिवर्तन — जमीनी सत्यापन आवश्यक" के रूप में चिन्हित किया जाता है। स्वचालित रूप से अवैध खनन घोषित नहीं किया जाता।'
            : 'All satellite-detected land-cover changes are strictly classified as "Possible disturbance — field verification required." Spectral alerts are never automatically designated as illegal mining.'}
        </div>
      </div>

      {/* Provider Configuration Notices when keys are missing */}
      {!loading && (data?.landCoverStatus === 'configuration_required' || data?.firmsStatus === 'configuration_required') && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2 text-xs text-gray-700">
          <div className="flex items-center gap-2 font-bold text-gray-900">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Upstream Satellite Provider Configuration Status</span>
          </div>
          {data?.landCoverStatus === 'configuration_required' && (
            <p className="text-gray-600">
              • <strong>Dynamic World / Hansen Forest Change:</strong> {data?.providerNotes?.landCover}
            </p>
          )}
          {data?.firmsStatus === 'configuration_required' && (
            <p className="text-gray-600">
              • <strong>NASA FIRMS Thermal Detections:</strong> {data?.providerNotes?.firms}
            </p>
          )}
        </div>
      )}

      {/* Metrics Grid (Strictly Real Data or Honest Status) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs">
          <span className="text-xs text-gray-500 font-medium block mb-1">
            {language === 'hi' ? 'अरावली स्वास्थ्य स्कोर' : 'Aravalli Health Index'}
          </span>
          {data?.score !== null && data?.score !== undefined ? (
            <span className="text-2xl font-extrabold text-emerald-800">
              {data.score}
              <span className="text-xs font-normal text-emerald-600 ml-1">/100</span>
            </span>
          ) : (
            <span className="text-xs font-bold text-amber-700 block mt-1">
              Configuration required
            </span>
          )}
          <p className="text-[11px] text-gray-400 mt-1">Regional canopy integrity</p>
        </div>

        <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs">
          <span className="text-xs text-gray-500 font-medium block mb-1">
            {language === 'hi' ? 'संभावित प्रभावित क्षेत्र' : 'Disturbance Identified'}
          </span>
          {data?.disturbedAreaHa !== null && data?.disturbedAreaHa !== undefined ? (
            <span className="text-2xl font-extrabold text-gray-900">
              {data.disturbedAreaHa}
              <span className="text-xs font-normal text-gray-500 ml-1">ha</span>
            </span>
          ) : (
            <span className="text-xs font-bold text-amber-700 block mt-1">
              Configuration required
            </span>
          )}
          <p className="text-[11px] text-gray-400 mt-1">Requires ground verification</p>
        </div>

        <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs">
          <span className="text-xs text-gray-500 font-medium block mb-1">
            {language === 'hi' ? 'थर्मल अलर्ट (7 दिन)' : 'Thermal Alerts (7 Days)'}
          </span>
          {data?.fireAlerts7d !== null && data?.fireAlerts7d !== undefined ? (
            <span className="text-2xl font-extrabold text-amber-600">
              {data.fireAlerts7d}
            </span>
          ) : (
            <span className="text-xs font-bold text-amber-700 block mt-1">
              Set FIRMS_MAP_KEY
            </span>
          )}
          <p className="text-[11px] text-gray-400 mt-1">NASA FIRMS VIIRS detections</p>
        </div>

        <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs">
          <span className="text-xs text-gray-500 font-medium block mb-1">
            {language === 'hi' ? 'थर्मल अलर्ट (30 दिन)' : 'Thermal Alerts (30 Days)'}
          </span>
          {data?.fireAlerts30d !== null && data?.fireAlerts30d !== undefined ? (
            <span className="text-2xl font-extrabold text-gray-900">
              {data.fireAlerts30d}
            </span>
          ) : (
            <span className="text-xs font-bold text-amber-700 block mt-1">
              Set FIRMS_MAP_KEY
            </span>
          )}
          <p className="text-[11px] text-gray-400 mt-1">Agricultural burn / forest fire</p>
        </div>
      </div>

      {/* NASA FIRMS Thermal Anomaly Map */}
      <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">
              {language === 'hi' ? 'नासा फर्म्स थर्मल गतिविधि मानचित्र (Aravalli Range)' : 'NASA FIRMS Fire & Thermal Anomaly Map'}
            </h3>
          </div>
          <span className="text-xs text-gray-400 font-medium">VIIRS 375m Resolution</span>
        </div>
        <GeoMap markers={fireMarkers} center={[24.7, 73.65]} zoom={9} height="360px" />
      </div>

      {/* District-wise Comparison Table */}
      <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <Compass className="w-5 h-5 text-emerald-700" />
          <h3 className="font-bold text-gray-900 text-sm sm:text-base">
            {language === 'hi' ? 'जिलावार अरावली वन स्थिति तुलना' : 'District-Wise Ridge Conservation Status'}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase text-[11px]">
                <th className="pb-3 font-semibold">{language === 'hi' ? 'जिला' : 'District'}</th>
                <th className="pb-3 font-semibold text-center">{language === 'hi' ? 'वन स्वास्थ्य स्कोर' : 'Vegetation Score'}</th>
                <th className="pb-3 font-semibold text-center">{language === 'hi' ? 'संभावित परिवर्तन' : 'Disturbance Area'}</th>
                <th className="pb-3 font-semibold text-center">{language === 'hi' ? 'अग्नि अलर्ट (30d)' : 'Fires (30d)'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.districtStats || []).map((d: any) => (
                <tr key={d.district} className="hover:bg-gray-50/60">
                  <td className="py-3 font-bold text-gray-900">
                    {language === 'hi' ? d.nameHi : d.nameEn}
                  </td>
                  <td className="py-3 text-center">
                    {d.vegetationHealthScore !== null && d.vegetationHealthScore !== undefined ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {d.vegetationHealthScore}/100
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">No data yet</span>
                    )}
                  </td>
                  <td className="py-3 text-center text-gray-600 font-medium">
                    {d.disturbedHa !== null && d.disturbedHa !== undefined ? `${d.disturbedHa} ha` : 'No data yet'}
                  </td>
                  <td className="py-3 text-center text-gray-600 font-medium">
                    {d.fires30d !== null && d.fires30d !== undefined ? d.fires30d : 'Config required'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
