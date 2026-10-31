import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Send,
  EyeOff,
  CheckCircle,
  Clock,
  XCircle,
  Check,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';
import { GeoMap, GeoMapMarker } from '../components/common/GeoMap';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const CommunityReportsPage: React.FC = () => {
  const { language, user } = useApp();
  const isHi = language === 'hi';
  const isGovt = authService.isGovtOrg(user);

  const [reports, setReports] = useState<any[]>([]);
  const [myReports, setMyReports] = useState<any[]>([]);
  const [moderationReports, setModerationReports] = useState<any[]>([]);
  const [modStatusFilter, setModStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [modNotes, setModNotes] = useState<{ [id: string]: string }>({});
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  const [category, setCategory] = useState('lake_encroachment');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState('24.585');
  const [lng, setLng] = useState('73.712');
  const [district, setDistrict] = useState('udaipur');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPublicAndUserReports = useCallback(async () => {
    try {
      const token = authService.getToken();
      const pubRes = await fetch(`${API_BASE}/reports`);
      const pubData = await pubRes.json();
      if (pubData.success && Array.isArray(pubData.reports)) {
        setReports(pubData.reports);
      }

      if (token) {
        const myRes = await fetch(`${API_BASE}/reports/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const myData = await myRes.json();
        if (myData.success && Array.isArray(myData.reports)) {
          setMyReports(myData.reports);
        }

        if (isGovt) {
          const queryParam = modStatusFilter === 'all' ? '' : `?status=${modStatusFilter}`;
          const modRes = await fetch(`${API_BASE}/reports/moderation${queryParam}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const modData = await modRes.json();
          if (modData.success && Array.isArray(modData.reports)) {
            setModerationReports(modData.reports);
          }
        }
      }
    } catch (err) {
      console.warn('[CommunityReportsPage] Error:', err);
    }
  }, [isGovt, modStatusFilter]);

  useEffect(() => {
    fetchPublicAndUserReports();
  }, [fetchPublicAndUserReports]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toFixed(5));
          setLng(pos.coords.longitude.toFixed(5));
        },
        () => alert('Could not retrieve GPS location. Please enter coordinates manually.')
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('Please enter a description for the report.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = authService.getToken();
      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', description);
      formData.append('lat', lat);
      formData.append('lng', lng);
      formData.append('district', district);
      formData.append('isAnonymous', String(isAnonymous));
      if (selectedFile) {
        formData.append('photo', selectedFile);
      }

      const res = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMessage(
          isHi
            ? 'आपकी रिपोर्ट सफलतापूर्वक दर्ज हो गई है। सत्यापन उपरांत यह सार्वजनिक मानचित्र पर दिखाई देगी।'
            : 'Report submitted successfully (Status: Pending Verification). Once verified by a Government / Organization moderator, it will appear on the public map.'
        );
        setDescription('');
        setSelectedFile(null);
        setPreviewUrl(null);
        await fetchPublicAndUserReports();
      } else {
        setErrorMessage(json.error || 'Failed to submit report');
      }
    } catch {
      setErrorMessage('Network error while submitting report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModerate = async (reportId: string, decision: 'verified' | 'rejected') => {
    setModeratingId(reportId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE}/reports/${reportId}/moderate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: decision,
          rejectionReason: modNotes[reportId] || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMessage(`Report ${decision === 'verified' ? 'approved & published' : 'rejected'}.`);
        await fetchPublicAndUserReports();
      } else {
        setErrorMessage(json.error || 'Failed to moderate report.');
      }
    } catch {
      setErrorMessage('Network error while moderating report.');
    } finally {
      setModeratingId(null);
    }
  };

  const reportMarkers: GeoMapMarker[] = (isGovt ? moderationReports : reports).map((r, idx) => ({
    id: r.id || r._id || `rep-${idx}`,
    lat: isGovt
      ? r.preciseLocation?.lat || r.publicLocation?.lat || 24.585
      : r.location?.lat || 24.585,
    lng: isGovt
      ? r.preciseLocation?.lng || r.publicLocation?.lng || 73.712
      : r.location?.lng || 73.712,
    title: r.category?.replace(/_/g, ' ')?.toUpperCase(),
    category: 'report',
    badge: r.status ? r.status.toUpperCase() : 'Verified',
    description: r.description?.slice(0, 90) + '...',
  }));

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f291e] flex items-center gap-2.5">
            <Users className="w-7 h-7 text-agri-700 stroke-[2.2]" />
            <span>
              {isGovt
                ? isHi
                  ? 'सामुदायिक रिपोर्ट मॉडरेशन कंसोल'
                  : 'Community Reports Moderation Console'
                : isHi
                  ? 'सामुदायिक पर्यावरण रिपोर्टिंग'
                  : 'Community Reporting System'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {isGovt
              ? 'Government / Organization Authority: Review pending citizen submissions, inspect exact GPS coordinates, and verify or reject reports.'
              : isHi
                ? 'झील अतिक्रमण, संभावित खनन एवं जल प्रदूषण की गोपनीय व सुरक्षित नागरिक रिपोर्टिंग'
                : 'Citizen monitoring for lake encroachment, mining disturbance, and environmental hazards'}
          </p>
        </div>

        {isGovt && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900 text-white text-xs font-bold shrink-0">
            <ShieldCheck className="w-4 h-4" />
            <span>Authorized Moderator Access</span>
          </span>
        )}
      </div>

      {/* =====================================================================
          GOVERNMENT / ORGANIZATION MODERATION PANEL (STRICTLY FOR GOVT_ORG)
         ===================================================================== */}
      {isGovt && (
        <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-black text-gray-900">
                Citizen &amp; Farmer Report Moderation Queue
              </h2>
              <p className="text-xs text-gray-500">
                Precise GPS coordinates are visible to authorized Government / Organization moderators for field inspection. Public map coordinates remain rounded to ~500m.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold">
              {(['pending', 'verified', 'rejected', 'all'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setModStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                    modStatusFilter === tab
                      ? 'bg-agri-800 text-white shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {moderationReports.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-500">
              No community reports found with status <strong>{modStatusFilter}</strong>.
            </div>
          ) : (
            <div className="space-y-3">
              {moderationReports.map((rep) => {
                const repId = rep.id || rep._id;
                return (
                  <div
                    key={repId}
                    className="p-4 rounded-2xl border border-gray-200 bg-[#f8faf8] flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 text-xs flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-gray-900 uppercase tracking-wide">
                          {rep.category?.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            rep.status === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rep.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rep.status}
                        </span>
                        <span className="text-gray-500 capitalize">
                          • {rep.district} District
                        </span>
                        <span className="text-gray-400">
                          • {rep.submittedAt ? new Date(rep.submittedAt).toLocaleString() : ''}
                        </span>
                      </div>

                      <p className="text-gray-800 font-medium leading-relaxed">{rep.description}</p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-600 pt-1">
                        <span>
                          <strong>Precise Field Coordinates:</strong>{' '}
                          {rep.preciseLocation?.lat?.toFixed(5)}, {rep.preciseLocation?.lng?.toFixed(5)}
                        </span>
                        <span>
                          <strong>Public Rounded (~500m):</strong>{' '}
                          {rep.publicLocation?.lat?.toFixed(3)}, {rep.publicLocation?.lng?.toFixed(3)}
                        </span>
                        <span>
                          <strong>Reporter Identity:</strong>{' '}
                          {rep.isAnonymous ? 'Protected (Anonymous)' : rep.reporterId || 'Registered User'}
                        </span>
                      </div>

                      {rep.moderatedBy && (
                        <div className="text-[11px] text-gray-500">
                          <strong>Moderated By:</strong> {rep.moderatedBy}{' '}
                          {rep.moderatedAt ? `on ${new Date(rep.moderatedAt).toLocaleString()}` : ''}
                          {rep.rejectionReason ? ` • Note: "${rep.rejectionReason}"` : ''}
                        </div>
                      )}

                      {rep.photoUrl && (
                        <div className="pt-2">
                          <img
                            src={rep.photoUrl}
                            alt="Report Evidence"
                            className="h-24 w-36 object-cover rounded-xl border border-gray-200"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                      <input
                        type="text"
                        placeholder="Moderator note / rejection reason..."
                        value={modNotes[repId] || ''}
                        onChange={(e) => setModNotes({ ...modNotes, [repId]: e.target.value })}
                        className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-hidden focus:border-agri-700"
                      />
                      <button
                        type="button"
                        disabled={moderatingId === repId}
                        onClick={() => handleModerate(repId, 'verified')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve / Verify</span>
                      </button>
                      <button
                        type="button"
                        disabled={moderatingId === repId}
                        onClick={() => handleModerate(repId, 'rejected')}
                        className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Report Submission Form (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 sm:p-6 shadow-xs">
            <h3 className="font-bold text-gray-900 text-base mb-1">
              {isHi ? 'नई रिपोर्ट दर्ज करें' : 'Submit Environmental Report'}
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              {isHi
                ? 'आपकी पहचान पूरी तरह गोपनीय रखी जाती है।'
                : 'Your identity is protected. Coordinates are rounded to ~500m on public maps.'}
            </p>

            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* Category */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {isHi ? 'रिपोर्ट श्रेणी' : 'Category'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 font-medium focus:outline-hidden focus:border-agri-600"
                >
                  <option value="lake_encroachment">Lake Encroachment (झील अतिक्रमण)</option>
                  <option value="illegal_mining">Possible Mining Disturbance (संभावित खनन गतिविधि)</option>
                  <option value="water_pollution">Water Pollution / Effluent (जल प्रदूषण)</option>
                  <option value="waste_dumping">Solid Waste Dumping (कचरा डंपिंग)</option>
                  <option value="tree_cutting">Tree Felling / Deforestation (वृक्ष कटाई)</option>
                  <option value="forest_fire">Forest Fire / Stubble Burn (अग्नि घटना)</option>
                  <option value="other">Other Environmental Issue (अन्य)</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {isHi ? 'विवरण' : 'Description'}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder={
                    isHi
                      ? 'स्थान और समस्या का स्पष्ट विवरण दर्ज करें...'
                      : 'Provide clear location details and description of the issue...'
                  }
                  className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-hidden focus:border-agri-600"
                />
              </div>

              {/* District & Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {isHi ? 'जिला' : 'District'}
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3 py-2 text-gray-800"
                  >
                    <option value="udaipur">Udaipur</option>
                    <option value="rajsamand">Rajsamand</option>
                    <option value="salumber">Salumber</option>
                    <option value="dungarpur">Dungarpur</option>
                    <option value="banswara">Banswara</option>
                    <option value="chittorgarh">Chittorgarh</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {isHi ? 'जीपीएस स्थान' : 'GPS Location'}
                  </label>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-agri-700" />
                    <span>{isHi ? 'वर्तमान स्थान लें' : 'Get Location'}</span>
                  </button>
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {isHi ? 'फ़ोटो प्रमाण (वैकल्पिक)' : 'Photo Evidence (Optional)'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-agri-50 file:text-agri-800 hover:file:bg-agri-100 cursor-pointer"
                />
                {previewUrl && (
                  <div className="mt-2 relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Anonymous Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="anon"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded text-agri-800 accent-agri-800"
                />
                <label htmlFor="anon" className="text-xs font-medium text-gray-700 cursor-pointer flex items-center gap-1">
                  <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                  <span>{isHi ? 'गोपनीय रिपोर्ट (Anonymous)' : 'Submit Anonymously (Hide my name)'}</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-agri-800 hover:bg-agri-900 text-white rounded-xl font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : isHi ? 'रिपोर्ट भेजें' : 'Submit Report'}</span>
              </button>
            </form>
          </div>

          {/* Farmer's Own Submitted Reports Status Tracker */}
          {!isGovt && (
            <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                {isHi ? 'मेरी दर्ज की गई रिपोर्टें' : 'My Submitted Reports & Verification Status'}
              </h3>
              {myReports.length === 0 ? (
                <p className="text-xs text-gray-400 py-3">
                  You have not submitted any reports from this account yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {myReports.map((mr) => (
                    <div
                      key={mr.id}
                      className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 uppercase">
                          {mr.category?.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            mr.status === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : mr.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {mr.status === 'verified' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : mr.status === 'rejected' ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {mr.status}
                        </span>
                      </div>
                      <p className="text-gray-700">{mr.description}</p>
                      {mr.rejectionReason && (
                        <p className="text-[11px] text-gray-600 bg-white p-2 rounded-lg border border-gray-200 mt-1">
                          <strong>Moderator Note:</strong> {mr.rejectionReason}
                        </p>
                      )}
                      <span className="text-[11px] text-gray-400 block capitalize">
                        {mr.district} District • {mr.submittedAt ? new Date(mr.submittedAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Verified Reports Map & Feed (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Map */}
          <div className="bg-white border border-[#e8ece8] rounded-2xl p-4 sm:p-5 shadow-xs">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">
              {isHi ? 'सार्वजनिक सत्यापित रिपोर्ट मानचित्र' : 'Verified Community Reports Map'}
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              Only verified reports are shown publicly. GPS rounded to ~500m for reporter privacy.
            </p>
            <GeoMap markers={reportMarkers} center={[24.585, 73.712]} zoom={9} height="320px" />
          </div>

          {/* Verified Feed List */}
          <div className="bg-white border border-[#e8ece8] rounded-2xl p-5 shadow-xs">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-3">
              {isHi ? 'हालिया सत्यापित रिपोर्टें' : 'Recent Public Verified Reports'}
            </h3>

            {reports.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                No verified community reports published yet for this region.
              </p>
            ) : (
              <div className="space-y-3">
                {reports.slice(0, 10).map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 uppercase tracking-wide">
                        {r.category?.replace(/_/g, ' ')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Verified by Govt / Org Moderator
                      </span>
                    </div>
                    <p className="text-gray-700 leading-snug">{r.description}</p>
                    <span className="text-[11px] text-gray-400 block capitalize">
                      {r.district} District
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
