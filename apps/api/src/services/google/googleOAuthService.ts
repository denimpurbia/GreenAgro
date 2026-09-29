import { config } from '../../config';
import crypto from 'crypto';

export interface GoogleUserInfo {
  sub: string;        // Google subject ID (stable, unique)
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

/**
 * Secure, in-memory store for OAuth state tokens.
 * Each state is valid for 10 minutes.
 */
const stateStore = new Map<string, number>();
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Periodically clean up expired state tokens to prevent memory growth.
 */
setInterval(() => {
  const now = Date.now();
  for (const [state, ts] of stateStore.entries()) {
    if (now - ts > STATE_TTL_MS) {
      stateStore.delete(state);
    }
  }
}, 5 * 60 * 1000);

export class GoogleOAuthService {
  /**
   * Check whether Google OAuth is fully configured.
   */
  public static isConfigured(): boolean {
    return Boolean(config.googleClientId && config.googleClientSecret);
  }

  /**
   * Generate a cryptographically random state token and store it.
   * The state is used to prevent CSRF on the OAuth callback.
   */
  public static generateState(): string {
    const state = crypto.randomBytes(32).toString('hex');
    stateStore.set(state, Date.now());
    return state;
  }

  /**
   * Validate and consume a state token.
   * Returns true if valid and not expired; false otherwise.
   */
  public static validateState(state: string): boolean {
    const ts = stateStore.get(state);
    if (!ts) return false;
    stateStore.delete(state); // consume once
    return Date.now() - ts < STATE_TTL_MS;
  }

  /**
   * Build the Google authorization URL to redirect the user to.
   */
  public static getAuthorizationUrl(): string {
    const state = this.generateState();
    const params = new URLSearchParams({
      client_id: config.googleClientId,
      redirect_uri: config.googleRedirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'online',
      state,
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange an authorization code for tokens, then fetch the user's profile.
   * Never logs or exposes the code, access_token, or client_secret.
   */
  public static async exchangeCodeForUser(code: string): Promise<GoogleUserInfo> {
    // ── Step 1: Exchange code for tokens ──────────────────────────────────────
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        redirect_uri: config.googleRedirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      // Parse out user-safe description; never expose raw body in logs
      let safeMessage = 'Google token exchange failed.';
      try {
        const errJson = JSON.parse(errBody);
        if (errJson.error === 'redirect_uri_mismatch') {
          safeMessage = 'redirect_uri_mismatch: the redirect URI in the request does not match the one configured in Google Cloud Console.';
        } else if (errJson.error_description) {
          safeMessage = `Google OAuth error: ${errJson.error_description}`;
        }
      } catch { /* ignore parse error */ }
      console.error('[Google OAuth] Token exchange failed (status', tokenRes.status, '):', safeMessage);
      throw new Error(safeMessage);
    }

    const tokenData = await tokenRes.json() as any;
    const accessToken: string = tokenData.access_token;

    if (!accessToken) {
      throw new Error('Google did not return an access token.');
    }

    // ── Step 2: Fetch user profile from Google ─────────────────────────────────
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      throw new Error(`Failed to fetch Google user info (status ${userRes.status}).`);
    }

    const userInfo = await userRes.json() as GoogleUserInfo;

    // ── Step 3: Validate identity ──────────────────────────────────────────────
    if (!userInfo.email) {
      throw new Error('Google account did not return an email address.');
    }

    const isVerified = userInfo.email_verified === true || String(userInfo.email_verified) === 'true';
    if (!isVerified) {
      throw new Error('Google account email is not verified. Please verify your Google email first.');
    }

    return userInfo;
  }
}
