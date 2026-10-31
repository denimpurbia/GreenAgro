import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Search,
  RefreshCw,
  Eye,
  Check,
  X,
  AlertTriangle,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileBadge,
  Calendar,
  History,
  KeyRound,
  RotateCcw,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';
import { User } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

type VerificationTab = 'pending' | 'verified' | 'rejected' | 'suspended' | 'audit';

interface VerificationSummary {
  pendingCount: number;
  verifiedCount: number;
  rejectedCount: number;
  suspendedCount: number;
  superAdminCount: number;
}

interface AuditLogEntry {
  _id: string;
  action: string;
  targetUserId: string;
  targetUserEmail: string;
  targetUserName?: string;
  adminId: string;
  adminEmail: string;
  previousStatus?: string;
  newStatus?: string;
  reasonOrNotes?: string;
  createdAt: string;
}

export const AccountVerificationPage: React.FC = () => {
  const { user: currentUser } = useApp();
  const isSuperAdmin = authService.isSuperAdmin(currentUser);
  const canVerify = authService.canVerifyAccounts(currentUser);

  const [activeTab, setActiveTab] = useState<VerificationTab>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [accounts, setAccounts] = useState<User[]>([]);
  const [summary, setSummary] = useState<VerificationSummary>({
    pendingCount: 0,
    verifiedCount: 0,
    rejectedCount: 0,
    suspendedCount: 0,
    superAdminCount: 0,
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'success' | 'info';
    text: string;
    emailNotice?: string;
  } | null>(null);

  // Modals State
  const [detailTarget, setDetailTarget] = useState<{
    account: User;
    auditHistory: AuditLogEntry[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [approveTarget, setApproveTarget] = useState<User | null>(null);
  const [approveNotes, setApproveNotes] = useState('');

  const [rejectTarget, setRejectTarget] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectReasonError, setRejectReasonError] = useState<string | null>(null);

  const [suspendTarget, setSuspendTarget] = useState<User | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendReasonError, setSuspendReasonError] = useState<string | null>(null);

  const [reactivateTarget, setReactivateTarget] = useState<User | null>(null);
  const [reactivateNotes, setReactivateNotes] = useState('');

  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = authService.getToken();
      const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      if (activeTab === 'audit') {
        const res = await fetch(`${API_BASE}/admin/audit-logs?limit=100`, { headers });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || data.message || 'Failed to load administrative audit logs.');
        }
        setAuditLogs(data.logs || []);
      } else {
        const params = new URLSearchParams({
          status: activeTab,
          ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
        });
        const res = await fetch(`${API_BASE}/admin/verifications?${params.toString()}`, {
          headers,
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || data.message || 'Failed to load Government / Organization accounts.');
        }
        setAccounts(data.accounts || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Network error while loading verification queue.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    if (canVerify) {
      void fetchVerifications();
    } else {
      setLoading(false);
    }
  }, [canVerify, fetchVerifications]);

  const handleOpenDetails = async (account: User) => {
    setDetailLoading(true);
    setDetailTarget({ account, auditHistory: [] });
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE}/admin/verifications/${account.id}`, {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDetailTarget({
          account: data.account,
          auditHistory: data.auditHistory || [],
        });
      }
    } catch {
      // Keep initial account view if detail fetch fails
    } finally {
      setDetailLoading(false);
    }
  };

  const handleConfirmApprove = async () => {
    if (!approveTarget) return;
    setActionSubmitting(true);
    setError(null);
    setBannerMessage(null);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE}/admin/verifications/${approveTarget.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          notes:
            approveNotes.trim() ||
            'Official credentials verified and approved by Platform Super Administrator.',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to approve account.');
      }

      setBannerMessage({
        type: 'success',
        text: data.message || `Approved ${approveTarget.email}.`,
        emailNotice:
          data.notificationDelivery?.email === 'not_configured'
            ? 'In-app status & notification recorded in MongoDB. External SMTP email provider is not configured.'
            : undefined,
      });
      setApproveTarget(null);
      setApproveNotes('');
      await fetchVerifications();
    } catch (err: any) {
      setError(err.message || 'Failed to approve account.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      setRejectReasonError('Please enter a mandatory rejection reason before declining this application.');
      return;
    }
    setActionSubmitting(true);
    setRejectReasonError(null);
    setError(null);
    setBannerMessage(null);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE}/admin/verifications/${rejectTarget.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reason: rejectReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to reject application.');
      }

      setBannerMessage({
        type: 'info',
        text: data.message || `Rejected application for ${rejectTarget.email}.`,
        emailNotice:
          data.notificationDelivery?.email === 'not_configured'
            ? 'Rejection reason recorded in MongoDB (shown when applicant attempts sign-in). External SMTP email is not configured.'
            : undefined,
      });
      setRejectTarget(null);
      setRejectReason('');
      await fetchVerifications();
    } catch (err: any) {
      setError(err.message || 'Failed to reject application.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleConfirmSuspend = async () => {
    if (!suspendTarget) return;
    if (!suspendReason.trim()) {
      setSuspendReasonError('Please enter a mandatory reason for suspending this account.');
      return;
    }
    setActionSubmitting(true);
    setSuspendReasonError(null);
    setError(null);
    setBannerMessage(null);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE}/admin/accounts/${suspendTarget.id}/suspend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reason: suspendReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to suspend account.');
      }

      setBannerMessage({
        type: 'info',
        text: data.message || `Suspended account ${suspendTarget.email}.`,
      });
      setSuspendTarget(null);
      setSuspendReason('');
      await fetchVerifications();
    } catch (err: any) {
      setError(err.message || 'Failed to suspend account.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleConfirmReactivate = async () => {
    if (!reactivateTarget) return;
    setActionSubmitting(true);
    setError(null);
    setBannerMessage(null);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE}/admin/accounts/${reactivateTarget.id}/reactivate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          notes: reactivateNotes.trim() || 'Reactivated and verified by Super Administrator.',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to reactivate account.');
      }

      setBannerMessage({
        type: 'success',
        text: data.message || `Reactivated account ${reactivateTarget.email}.`,
      });
      setReactivateTarget(null);
      setReactivateNotes('');
      await fetchVerifications();
    } catch (err: any) {
      setError(err.message || 'Failed to reactivate account.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleToggleDelegateVerify = async (target: User) => {
    if (!isSuperAdmin) return;
    const currentCustom = Array.isArray(target.customPermissions) ? target.customPermissions : [];
    const hasVerify = currentCustom.includes('users:verify');
    const nextPerms = hasVerify
      ? currentCustom.filter((p) => p !== 'users:verify')
      : [...currentCustom, 'users:verify', 'audit:read'];

    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE}/admin/accounts/${target.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customPermissions: nextPerms,
          notes: hasVerify
            ? 'Revoked delegated account verification permission'
            : 'Granted delegated account verification permission',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBannerMessage({
          type: 'success',
          text: data.message,
        });
        if (detailTarget && detailTarget.account.id === target.id) {
          setDetailTarget({
            ...detailTarget,
            account: data.user,
          });
        }
        await fetchVerifications();
      } else {
        setError(data.error || 'Failed to update delegated permissions.');
      }
    } catch {
      setError('Network error while updating permissions.');
    }
  };

  if (!canVerify) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-base">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span>Super Administrator Permission Required</span>
        </div>
        <p className="text-xs sm:text-sm leading-relaxed">
          Your Government / Organization account is verified for regional monitoring modules, but only Platform Super Administrators (or officials explicitly granted verification privileges) can approve or reject Government / Organization registrations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0b2e1f] via-[#13422c] to-[#1a5638] rounded-3xl p-6 sm:p-7 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {isSuperAdmin
                  ? 'SUPER ADMINISTRATOR • ACCOUNT VERIFICATION & RBAC GOVERNANCE'
                  : 'DELEGATED VERIFIER • ACCOUNT VERIFICATION QUEUE'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Account Verification & Access Governance
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl">
              Review, verify, reject, or suspend Government / Organization portal registrations and inspect immutable administrative audit logs.
            </p>
          </div>

          <button
            onClick={fetchVerifications}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition-all self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
              : 'bg-white border-gray-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-800 mb-1">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{summary.pendingCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('verified')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'verified'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
              : 'bg-white border-gray-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 mb-1">
            <span>Approved Officials</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{summary.verifiedCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rejected')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'rejected'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
              : 'bg-white border-gray-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-rose-800 mb-1">
            <span>Rejected</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{summary.rejectedCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('suspended')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'suspended'
              ? 'bg-gray-100 border-gray-400 ring-2 ring-gray-300'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1">
            <span>Suspended</span>
            <Ban className="w-4 h-4 text-gray-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{summary.suspendedCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`col-span-2 sm:col-span-1 text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200'
              : 'bg-white border-gray-200 hover:border-indigo-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-indigo-800 mb-1">
            <span>Super Admins / Audit</span>
            <History className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{summary.superAdminCount}</div>
        </button>
      </div>

      {/* Feedback & Honest Notification Banner */}
      {bannerMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="space-y-1 text-xs sm:text-sm">
            <div className="font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{bannerMessage.text}</span>
            </div>
            {bannerMessage.emailNotice && (
              <p className="text-xs opacity-85 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>{bannerMessage.emailNotice}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-gray-500 hover:text-gray-800 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-600 hover:text-rose-900 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs + Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'pending', label: `Pending Requests (${summary.pendingCount})` },
              { id: 'verified', label: `Approved Accounts (${summary.verifiedCount})` },
              { id: 'rejected', label: `Rejected Accounts (${summary.rejectedCount})` },
              { id: 'suspended', label: `Suspended Accounts (${summary.suspendedCount})` },
              { id: 'audit', label: 'Audit Logs' },
            ] as Array<{ id: VerificationTab; label: string }>
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'bg-agri-800 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab !== 'audit' && (
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, department, district, ID..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-agri-700"
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 flex flex-col items-center justify-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agri-700 mb-3" />
          <p className="text-xs font-semibold">Loading account verification records...</p>
        </div>
      ) : activeTab === 'audit' ? (
        /* Audit Logs Table */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Immutable Administrative Audit Trail
              </h2>
              <p className="text-xs text-gray-500">
                Records Super Admin bootstrap, approvals, rejections, suspensions, reactivations, and permission changes.
              </p>
            </div>
            <span className="text-xs font-semibold text-gray-500">{auditLogs.length} entries</span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              No administrative audit log entries recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                    <th className="py-3 px-4 font-bold">Timestamp</th>
                    <th className="py-3 px-4 font-bold">Action</th>
                    <th className="py-3 px-4 font-bold">Target Account</th>
                    <th className="py-3 px-4 font-bold">Status Transition</th>
                    <th className="py-3 px-4 font-bold">Administrator</th>
                    <th className="py-3 px-4 font-bold">Reason / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50/80">
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded-md font-bold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{log.targetUserName || 'Official'}</div>
                        <div className="text-gray-500">{log.targetUserEmail}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-700 font-medium">
                        {log.previousStatus ? `${log.previousStatus} → ` : ''}
                        <span className="font-bold">{log.newStatus}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-700 font-semibold">{log.adminEmail}</td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs">{log.reasonOrNotes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-2">
          <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">
            No {activeTab} Government / Organization accounts found
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {activeTab === 'pending'
              ? 'All pending Government / Organization applications have been reviewed.'
              : `There are currently no accounts with status "${activeTab}" matching your filter.`}
          </p>
        </div>
      ) : (
        /* Accounts Queue List */
        <div className="space-y-3">
          {accounts.map((acc) => {
            const isTargetSuperAdmin = Boolean(acc.isSuperAdmin);
            const hasDelegatedVerify = Boolean(acc.customPermissions?.includes('users:verify'));

            return (
              <div
                key={acc.id}
                className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs hover:border-agri-300 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Applicant Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-black text-gray-900">{acc.name}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          acc.accountStatus === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : acc.accountStatus === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {acc.accountStatus}
                      </span>
                      {isTargetSuperAdmin && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                          SUPER ADMIN
                        </span>
                      )}
                      {!isTargetSuperAdmin && hasDelegatedVerify && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-900 border border-teal-200">
                          DELEGATED VERIFIER
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-800">{acc.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{acc.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-semibold text-gray-800">
                          {acc.organizationName || 'Unspecified Organization'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileBadge className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>
                          {acc.designation || 'Official'} • {acc.organizationType || 'Government'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>
                          {[acc.district, acc.state].filter(Boolean).join(', ') || acc.location || 'Rajasthan'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>
                          Registered:{' '}
                          {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : 'Recorded'}
                        </span>
                      </div>
                    </div>

                    {acc.officialIdInfo && (
                      <div className="text-xs text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 inline-block">
                        <strong>Official ID / Employee Ref:</strong> {acc.officialIdInfo}
                      </div>
                    )}

                    {(acc.rejectionReason || acc.suspendedReason || acc.verificationNotes) && (
                      <div className="text-xs text-gray-600 bg-[#f8faf8] px-3 py-1.5 rounded-lg border border-gray-200">
                        <strong> Verification Notes / Reason:</strong>{' '}
                        {acc.rejectionReason || acc.suspendedReason || acc.verificationNotes}
                        {acc.verifiedBy && (
                          <span className="text-gray-400 ml-2">(by {acc.verifiedBy})</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(acc)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>

                    {acc.accountStatus === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setApproveTarget(acc);
                            setApproveNotes('');
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-2xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectTarget(acc);
                            setRejectReason('');
                            setRejectReasonError(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {acc.accountStatus === 'verified' && !isTargetSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setSuspendTarget(acc);
                          setSuspendReason('');
                          setSuspendReasonError(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Suspend</span>
                      </button>
                    )}

                    {(acc.accountStatus === 'rejected' || acc.accountStatus === 'suspended') && (
                      <button
                        type="button"
                        onClick={() => {
                          setReactivateTarget(acc);
                          setReactivateNotes('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Approve / Reactivate</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          MODAL 1: APPLICANT FULL DETAIL & AUDIT HISTORY
          ===================================================================== */}
      {detailTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Official Applicant Dossier
                </span>
                <h3 className="text-xl font-black text-gray-900">{detailTarget.account.name}</h3>
                <p className="text-xs text-gray-500">{detailTarget.account.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailTarget(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#f8faf8] p-4 rounded-2xl border border-gray-200 text-xs">
              <div>
                <span className="text-gray-500 block">Account Status</span>
                <span className="font-bold text-gray-900 uppercase">
                  {detailTarget.account.accountStatus}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Phone Number</span>
                <span className="font-bold text-gray-900">
                  {detailTarget.account.phone || 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Organization / Department</span>
                <span className="font-bold text-gray-900">
                  {detailTarget.account.organizationName || '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Designation</span>
                <span className="font-bold text-gray-900">
                  {detailTarget.account.designation || '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Organization Type</span>
                <span className="font-bold text-gray-900">
                  {detailTarget.account.organizationType || '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">State & District</span>
                <span className="font-bold text-gray-900">
                  {[detailTarget.account.district, detailTarget.account.state]
                    .filter(Boolean)
                    .join(', ') || 'Rajasthan'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-500 block">Official ID / Employee Reference</span>
                <span className="font-bold text-gray-900">
                  {detailTarget.account.officialIdInfo || 'None supplied during registration'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Registration Date</span>
                <span className="font-bold text-gray-900">
                  {detailTarget.account.createdAt
                    ? new Date(detailTarget.account.createdAt).toLocaleString()
                    : 'Recorded'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Verified / Reviewed By</span>
                <span className="font-bold text-gray-900">
                  {detailTarget.account.verifiedBy || 'Pending review'}
                </span>
              </div>
            </div>

            {/* Super Admin Permission Delegation Controls */}
            {isSuperAdmin &&
              detailTarget.account.accountStatus === 'verified' &&
              !detailTarget.account.isSuperAdmin && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-indigo-700" />
                      <span>Delegate Account Verification Permission (users:verify)</span>
                    </div>
                    <p className="text-[11px] text-indigo-800">
                      By default, verified Govt / Org officials cannot approve other accounts. Enable this only if this official is authorized to review pending registrations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleDelegateVerify(detailTarget.account)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer ${
                      detailTarget.account.customPermissions?.includes('users:verify')
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : 'bg-indigo-700 text-white hover:bg-indigo-800'
                    }`}
                  >
                    {detailTarget.account.customPermissions?.includes('users:verify')
                      ? 'Revoke Verifier Access'
                      : 'Grant Verifier Access'}
                  </button>
                </div>
              )}

            {/* Account Audit History */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Account Verification & Audit History
              </h4>
              {detailLoading ? (
                <p className="text-xs text-gray-400">Loading audit history...</p>
              ) : detailTarget.auditHistory.length === 0 ? (
                <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">
                  No administrative actions recorded for this account yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {detailTarget.auditHistory.map((item) => (
                    <div
                      key={item._id}
                      className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                    >
                      <div>
                        <span className="font-bold text-gray-900">{item.action}</span>
                        <span className="text-gray-500 ml-2">by {item.adminEmail}</span>
                        {item.reasonOrNotes && (
                          <p className="text-gray-600 mt-0.5">{item.reasonOrNotes}</p>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 shrink-0">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDetailTarget(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: APPROVE CONFIRMATION DIALOG
          ===================================================================== */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  Approve Government / Org Account
                </h3>
                <p className="text-xs text-gray-500">
                  Confirm credential verification before granting portal access
                </p>
              </div>
            </div>

            <div className="bg-[#f8faf8] p-3.5 rounded-2xl border border-gray-200 text-xs space-y-1">
              <div>
                <span className="text-gray-500">Applicant:</span>{' '}
                <strong className="text-gray-900">{approveTarget.name}</strong>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>{' '}
                <strong className="text-gray-900">{approveTarget.email}</strong>
              </div>
              <div>
                <span className="text-gray-500">Department:</span>{' '}
                <strong className="text-gray-900">{approveTarget.organizationName}</strong>
              </div>
              <div>
                <span className="text-gray-500">Designation:</span>{' '}
                <strong className="text-gray-900">{approveTarget.designation}</strong>
              </div>
              {approveTarget.officialIdInfo && (
                <div>
                  <span className="text-gray-500">Official ID:</span>{' '}
                  <strong className="text-gray-900">{approveTarget.officialIdInfo}</strong>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Verification Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                placeholder="e.g. Verified departmental ID and Udaipur district assignment"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-hidden focus:border-emerald-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={actionSubmitting}
                onClick={() => setApproveTarget(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionSubmitting}
                onClick={handleConfirmApprove}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {actionSubmitting ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: REJECT DIALOG (MANDATORY REASON)
          ===================================================================== */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Reject Application</h3>
                <p className="text-xs text-gray-500">
                  {rejectTarget.name} ({rejectTarget.email})
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Mandatory Rejection Reason <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectReasonError) setRejectReasonError(null);
                }}
                placeholder="State clearly why this Government / Organization registration cannot be verified..."
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-hidden focus:border-rose-600"
              />
              {rejectReasonError && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">{rejectReasonError}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={actionSubmitting}
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionSubmitting}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {actionSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: SUSPEND ACCOUNT DIALOG
          ===================================================================== */}
      {suspendTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Suspend Official Account</h3>
                <p className="text-xs text-gray-500">
                  {suspendTarget.name} ({suspendTarget.email})
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Mandatory Suspension Reason <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                value={suspendReason}
                onChange={(e) => {
                  setSuspendReason(e.target.value);
                  if (suspendReasonError) setSuspendReasonError(null);
                }}
                placeholder="Enter the reason for suspending administrative portal access..."
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-hidden focus:border-rose-600"
              />
              {suspendReasonError && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">{suspendReasonError}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={actionSubmitting}
                onClick={() => setSuspendTarget(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionSubmitting}
                onClick={handleConfirmSuspend}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {actionSubmitting ? 'Suspending...' : 'Suspend Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 5: REACTIVATE / APPROVE DIALOG
          ===================================================================== */}
      {reactivateTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Reactivate & Verify Account</h3>
                <p className="text-xs text-gray-500">
                  {reactivateTarget.name} ({reactivateTarget.email})
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Reactivation Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={reactivateNotes}
                onChange={(e) => setReactivateNotes(e.target.value)}
                placeholder="Notes for audit log..."
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-hidden focus:border-emerald-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={actionSubmitting}
                onClick={() => setReactivateTarget(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionSubmitting}
                onClick={handleConfirmReactivate}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {actionSubmitting ? 'Reactivating...' : 'Confirm Reactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

