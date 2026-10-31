import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Phone,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Info,
  Building2,
  Briefcase,
  MapPin,
  Clock,
  FileBadge,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';
import { User, UserRole } from '../types';

const ORG_TYPES = [
  'Agriculture Department',
  'Water Resources / Irrigation',
  'Forest / Environment',
  'Mandi / APMC / Marketing Board',
  'Research / University / KVK',
  'NGO / FPO / Cooperative',
];

const RAJASTHAN_DISTRICTS = [
  'Udaipur',
  'Rajsamand',
  'Salumber',
  'Chittorgarh',
  'Dungarpur',
  'Banswara',
  'Pratapgarh',
  'Bhilwara',
  'Sirohi',
  'Pali',
  'Jaipur (State HQ)',
  'Other',
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useApp();

  // Switch between 'login' and 'create' without leaving the page
  const [authMode, setAuthMode] = useState<'login' | 'create'>(() => {
    return location.pathname === '/register' ? 'create' : 'login';
  });

  // Form Fields
  const [role, setRole] = useState<UserRole>('farmer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Government / Organization Additional Registration Fields
  const [organizationName, setOrganizationName] = useState('');
  const [designation, setDesignation] = useState('');
  const [stateName, setStateName] = useState('Rajasthan');
  const [districtName, setDistrictName] = useState('Udaipur');
  const [organizationType, setOrganizationType] = useState(ORG_TYPES[0]);
  const [officialIdInfo, setOfficialIdInfo] = useState('');

  // Verification Status Screen State (for pending, rejected, or suspended Govt / Org accounts)
  const [pendingAccount, setPendingAccount] = useState<{
    status: 'pending' | 'rejected' | 'suspended';
    user?: User;
    message: string;
    reason?: string;
  } | null>(null);

  // Validation Errors & Loading
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Google OAuth Config Modal State (kept for potential future use)
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Handle google_error param set by backend OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const googleError = params.get('google_error');
    if (googleError) {
      if (googleError === 'pending_verification') {
        setPendingAccount({
          status: 'pending',
          message:
            'Your Government / Organization account is pending administrator verification. You will gain access to the Government Admin Portal once an administrator approves your credentials.',
        });
      } else {
        const messages: Record<string, string> = {
          not_configured: 'Google Sign-In is not configured on this server. Please use email and password.',
          cancelled: 'Google Sign-In was cancelled. Please try again.',
          missing_code: 'Google Sign-In failed: missing authorization code. Please try again.',
          invalid_state: 'Google Sign-In failed: security check failed. Please try again.',
          account_suspended: 'Your account has been suspended or rejected by an administrator.',
          auth_failed: 'Google Sign-In failed. Please try again or use email and password.',
        };
        setGeneralError(messages[googleError] || 'Google Sign-In failed. Please try again.');
      }
      // Clean up URL without reloading
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search, location.pathname]);

  const validateForm = (): boolean => {
    const errs: { [key: string]: string } = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    // Password validation
    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    if (authMode === 'create') {
      if (!fullName.trim()) {
        errs.fullName = 'Full Name is required.';
      }
      if (!phone.trim()) {
        errs.phone = 'Phone Number is required.';
      }
      if (!confirmPassword) {
        errs.confirmPassword = 'Please confirm your password.';
      } else if (password !== confirmPassword) {
        errs.confirmPassword = 'Passwords do not match.';
      }

      if (role === 'govt_org') {
        if (!organizationName.trim()) {
          errs.organizationName = 'Organization / Department Name is required.';
        }
        if (!designation.trim()) {
          errs.designation = 'Designation / Role Title is required.';
        }
        if (!stateName.trim()) {
          errs.stateName = 'State is required.';
        }
        if (!districtName.trim()) {
          errs.districtName = 'District / Region is required.';
        }
        if (!organizationType.trim()) {
          errs.organizationType = 'Organization Type is required.';
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setPendingAccount(null);
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await authService.login({ email, password, rememberMe });
      if (result.pendingVerification || result.accountStatus === 'pending') {
        setPendingAccount({
          status: 'pending',
          user: result.user,
          message:
            result.error ||
            'Your Government / Organization account is pending administrator verification.',
        });
        return;
      }

      if (result.accountStatus === 'rejected') {
        setPendingAccount({
          status: 'rejected',
          user: result.user,
          reason: result.rejectionReason || result.user?.rejectionReason,
          message:
            result.error ||
            'Your Government / Organization account verification was declined by an administrator.',
        });
        return;
      }

      if (result.accountStatus === 'suspended') {
        setPendingAccount({
          status: 'suspended',
          user: result.user,
          reason: result.suspendedReason || result.user?.suspendedReason,
          message:
            result.error ||
            'Your account administrative access has been suspended.',
        });
        return;
      }

      if (result.success && result.user && result.token) {
        login(result.user, result.token, rememberMe);
        const defaultPortal = authService.getDefaultPortalPath(result.user);
        const requestedFrom = (location.state as any)?.from?.pathname;
        // Ensure a farmer isn't redirected to a govt route or vice versa
        if (authService.isGovtOrg(result.user)) {
          navigate(requestedFrom?.startsWith('/app') ? requestedFrom : '/app/gov', { replace: true });
        } else {
          navigate(defaultPortal, { replace: true });
        }
      } else {
        setGeneralError(result.error || 'Invalid email or password.');
      }
    } catch {
      setGeneralError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setPendingAccount(null);
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await authService.register({
        name: fullName,
        email,
        phone,
        password,
        role,
        ...(role === 'govt_org'
          ? {
              organizationName,
              designation,
              state: stateName,
              district: districtName,
              organizationType,
              officialIdInfo,
              location: `${districtName}, ${stateName}`,
            }
          : {}),
      });

      if (result.pendingVerification) {
        setPendingAccount({
          status: 'pending',
          user: result.user,
          message:
            result.error ||
            'Your Government / Organization account has been created and is awaiting administrator verification.',
        });
        return;
      }

      if (result.success && result.user && result.token) {
        login(result.user, result.token);
        const targetPortal = authService.getDefaultPortalPath(result.user);
        navigate(targetPortal, { replace: true });
      } else {
        setGeneralError(result.error || 'Registration failed. Please try again.');
      }
    } catch {
      setGeneralError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleClick = () => {
    // Redirect to backend which generates the full Google OAuth URL with state.
    // GOOGLE_CLIENT_SECRET stays server-side only.
    authService.startGoogleLogin();
  };

  return (
    <div className="relative min-h-screen min-h-[100dvh] lg:h-screen lg:max-h-screen w-full overflow-x-hidden overflow-y-auto lg:overflow-hidden bg-[#071d12] flex flex-col justify-between select-none">
      {/* ============================================================
          1. FULL SCREEN AGRICULTURAL BACKGROUND
          ============================================================ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <img
          src="/images/farmer-hero.jpg"
          alt="GreenAgro Farmer in Green Field"
          className="w-full h-full object-cover object-[78%_center] sm:object-[80%_center] lg:object-[88%_center] xl:object-[86%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/20" />
        <div className="absolute inset-0 bg-[#071d12]/25 mix-blend-multiply" />
      </div>

      {/* ============================================================
          2. DESKTOP & MOBILE CONTENT
          ============================================================ */}
      <div className="relative z-10 w-full min-h-[100dvh] lg:h-full flex flex-col justify-between px-3 sm:px-6 lg:px-8 xl:px-14 py-3 sm:py-5 lg:py-3">
        {/* ============================================================
             TOP NAVIGATION: BACK TO HOME
             ============================================================ */}
        <div className="w-full flex items-center justify-between shrink-0 mb-1 sm:mb-2 lg:mb-0 lg:absolute lg:top-4 lg:left-8 xl:left-14 lg:w-auto z-20">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/30 hover:bg-black/50 text-white/95 hover:text-white text-xs sm:text-sm font-semibold backdrop-blur-md border border-white/20 shadow-xs transition-all group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-300 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Home</span>
          </Link>

          {/* Mobile Header Logo */}
          <div className="lg:hidden">
            <Link to="/">
              <img
                src="/images/greenagro-logo.png"
                alt="GreenAgro"
                className="h-8 w-auto object-contain brightness-0 invert"
              />
            </Link>
          </div>
        </div>

        {/* Main layout row: Left Branding (Desktop) + Right Auth Card (Desktop & Mobile) */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-between w-full max-w-[1060px] xl:max-w-[1140px] mx-auto lg:mx-0 lg:ml-6 xl:ml-14 my-auto gap-4 lg:gap-8 xl:gap-12">
          {/* ============================================================
              LEFT ZONE (DESKTOP): GREENAGRO BRANDING
              ============================================================ */}
          <div className="hidden lg:flex flex-col justify-center max-w-[480px] xl:max-w-[520px] text-white space-y-3.5 xl:space-y-5">
            <Link to="/" className="inline-block">
              <img
                src="/images/greenagro-logo.png"
                alt="GreenAgro"
                className="h-12 w-auto object-contain brightness-0 invert"
              />
            </Link>

            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30 backdrop-blur-xs w-fit">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Southern Rajasthan Ridge-to-Lake Intelligence Platform</span>
              </div>
              <h1 className="text-3xl lg:text-[38px] xl:text-[44px] font-black text-white leading-[1.14] tracking-tight">
                Smarter Farming.
                <br />
                Healthier Tomorrow.
              </h1>
              <p className="text-xs xl:text-sm text-gray-200 leading-relaxed font-normal max-w-md">
                Unified role-based platform connecting Farmers with farm-level soil, crop, and market intelligence, and Government / Organization Officials with regional Ridge-to-Lake monitoring.
              </p>
            </div>

            {/* Feature bullets */}
            <div className="space-y-2 pt-2.5 border-t border-white/15 text-xs text-gray-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Farmer Portal: Soil Health, Crop Doctor, Weather, Fair Market & Regenerative Plan</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Govt / Org Portal: Lakes Monitor, Watershed Defense, Aravalli Guard & Moderation</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verified role-based access control and real-time ecological telemetry</span>
              </div>
            </div>
          </div>

          {/* ============================================================
              RIGHT ZONE (DESKTOP & MOBILE): WHITE AUTHENTICATION CARD
              ============================================================ */}
          <div className="w-full max-w-[430px] lg:max-w-[430px] xl:max-w-[445px] shrink-0 my-auto">
            <div className="w-full bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] border border-gray-100/80 max-h-[calc(100dvh-32px)] lg:max-h-[calc(100dvh-48px)] overflow-y-auto">
              {/* ============================================================
                  PENDING VERIFICATION VIEW (FOR UNVERIFIED GOVT / ORG ACCOUNTS)
                  ============================================================ */}
              {pendingAccount ? (
                <div className="space-y-4 py-2">
                  <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto ${
                      pendingAccount.status === 'pending'
                        ? 'bg-amber-50 border-amber-200 text-amber-600'
                        : 'bg-rose-50 border-rose-200 text-rose-600'
                    }`}
                  >
                    {pendingAccount.status === 'pending' ? (
                      <Clock className="w-6 h-6" />
                    ) : (
                      <AlertCircle className="w-6 h-6" />
                    )}
                  </div>
                  <div className="text-center space-y-1.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        pendingAccount.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {pendingAccount.status === 'pending'
                        ? 'Verification Pending'
                        : pendingAccount.status === 'rejected'
                          ? 'Verification Declined'
                          : 'Account Suspended'}
                    </span>
                    <h2 className="text-xl font-black text-[#0e2a1e]">
                      {pendingAccount.status === 'pending'
                        ? 'Account Under Administrator Review'
                        : pendingAccount.status === 'rejected'
                          ? 'Application Not Approved'
                          : 'Administrative Access Restricted'}
                    </h2>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {pendingAccount.message}
                    </p>
                  </div>

                  {pendingAccount.reason && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                      <div className="font-bold uppercase tracking-wider text-[10px] text-rose-700">
                        Official Administrator Reason
                      </div>
                      <p className="font-medium leading-relaxed">{pendingAccount.reason}</p>
                    </div>
                  )}

                  {pendingAccount.user && (
                    <div className="bg-[#f8faf8] rounded-xl p-3.5 border border-gray-200 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Official Name:</span>
                        <span className="font-bold text-gray-900">{pendingAccount.user.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Email:</span>
                        <span className="font-bold text-gray-900">{pendingAccount.user.email}</span>
                      </div>
                      {pendingAccount.user.organizationName && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 font-medium">Organization:</span>
                          <span className="font-bold text-gray-900">{pendingAccount.user.organizationName}</span>
                        </div>
                      )}
                      {pendingAccount.user.designation && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 font-medium">Designation:</span>
                          <span className="font-bold text-gray-900">{pendingAccount.user.designation}</span>
                        </div>
                      )}
                      {(pendingAccount.user.district || pendingAccount.user.state) && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 font-medium">Jurisdiction:</span>
                          <span className="font-bold text-gray-900">
                            {[pendingAccount.user.district, pendingAccount.user.state].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t border-gray-200/80">
                        <span className="text-gray-500 font-medium">Portal Role:</span>
                        <span className="font-bold text-emerald-700">Government / Organization</span>
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-[11px] text-emerald-900 leading-relaxed">
                    <strong>Security Policy:</strong> Government / Organization administrative permissions are never granted by self-selection alone. Once a platform administrator verifies your official credentials, you can sign in to access the Government Admin Portal.
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPendingAccount(null);
                      setAuthMode('login');
                      setPassword('');
                      setConfirmPassword('');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#156637] hover:bg-[#104e2a] text-white font-bold text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <>
                  {/* Mode Switcher Tabs */}
                  <div className="flex bg-[#f3f5f3] p-1 rounded-xl mb-3 border border-gray-200/80">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setErrors({});
                        setGeneralError(null);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        authMode === 'login'
                          ? 'bg-[#156637] text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('create');
                        setErrors({});
                        setGeneralError(null);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        authMode === 'create'
                          ? 'bg-[#156637] text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>

                  {/* Card Title */}
                  <div className="mb-3">
                    <h2 className="text-xl sm:text-2xl font-black text-[#0e2a1e] tracking-tight leading-none">
                      {authMode === 'login' ? 'Welcome Back' : 'Create Your Account'}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {authMode === 'login'
                        ? 'Sign in to continue to your Farmer or Government / Organization portal.'
                        : role === 'govt_org'
                          ? 'Register an official Government / Organization account for regional monitoring.'
                          : 'Start your journey towards smarter, more sustainable farming.'}
                    </p>
                  </div>

                  {/* Error Banner */}
                  {generalError && (
                    <div className="mb-2.5 p-2 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                      <span>{generalError}</span>
                    </div>
                  )}

                  {/* ============================================================
                      FORM: SIGN IN MODE
                      ============================================================ */}
                  {authMode === 'login' && (
                    <form onSubmit={handleLoginSubmit} className="space-y-2.5">
                      {/* Email */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-0.5">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (errors.email) setErrors({ ...errors, email: '' });
                            }}
                            placeholder="farmer@example.com or official@gov.in"
                            className={`w-full bg-[#f8faf8] focus:bg-white border rounded-xl pl-10 pr-3.5 py-2 text-xs sm:text-sm text-gray-900 focus:outline-hidden transition-colors ${
                              errors.email
                                ? 'border-red-400 focus:border-red-500'
                                : 'border-gray-200 focus:border-[#156637] focus:ring-1 focus:ring-[#156637]'
                            }`}
                          />
                        </div>
                        {errors.email && (
                          <p className="text-[11px] text-red-600 mt-0.5 font-medium">{errors.email}</p>
                        )}
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-0.5">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              if (errors.password) setErrors({ ...errors, password: '' });
                            }}
                            placeholder="Enter your password"
                            className={`w-full bg-[#f8faf8] focus:bg-white border rounded-xl pl-10 pr-10 py-2 text-xs sm:text-sm text-gray-900 focus:outline-hidden transition-colors ${
                              errors.password
                                ? 'border-red-400 focus:border-red-500'
                                : 'border-gray-200 focus:border-[#156637] focus:ring-1 focus:ring-[#156637]'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="text-[11px] text-red-600 mt-0.5 font-medium">{errors.password}</p>
                        )}
                      </div>

                      {/* Remember Me & Forgot Password */}
                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <label className="flex items-center gap-2 cursor-pointer text-gray-600 select-none">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded text-[#156637] accent-[#156637] focus:ring-[#156637] cursor-pointer"
                          />
                          <span className="font-medium text-gray-700">Remember me</span>
                        </label>
                        <span className="font-medium text-gray-400 cursor-not-allowed" title="Password reset coming soon">
                          Forgot Password?
                        </span>
                      </div>

                      {/* Primary Action Button */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#156637] hover:bg-[#104e2a] text-white font-bold text-xs sm:text-sm shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 mt-1 cursor-pointer"
                      >
                        <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </form>
                  )}

                  {/* ============================================================
                      FORM: CREATE ACCOUNT MODE (ONLY TWO ROLES: Farmer | Govt / Org)
                      ============================================================ */}
                  {authMode === 'create' && (
                    <form onSubmit={handleRegisterSubmit} className="space-y-2">
                      {/* Two-Role Selector ONLY */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-0.5">Select Account Role</label>
                        <div className="grid grid-cols-2 gap-1.5 bg-[#f8faf8] p-1 rounded-xl border border-gray-200 text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() => {
                              setRole('farmer');
                              setErrors({});
                            }}
                            className={`py-1.5 rounded-lg transition-all text-xs font-bold cursor-pointer ${
                              role === 'farmer'
                                ? 'bg-[#156637] text-white shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Farmer
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRole('govt_org');
                              setErrors({});
                            }}
                            className={`py-1.5 rounded-lg transition-all text-xs font-bold cursor-pointer ${
                              role === 'govt_org'
                                ? 'bg-[#156637] text-white shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Govt / Org
                          </button>
                        </div>
                      </div>

                      {/* Full Name */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-0.5">
                          {role === 'govt_org' ? 'Official Full Name' : 'Full Name'}
                        </label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => {
                              setFullName(e.target.value);
                              if (errors.fullName) setErrors({ ...errors, fullName: '' });
                            }}
                            placeholder={role === 'govt_org' ? 'e.g. Dr. Rajesh Sharma' : 'e.g. Ramesh Kumar'}
                            className={`w-full bg-[#f8faf8] focus:bg-white border rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 focus:outline-hidden transition-colors ${
                              errors.fullName ? 'border-red-400' : 'border-gray-200 focus:border-[#156637]'
                            }`}
                          />
                        </div>
                        {errors.fullName && (
                          <p className="text-[11px] text-red-600 mt-0.5">{errors.fullName}</p>
                        )}
                      </div>

                      {/* Email & Phone side-by-side when Govt/Org to keep card compact */}
                      <div className={role === 'govt_org' ? 'grid grid-cols-1 sm:grid-cols-2 gap-2' : 'space-y-2'}>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-0.5">
                            {role === 'govt_org' ? 'Official Email' : 'Email Address'}
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email) setErrors({ ...errors, email: '' });
                              }}
                              placeholder={role === 'govt_org' ? 'officer@rajasthan.gov.in' : 'farmer@example.com'}
                              className={`w-full bg-[#f8faf8] focus:bg-white border rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 focus:outline-hidden transition-colors ${
                                errors.email ? 'border-red-400' : 'border-gray-200 focus:border-[#156637]'
                              }`}
                            />
                          </div>
                          {errors.email && (
                            <p className="text-[11px] text-red-600 mt-0.5">{errors.email}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-0.5">Phone Number</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => {
                                setPhone(e.target.value);
                                if (errors.phone) setErrors({ ...errors, phone: '' });
                              }}
                              placeholder="+91 98765 43210"
                              className={`w-full bg-[#f8faf8] focus:bg-white border rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 focus:outline-hidden transition-colors ${
                                errors.phone ? 'border-red-400' : 'border-gray-200 focus:border-[#156637]'
                              }`}
                            />
                          </div>
                          {errors.phone && (
                            <p className="text-[11px] text-red-600 mt-0.5">{errors.phone}</p>
                          )}
                        </div>
                      </div>

                      {/* Additional Government / Organization Fields */}
                      {role === 'govt_org' && (
                        <div className="space-y-2 pt-1 pb-1 px-2.5 bg-emerald-50/50 rounded-xl border border-emerald-200/70">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                              Organization / Department Name
                            </label>
                            <div className="relative">
                              <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                              <input
                                type="text"
                                value={organizationName}
                                onChange={(e) => {
                                  setOrganizationName(e.target.value);
                                  if (errors.organizationName) setErrors({ ...errors, organizationName: '' });
                                }}
                                placeholder="e.g. Dept. of Agriculture, Udaipur"
                                className={`w-full bg-white border rounded-lg pl-8 pr-2.5 py-1 text-xs text-gray-900 focus:outline-hidden ${
                                  errors.organizationName ? 'border-red-400' : 'border-gray-200 focus:border-[#156637]'
                                }`}
                              />
                            </div>
                            {errors.organizationName && (
                              <p className="text-[10px] text-red-600 mt-0.5">{errors.organizationName}</p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                                Designation / Role Title
                              </label>
                              <div className="relative">
                                <Briefcase className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                                <input
                                  type="text"
                                  value={designation}
                                  onChange={(e) => {
                                    setDesignation(e.target.value);
                                    if (errors.designation) setErrors({ ...errors, designation: '' });
                                  }}
                                  placeholder="e.g. Assistant Director"
                                  className={`w-full bg-white border rounded-lg pl-7 pr-2 py-1 text-xs text-gray-900 focus:outline-hidden ${
                                    errors.designation ? 'border-red-400' : 'border-gray-200 focus:border-[#156637]'
                                  }`}
                                />
                              </div>
                              {errors.designation && (
                                <p className="text-[10px] text-red-600 mt-0.5">{errors.designation}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                                Organization Type
                              </label>
                              <select
                                value={organizationType}
                                onChange={(e) => setOrganizationType(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-900 focus:outline-hidden focus:border-[#156637]"
                              >
                                {ORG_TYPES.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-0.5">State</label>
                              <div className="relative">
                                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                                <input
                                  type="text"
                                  value={stateName}
                                  onChange={(e) => setStateName(e.target.value)}
                                  className="w-full bg-white border border-gray-200 rounded-lg pl-7 pr-2 py-1 text-xs text-gray-900 focus:outline-hidden focus:border-[#156637]"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                                District / Region
                              </label>
                              <select
                                value={districtName}
                                onChange={(e) => setDistrictName(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-900 focus:outline-hidden focus:border-[#156637]"
                              >
                                {RAJASTHAN_DISTRICTS.map((d) => (
                                  <option key={d} value={d}>
                                    {d}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
                              Official ID / Employee Ref (Optional)
                            </label>
                            <div className="relative">
                              <FileBadge className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                              <input
                                type="text"
                                value={officialIdInfo}
                                onChange={(e) => setOfficialIdInfo(e.target.value)}
                                placeholder="e.g. RAJ-AGRI-2024-882"
                                className="w-full bg-white border border-gray-200 rounded-lg pl-7 pr-2 py-1 text-xs text-gray-900 focus:outline-hidden focus:border-[#156637]"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Password & Confirm */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-0.5">Password</label>
                          <div className="relative">
                            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                if (errors.password) setErrors({ ...errors, password: '' });
                              }}
                              placeholder="Min 6 chars"
                              className={`w-full bg-[#f8faf8] focus:bg-white border rounded-xl pl-7 pr-2 py-1.5 text-xs text-gray-900 focus:outline-hidden transition-colors ${
                                errors.password ? 'border-red-400' : 'border-gray-200 focus:border-[#156637]'
                              }`}
                            />
                          </div>
                          {errors.password && (
                            <p className="text-[10px] text-red-600 mt-0.5">{errors.password}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-0.5">Confirm</label>
                          <div className="relative">
                            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                              }}
                              placeholder="Re-enter"
                              className={`w-full bg-[#f8faf8] focus:bg-white border rounded-xl pl-7 pr-2 py-1.5 text-xs text-gray-900 focus:outline-hidden transition-colors ${
                                errors.confirmPassword ? 'border-red-400' : 'border-gray-200 focus:border-[#156637]'
                              }`}
                            />
                          </div>
                          {errors.confirmPassword && (
                            <p className="text-[10px] text-red-600 mt-0.5">{errors.confirmPassword}</p>
                          )}
                        </div>
                      </div>

                      {/* Primary Action Button */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 px-4 rounded-xl bg-[#156637] hover:bg-[#104e2a] text-white font-bold text-xs sm:text-sm shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 mt-1 cursor-pointer"
                      >
                        <span>
                          {isLoading
                            ? 'Submitting...'
                            : role === 'govt_org'
                              ? 'Submit for Govt / Org Verification'
                              : 'Create Farmer Account'}
                        </span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </form>
                  )}

                  {/* ============================================================
                      SOCIAL AUTH DIVIDER & OPTIONS
                      ============================================================ */}
                  <div className="relative my-2.5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span className="bg-white px-2">OR</span>
                    </div>
                  </div>

                  <div className={authMode === 'create' ? 'grid grid-cols-1 sm:grid-cols-2 gap-2' : 'space-y-2'}>
                    {/* Continue with Google */}
                    <button
                      type="button"
                      onClick={handleGoogleClick}
                      className="w-full py-2 px-3 rounded-xl border border-gray-200 hover:bg-[#f2f6f2] text-xs font-bold text-gray-700 flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1c0 2.8.7 5.4 1.9 7.8l3.7-2.9z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.6L1.9 16.1C3.7 19.8 7.5 22.4 12 22.4z"
                        />
                      </svg>
                      <span className="truncate">{authMode === 'create' ? 'Google' : 'Continue with Google'}</span>
                    </button>

                    {/* Continue with Phone — Coming Soon */}
                    <button
                      type="button"
                      disabled
                      title="Phone OTP login coming soon"
                      className="w-full py-2 px-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold text-gray-400 flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <Phone className="w-4 h-4 text-gray-300 shrink-0" />
                      <span className="truncate">
                        {authMode === 'create' ? 'Phone (Coming Soon)' : 'Phone Login (Coming Soon)'}
                      </span>
                    </button>
                  </div>

                  {/* Toggle link below form */}
                  <div className="text-center mt-2.5 text-xs text-gray-500">
                    {authMode === 'login' ? (
                      <>
                        <span>Don't have an account? </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('create');
                            setErrors({});
                            setGeneralError(null);
                          }}
                          className="font-bold text-[#156637] hover:underline cursor-pointer"
                        >
                          Create Account
                        </button>
                      </>
                    ) : (
                      <>
                        <span>Already have an account? </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('login');
                            setErrors({});
                            setGeneralError(null);
                          }}
                          className="font-bold text-[#156637] hover:underline cursor-pointer"
                        >
                          Sign In
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Mobile Footer Note */}
            <div className="mt-2.5 text-center text-[11px] text-gray-300/90 font-medium max-w-xs mx-auto lg:hidden">
              GreenAgro Intelligence Network • Regenerative Agriculture
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          GOOGLE OAUTH CONFIGURATION MODAL (DEV NOTICE)
          ============================================================ */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-amber-700">
                <Info className="w-5 h-5" />
                <h3 className="font-bold text-base text-gray-900">Google OAuth Setup</h3>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Live Google Sign-In requires your Google Cloud OAuth Client credentials.
              In your <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">.env</code> file, set:
            </p>

            <div className="bg-[#f8faf7] p-3 rounded-xl border border-gray-200 font-mono text-[11px] text-gray-800 space-y-1">
              <div>VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com</div>
              <div>GOOGLE_CLIENT_SECRET=your_secret</div>
            </div>

            <p className="text-xs text-gray-500">
              Until Google OAuth is configured, please use your email and password to sign in.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="px-4 py-2 rounded-xl bg-[#156637] hover:bg-[#104e2a] text-white text-xs font-bold transition-all cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
