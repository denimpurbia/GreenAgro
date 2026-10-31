import { User, UserRole, AccountStatus } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  location?: string;
  organizationName?: string;
  designation?: string;
  state?: string;
  district?: string;
  organizationType?: string;
  officialIdInfo?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  pendingVerification?: boolean;
  accountStatus?: AccountStatus;
  rejectionReason?: string;
  suspendedReason?: string;
  code?: string;
}

export interface GoogleConfigStatus {
  isConfigured: boolean;
  clientId?: string;
  message?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function safeReadJson(response: Response): Promise<any> {
  try {
    const text = await response.text();
    if (!text || !text.trim()) {
      return null;
    }
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeUserRole(user: any): User {
  if (!user) return user;
  const raw = user.role;
  const normalizedRole: UserRole =
    raw === 'govt_org' || raw === 'government' ? 'govt_org' : 'farmer';
  return {
    ...user,
    role: normalizedRole,
    accountStatus: user.accountStatus || 'verified',
  };
}

class AuthService {
  isGovtOrg(user?: User | null): boolean {
    if (!user) return false;
    const raw = (user as any).role;
    return (raw === 'govt_org' || raw === 'government') && (user.accountStatus || 'verified') === 'verified';
  }

  isSuperAdmin(user?: User | null): boolean {
    if (!user || !this.isGovtOrg(user)) return false;
    return Boolean(user.isSuperAdmin || user.permissions?.includes('super_admin'));
  }

  canVerifyAccounts(user?: User | null): boolean {
    if (!user || !this.isGovtOrg(user)) return false;
    return Boolean(
      user.isSuperAdmin ||
      user.permissions?.includes('super_admin') ||
      user.permissions?.includes('users:verify')
    );
  }

  getDefaultPortalPath(user?: User | null): string {
    return this.isGovtOrg(user) ? '/app/gov' : '/app';
  }

  /**
   * Login user via backend API (MongoDB Atlas).
   * No local fallback — real authentication only.
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await safeReadJson(response);
        if (data && response.ok && data.status === 'success' && data.user && data.token) {
          const normalized = normalizeUserRole(data.user);
          this.saveSession(normalized, data.token, credentials.rememberMe);
          return {
            success: true,
            user: normalized,
            token: data.token,
            accountStatus: normalized.accountStatus,
          };
        }
        if (
          data?.code === 'ACCOUNT_PENDING_VERIFICATION' ||
          data?.accountStatus === 'pending'
        ) {
          return {
            success: false,
            pendingVerification: true,
            accountStatus: 'pending',
            code: data.code,
            user: data.user ? normalizeUserRole(data.user) : undefined,
            error:
              data.message ||
              'Your Government / Organization account is pending administrator verification.',
          };
        }
        if (
          data?.code === 'ACCOUNT_REJECTED' ||
          data?.accountStatus === 'rejected'
        ) {
          return {
            success: false,
            accountStatus: 'rejected',
            rejectionReason: data.rejectionReason,
            code: data.code,
            user: data.user ? normalizeUserRole(data.user) : undefined,
            error:
              data.message ||
              'Your Government / Organization account verification was declined.',
          };
        }
        if (
          data?.code === 'ACCOUNT_SUSPENDED' ||
          data?.accountStatus === 'suspended'
        ) {
          return {
            success: false,
            accountStatus: 'suspended',
            suspendedReason: data.suspendedReason,
            code: data.code,
            user: data.user ? normalizeUserRole(data.user) : undefined,
            error:
              data.message ||
              'Your account has been suspended by an administrator.',
          };
        }
        return {
          success: false,
          accountStatus: data?.accountStatus,
          code: data?.code,
          error: data?.message || 'Invalid email or password.',
        };
      }

      return {
        success: false,
        error: `Server error (${response.status}). Please try again later.`,
      };
    } catch {
      return {
        success: false,
        error: 'Unable to connect to the server. Please check your connection and try again.',
      };
    }
  }

  /**
   * Register new user via backend API (MongoDB Atlas).
   * No local fallback — real registration only.
   */
  async register(data: RegisterData): Promise<AuthResult> {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const resData = await safeReadJson(response);
        if (
          resData &&
          response.ok &&
          resData.status === 'pending_verification'
        ) {
          return {
            success: false,
            pendingVerification: true,
            accountStatus: 'pending',
            user: resData.user ? normalizeUserRole(resData.user) : undefined,
            error:
              resData.message ||
              'Government / Organization account registered and pending administrator verification.',
          };
        }

        if (resData && response.ok && resData.status === 'success' && resData.user && resData.token) {
          const normalized = normalizeUserRole(resData.user);
          this.saveSession(normalized, resData.token);
          return {
            success: true,
            user: normalized,
            token: resData.token,
            accountStatus: normalized.accountStatus,
          };
        }
        return { success: false, error: resData?.message || 'Failed to create account.' };
      }

      return {
        success: false,
        error: `Server error (${response.status}). Please try again later.`,
      };
    } catch {
      return {
        success: false,
        error: 'Unable to connect to the server. Please check your connection and try again.',
      };
    }
  }

  /**
   * Phone login — not yet implemented with real OTP backend.
   * Returns a clear error rather than faking authentication.
   */
  async phoneLogin(_phone: string, _otp?: string): Promise<AuthResult> {
    return {
      success: false,
      error: 'Phone login is not yet available. Please use email and password to sign in.',
    };
  }

  /**
   * Validate token and refresh user profile from backend.
   */
  async fetchCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await safeReadJson(response);
        if (data && data.status === 'success' && data.user) {
          const normalized = normalizeUserRole(data.user);
          localStorage.setItem('agrin_current_user', JSON.stringify(normalized));
          return normalized;
        }
      } else if (response.status === 401 || response.status === 403) {
        this.clearSession();
        return null;
      }
    } catch {
      // Backend offline — fall back to locally cached user only if token is still valid
      const user = this.getCurrentUser();
      if (user && !this.isTokenExpired(token)) {
        return user;
      }
      this.clearSession();
      return null;
    }

    // Server returned a non-401 error — keep locally cached user if token valid
    const user = this.getCurrentUser();
    if (user && !this.isTokenExpired(token)) {
      return user;
    }
    this.clearSession();
    return null;
  }

  getCurrentUser(): User | null {
    const stored = localStorage.getItem('agrin_current_user');
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      if (!parsed || !parsed.id) return null;
      return normalizeUserRole(parsed);
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return (
      localStorage.getItem('agrin_auth_token') ||
      sessionStorage.getItem('agrin_auth_token')
    );
  }

  /**
   * Validates real JWT token structure and expiration.
   */
  isTokenExpired(token: string): boolean {
    if (!token) return true;
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp && Date.now() >= payload.exp * 1000) {
          return true;
        }
        return false;
      }
      // Not a standard JWT — treat as expired
      return true;
    } catch {
      return true;
    }
  }

  /**
   * Reliable authentication check.
   * Never relies on raw string presence alone — validates real JWT.
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) {
      return false;
    }
    const user = this.getCurrentUser();
    if (!user || !user.id) {
      return false;
    }
    if (user.accountStatus && user.accountStatus !== 'verified') {
      return false;
    }
    return true;
  }

  saveSession(user: User, token: string, rememberMe = true): void {
    const normalized = normalizeUserRole(user);
    if (rememberMe) {
      localStorage.setItem('agrin_auth_token', token);
      localStorage.setItem('agrin_current_user', JSON.stringify(normalized));
      sessionStorage.removeItem('agrin_auth_token');
    } else {
      sessionStorage.setItem('agrin_auth_token', token);
      localStorage.setItem('agrin_current_user', JSON.stringify(normalized));
      localStorage.removeItem('agrin_auth_token');
    }
  }

  clearSession(): void {
    localStorage.removeItem('agrin_auth_token');
    localStorage.removeItem('agrin_current_user');
    sessionStorage.removeItem('agrin_auth_token');
  }

  getGoogleConfig(): GoogleConfigStatus {
    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId.trim() === '') {
      return {
        isConfigured: false,
        message:
          'Google Sign-In is not yet configured. Please use email and password to sign in.',
      };
    }
    return { isConfigured: true, clientId };
  }

  /**
   * Initiate Google OAuth by redirecting the browser to the backend.
   * The backend constructs the secure authorization URL with state.
   * GOOGLE_CLIENT_SECRET never touches the frontend.
   */
  startGoogleLogin(): void {
    window.location.href = `${API_BASE}/auth/google`;
  }
}

export const authService = new AuthService();
