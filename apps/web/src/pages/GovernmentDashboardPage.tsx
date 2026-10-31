import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Building2,
  Users,
  Tractor,
  Waves,
  Mountain,
  Shield,
  Flame,
  FileWarning,
  CheckCircle2,
  Bell,
  Activity,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  UserX,
  ArrowRight,
  MapPin,
  Sprout,
  BookOpen,
  Store,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const GovernmentDashboardPage: React.FC = () => {
  const { user, language } = useApp();
  const location = useLocation();
  const isHi = language === 'hi';
  const isRegionalRoute = location.pathname.includes('/regional');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'regional' | 'verifications'>(
    isRegionalRoute ? 'regional' : 'overview'
  );
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyNotes, setVerifyNotes] = useState<{ [id: string]: string }>({});
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (location.pathname.includes('/regional')) {
      setActiveTab('regional');
    } else if (activeTab === 'regional' && location.pathname === '/app/gov') {
      setActiveTab('overview');
    }
  }, [location.pathname]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE}/gov/dashboard`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          Accept: 'application/json',
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || json.message || 'Failed to load Government Admin Dashboard.');
      } else {
        setData(json);
      }
    } catch {
      setError('Unable to connect to the Government Admin API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleVerifyUser = async (
    targetId: string,
    decision: 'verified' | 'rejected'
  ) => {
    setVerifyingId(targetId);
    setActionMessage(null);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE}/gov/users/${targetId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          accountStatus: decision,
          notes:
            verifyNotes[targetId] ||
            (decision === 'verified'
              ? 'Approved by Government Portal Administrator'
              : 'Rejected during credential verification'),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setActionMessage(
          `Account ${json.user?.email || targetId} marked as ${decision.toUpperCase()}.`
        );
        await fetchDashboard();
      } else {
        setError(json.error || 'Failed to update account verification status.');
      }
    } catch {
      setError('Network error while updating verification status.');
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-agri-700"></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 space-y-3">
        <div className="flex items-center gap-2 font-bold">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span>Government Portal Error</span>
        </div>
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const m = data?.metrics || {};
  const prov = data?.providerConfiguration || {};
  const pendingAccounts: any[] = data?.pendingGovtAccounts || [];
  const regional = data?.regionalOverview || {};
  const lakesSummary: any[] = data?.lakesSummary || [];

  return (
    <div className="space-y-6 pb-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0b2e1c] via-[#13472c] to-[#1a5c38] rounded-3xl p-6 sm:p-7 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 text-xs font-bold">
              <Building2 className="w-3.5 h-3.5" />
              <span>
                {isHi
                  ? 'सरकारी एवं संगठन प्रशासनिक पोर्टल'
                  : 'GOVERNMENT / ORGANIZATION ADMIN PORTAL'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isHi
                ? 'दक्षिणी राजस्थान रिज-टू-लेक कमांड डैशबोर्ड'
                : 'Southern Rajasthan Ridge-to-Lake Command Center'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl">
              {user?.organizationName
                ? `${user.organizationName} • ${user.designation || 'Verified Official'} (${user.district || 'Rajasthan'})`
                : 'Real-time regional agricultural, watershed, lake, and community moderation intelligence.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isHi ? 'प्रशासनिक सारांश' : 'Command Overview'}
            </button>
            <button
              onClick={() => setActiveTab('regional')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'regional'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isHi ? 'किसान व क्षेत्रीय विवरण' : 'Farmer & Regional Overview'}
            </button>
            {authService.canVerifyAccounts(user) && (
              <Link
                to="/app/admin/verifications"
                className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-white/10 text-white hover:bg-white/20 cursor-pointer"
              >
                <span>{isHi ? 'खाता सत्यापन' : 'Account Verification'}</span>
                {(m.pendingGovtVerificationsCount ?? pendingAccounts.length) > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black">
                    {m.pendingGovtVerificationsCount ?? pendingAccounts.length}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={fetchDashboard}
              title="Refresh Live Metrics"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-emerald-700 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =====================================================================
          TAB 1: COMMAND OVERVIEW (ALL 11 REQUIRED REAL METRICS)
         ===================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Primary Metric Grid (Real MongoDB & Provider Statuses Only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Registered Farmers */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">
                  {isHi ? 'पंजीकृत किसान' : 'Registered Farmers'}
                </span>
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-gray-900">
                {m.totalRegisteredFarmers ?? 0}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Live count from MongoDB `users` collection
              </p>
            </div>

            {/* 2. Total Registered Farms */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">
                  {isHi ? 'पंजीकृत खेत' : 'Registered Farms'}
                </span>
                <div className="p-2 bg-green-50 text-green-700 rounded-xl">
                  <Tractor className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-gray-900">
                {m.totalRegisteredFarms ?? 0}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                {m.totalCultivatedAcres ?? 0} total acres • {m.totalSoilTestsRecorded ?? 0} soil tests
              </p>
            </div>

            {/* 3. Total Monitored Lakes & Regional Lake Health */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">
                  {isHi ? 'निगरानी झीलें व सेहत' : 'Monitored Lakes & Health'}
                </span>
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <Waves className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900">
                  {m.totalMonitoredLakes ?? 0}
                </span>
                <span className="text-xs font-semibold text-gray-500">lakes</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                {m.regionalLakeHealthScore !== null && m.regionalLakeHealthScore !== undefined ? (
                  <span className="text-emerald-700 font-semibold">
                    Avg Health Score: {m.regionalLakeHealthScore}/100 ({m.observedLakesCount} observed)
                  </span>
                ) : (
                  <span className="text-amber-700 font-medium">
                    Health Score: Configuration required (Sentinel-2 GEE)
                  </span>
                )}
              </p>
            </div>

            {/* 4. Watershed Erosion Indicators */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">
                  {isHi ? 'जलग्रहण मृदा क्षरण' : 'Watershed Erosion (RUSLE)'}
                </span>
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                  <Mountain className="w-4 h-4" />
                </div>
              </div>
              {m.watershedAnalyzedParcels > 0 ? (
                <>
                  <div className="text-2xl font-black text-gray-900">
                    {m.watershedAvgSoilLossThaYr} <span className="text-xs font-normal">t/ha/yr</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {m.watershedAnalyzedParcels} parcels analyzed • {m.watershedHighErosionParcels} high-risk
                  </p>
                </>
              ) : (
                <>
                  <div className="text-base font-bold text-gray-700 mt-1">
                    No parcels analyzed yet
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Open Watershed Defense to run Copernicus DEM RUSLE analysis
                  </p>
                </>
              )}
            </div>

            {/* 5. Aravalli Forest / Land-Cover Monitoring */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">
                  {isHi ? 'अरावली वन निगरानी' : 'Aravalli Land-Cover'}
                </span>
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Shield className="w-4 h-4" />
                </div>
              </div>
              {m.aravalliIntegrityScore !== null && m.aravalliIntegrityScore !== undefined ? (
                <>
                  <div className="text-3xl font-black text-gray-900">
                    {m.aravalliIntegrityScore}
                    <span className="text-xs font-normal text-gray-400">/100</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Disturbed area: {m.aravalliDisturbedAreaHa} ha
                  </p>
                </>
              ) : (
                <>
                  <div className="text-sm font-bold text-amber-700 mt-1">
                    Configuration required
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Requires Google Earth Engine Dynamic World credentials
                  </p>
                </>
              )}
            </div>

            {/* 6. Active Fire Alerts (NASA FIRMS) */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">
                  {isHi ? 'सक्रिय अग्नि अलर्ट' : 'Active Fire Alerts (FIRMS)'}
                </span>
                <div className="p-2 bg-orange-50 text-orange-700 rounded-xl">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              {m.activeFireAlerts7d !== null && m.activeFireAlerts7d !== undefined ? (
                <>
                  <div className="text-3xl font-black text-gray-900">
                    {m.activeFireAlerts7d}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Last 7 days ({m.activeFireAlerts30d ?? 0} in last 30 days)
                  </p>
                </>
              ) : (
                <>
                  <div className="text-sm font-bold text-amber-700 mt-1">
                    Configuration required
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Set FIRMS_MAP_KEY for live NASA VIIRS thermal feed
                  </p>
                </>
              )}
            </div>

            {/* 7. Pending & Verified Community Reports */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">
                  {isHi ? 'सामुदायिक रिपोर्ट मॉडरेशन' : 'Community Reports'}
                </span>
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                  <FileWarning className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <div>
                  <span className="text-2xl font-black text-amber-600">
                    {m.pendingCommunityReports ?? 0}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">pending</span>
                </div>
                <div>
                  <span className="text-2xl font-black text-emerald-700">
                    {m.verifiedCommunityReports ?? 0}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">verified</span>
                </div>
              </div>
              <Link
                to="/app/reports"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-agri-700 hover:underline mt-1.5"
              >
                <span>Open Moderation Console</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* 8. Regional Environmental Alerts & Landscape Health */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">
                  {isHi ? 'क्षेत्रीय अलर्ट व लैंडस्केप' : 'Alerts & Landscape Index'}
                </span>
                <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-gray-900">
                    {m.unreadEnvironmentalAlertsCount ?? 0}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">unread alerts</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-600">
                    Index:{' '}
                    {m.regionalLandscapeHealthScore !== null &&
                    m.regionalLandscapeHealthScore !== undefined
                      ? `${m.regionalLandscapeHealthScore}/100`
                      : 'No data yet'}
                  </span>
                </div>
              </div>
              <Link
                to="/app/alerts"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-agri-700 hover:underline mt-1.5"
              >
                <span>Manage Regional Alerts</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Quick Module Command Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/app/lakes"
              className="bg-white hover:bg-[#f8fbf9] rounded-2xl p-5 border border-gray-100 shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-900">Lakes Monitor (12 Lakes)</span>
                  <Waves className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs text-gray-600">
                  Inspect Pichola, Fateh Sagar, Jaisamand, Rajsamand &amp; 8 other Southern Rajasthan reservoirs.
                </p>
              </div>
              <span className="text-xs font-bold text-agri-700 mt-4 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Open Lakes Monitor <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              to="/app/reports"
              className="bg-white hover:bg-[#f8fbf9] rounded-2xl p-5 border border-gray-100 shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-900">Community Reports Moderation</span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-xs text-gray-600">
                  Review citizen &amp; farmer ecological reports, inspect GPS coordinates, and verify or reject submissions.
                </p>
              </div>
              <span className="text-xs font-bold text-agri-700 mt-4 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Review {m.pendingCommunityReports ?? 0} Pending Reports <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              to="/app/schemes"
              className="bg-white hover:bg-[#f8fbf9] rounded-2xl p-5 border border-gray-100 shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-900">Government Schemes &amp; Subsidies</span>
                  <BookOpen className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-xs text-gray-600">
                  Publish and update central and Rajasthan state agricultural subsidy schemes visible to farmers.
                </p>
              </div>
              <span className="text-xs font-bold text-agri-700 mt-4 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Manage Schemes <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>

          {/* Provider Configuration Transparency Panel */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
            <h2 className="text-sm font-bold text-gray-900 mb-3">
              Upstream Telemetry &amp; Data Provider Status
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/80">
                <div className="font-bold text-gray-800">Copernicus DEM (Open-Meteo)</div>
                <div className="text-emerald-700 font-semibold mt-0.5">● Active (Live SRTM/GLO-90)</div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/80">
                <div className="font-bold text-gray-800">Google Earth Engine (Sentinel-2)</div>
                <div
                  className={`font-semibold mt-0.5 ${
                    prov.earthEngine === 'configured' ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  ● {prov.earthEngine === 'configured' ? 'Configured' : 'Configuration required'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/80">
                <div className="font-bold text-gray-800">NASA FIRMS (VIIRS Thermal)</div>
                <div
                  className={`font-semibold mt-0.5 ${
                    prov.nasaFirms === 'configured' ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  ● {prov.nasaFirms === 'configured' ? 'Configured' : 'Configuration required (FIRMS_MAP_KEY)'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/80">
                <div className="font-bold text-gray-800">Agmarknet (data.gov.in)</div>
                <div
                  className={`font-semibold mt-0.5 ${
                    prov.agmarknetDataGovIn === 'configured' ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  ●{' '}
                  {prov.agmarknetDataGovIn === 'configured'
                    ? 'Configured'
                    : 'Configuration required (DATA_GOV_IN_API_KEY)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: FARMER & REGIONAL OVERVIEW
         ===================================================================== */}
      {activeTab === 'regional' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Crop Distribution */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Sprout className="w-5 h-5 text-agri-700" />
                <h2 className="text-base font-bold text-gray-900">
                  Regional Crop Distribution (Registered Farms)
                </h2>
              </div>
              {regional.cropDistribution?.length > 0 ? (
                <div className="space-y-2.5">
                  {regional.cropDistribution.map((item: any) => (
                    <div
                      key={item.crop}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#f8faf8] border border-gray-100 text-xs"
                    >
                      <span className="font-bold text-gray-800">{item.crop}</span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                        {item.count} {item.count === 1 ? 'farm' : 'farms'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 py-6 text-center">
                  No registered farms with crop data in the database yet.
                </p>
              )}
            </div>

            {/* Location Distribution */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-agri-700" />
                <h2 className="text-base font-bold text-gray-900">
                  Farms &amp; Cultivated Area by Location
                </h2>
              </div>
              {regional.locationDistribution?.length > 0 ? (
                <div className="space-y-2.5">
                  {regional.locationDistribution.map((loc: any) => (
                    <div
                      key={loc.location}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#f8faf8] border border-gray-100 text-xs"
                    >
                      <span className="font-bold text-gray-800">{loc.location}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 font-medium">{loc.acres} acres</span>
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold">
                          {loc.farms} {loc.farms === 1 ? 'farm' : 'farms'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 py-6 text-center">
                  No registered farm locations recorded yet.
                </p>
              )}
            </div>
          </div>

          {/* Registered Farm Parcels Table */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 mb-4">
              Registered Regional Farm Parcels ({regional.recentFarms?.length ?? 0})
            </h2>
            {regional.recentFarms?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 uppercase">
                      <th className="py-2.5 px-3">Farm Name</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3">Area (Acres)</th>
                      <th className="py-2.5 px-3">Primary Crop</th>
                      <th className="py-2.5 px-3">Soil / Irrigation</th>
                      <th className="py-2.5 px-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {regional.recentFarms.map((f: any) => (
                      <tr key={f.id} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-bold text-gray-900">{f.name}</td>
                        <td className="py-2.5 px-3 text-gray-600">
                          {f.locationName || f.state || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-gray-800">
                          {f.areaAcres ?? 0}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-700 font-semibold">
                          {f.primaryCrop || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">
                          {[f.soilType, f.irrigationMethod].filter(Boolean).join(' • ') || '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <Link
                            to={`/app/watershed?farmId=${f.id}`}
                            className="text-agri-700 font-bold hover:underline"
                          >
                            Inspect Watershed →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-500 py-6 text-center">
                No farm parcels registered yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: GOVERNMENT / ORGANIZATION ACCOUNT VERIFICATIONS
         ===================================================================== */}
      {activeTab === 'verifications' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Pending Government / Organization Account Verifications
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                New Govt / Org signups start with status <code className="bg-gray-100 px-1 rounded">pending</code> and cannot access protected admin modules until verified here.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              {pendingAccounts.length} Pending
            </span>
          </div>

          {pendingAccounts.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <div className="font-bold text-gray-700">
                No pending Government / Organization account requests.
              </div>
              <p>All submitted official accounts have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingAccounts.map((acc: any) => (
                <div
                  key={acc.id}
                  className="p-4 rounded-2xl bg-[#f8faf8] border border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-gray-900">{acc.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                        <Clock className="w-3 h-3 inline mr-0.5" />
                        {acc.accountStatus}
                      </span>
                    </div>
                    <div className="text-gray-600">
                      <strong>Email:</strong> {acc.email} • <strong>Phone:</strong> {acc.phone || '—'}
                    </div>
                    <div className="text-gray-700">
                      <strong>Organization:</strong> {acc.organizationName || '—'} ({acc.organizationType || '—'})
                    </div>
                    <div className="text-gray-700">
                      <strong>Designation:</strong> {acc.designation || '—'} • <strong>Jurisdiction:</strong>{' '}
                      {[acc.district, acc.state].filter(Boolean).join(', ') || '—'}
                    </div>
                    {acc.officialIdInfo && (
                      <div className="text-gray-600">
                        <strong>Official ID / Ref:</strong> {acc.officialIdInfo}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    <input
                      type="text"
                      placeholder="Verification note (optional)"
                      value={verifyNotes[acc.id] || ''}
                      onChange={(e) =>
                        setVerifyNotes({ ...verifyNotes, [acc.id]: e.target.value })
                      }
                      className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-hidden focus:border-agri-700"
                    />
                    <button
                      type="button"
                      disabled={verifyingId === acc.id}
                      onClick={() => handleVerifyUser(acc.id, 'verified')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Approve &amp; Verify</span>
                    </button>
                    <button
                      type="button"
                      disabled={verifyingId === acc.id}
                      onClick={() => handleVerifyUser(acc.id, 'rejected')}
                      className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

