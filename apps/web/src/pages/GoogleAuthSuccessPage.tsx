import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * GoogleAuthSuccessPage
 *
 * Landing page for /auth/google/success?token=JWT
 *
 * Flow:
 *  1. Read token from URL query param
 *  2. Remove token from browser history immediately (no token in URL bar)
 *  3. Call GET /api/auth/me with the token to verify it and fetch the user
 *  4. Store the session exactly like a normal email/password login
 *  5. Update AppContext auth state via login()
 *  6. Redirect to /app
 *
 * On any failure → redirect to /login?google_error=auth_failed
 */
export const GoogleAuthSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useApp();
  const handled = useRef(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      // Clean the token from the URL bar immediately for security
      window.history.replaceState({}, '', window.location.pathname);

      if (!token) {
        const err = 'No session token was provided in the callback URL.';
        console.error('[Google OAuth Success] Error:', err);
        setErrorMessage(err);
        return;
      }

      // Quick sanity check: standard JWT structure has 3 parts
      if (token.split('.').length !== 3) {
        const err = 'Invalid session token format received from authentication server.';
        console.error('[Google OAuth Success] Error:', err);
        setErrorMessage(err);
        return;
      }

      try {
        // Verify token with backend /api/auth/me
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        console.log('[Google OAuth Success] API status:', response.status);

        const data = await response.json().catch(() => null);
        console.log('[Google OAuth Success] API response:', data?.status || response.statusText);

        if (!response.ok || !data || data.status !== 'success' || !data.user) {
          const errText = data?.message || `Server returned status ${response.status}`;
          console.error('[Google OAuth Success] Error:', errText);
          setErrorMessage(`Authentication verification failed: ${errText}`);
          return;
        }

        // Save session with rememberMe=true
        authService.saveSession(data.user, token, true);

        // Update AppContext authentication state
        login(data.user, token, true);

        // Navigate to /app
        navigate('/app', { replace: true });
      } catch (err: any) {
        const msg = err?.message || 'Network error while verifying session.';
        console.error('[Google OAuth Success] Error:', msg);
        setErrorMessage(`Network error: ${msg}`);
      }
    };

    run();
  }, [navigate, login]);

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-[#071d12] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0c2a1a] border border-red-500/30 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 className="text-lg font-bold text-white">Google Sign-In Problem</h2>
          <p className="text-xs text-red-300/90 leading-relaxed font-mono bg-black/30 p-3 rounded-lg text-left break-words">
            {errorMessage}
          </p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#071d12] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-400 animate-spin" />
        <p className="text-white/80 text-sm font-medium">Signing you in with Google…</p>
      </div>
    </div>
  );
};

export default GoogleAuthSuccessPage;
