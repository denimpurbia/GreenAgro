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
 * OAuth State Security
 *
 * In serverless environments (like Vercel), separate requests (e.g. /auth/google
 * and /auth/google/callback) run on different container instances.
 * An in-memory Map alone fails across container instances and cold starts, causing
 * intermittent "invalid_state" security check errors on the first attempt.
 *
 * To solve this reliably:
 * 1. State tokens are cryptographically signed with HMAC-SHA256 using a server secret.
 * 2. Token payload includes a secure random nonce and a creation timestamp.
 * 3. Token validity is checked against expiration (TTL: 15 minutes).
 * 4. Timing-safe comparison is used to prevent timing attacks.
 * 5. Consumed states are tracked locally to prevent replay within the same container.
 */
const STATE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// In-memory track of consumed states to prevent replay
const consumedStates = new Map<string, number>();

function getOAuthStateSecret(): string {
  return (
    config.jwtSecret ||
    config.googleClientSecret ||
    'agrin_saarthi_super_secure_jwt_secret_dev_key_2026'
  );
}

function cleanupConsumedStates(): void {
  const now = Date.now();
  for (const [s, ts] of consumedStates.entries()) {
    if (now - ts > STATE_TTL_MS) {
      consumedStates.delete(s);
    }
  }
}

export class GoogleOAuthService {
  /**
   * Check whether Google OAuth is fully configured.
   */
  public static isConfigured(): boolean {
    return Boolean(config.googleClientId && config.googleClientSecret);
  }

  /**
   * Generate a cryptographically signed state token.
   * Format: `${nonce}.${timestamp}.${hmacSignature}`
   * Works reliably across Vercel serverless instances and cold starts.
   */
  public static generateState(): string {
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const payload = `${nonce}.${timestamp}`;
    const secret = getOAuthStateSecret();
    const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return `${payload}.${hmac}`;
  }

  /**
   * Validate and consume a state token.
   * Works across distributed/serverless environments via HMAC signature & TTL check.
   * Returns true if valid and not expired; false otherwise.
   */
  public static validateState(state: string): boolean {
    if (!state || typeof state !== 'string') {
      return false;
    }

    // Opportunistically clean up consumed states if map grows
    if (consumedStates.size > 200) {
      cleanupConsumedStates();
    }

    // Check if this state was already consumed in this container instance
    if (consumedStates.has(state)) {
      console.warn('[Google OAuth] State token already consumed (replay detected).');
      return false;
    }

    const parts = state.split('.');
    if (parts.length === 3) {
      const [nonce, tsStr, signature] = parts;
      const timestamp = parseInt(tsStr, 10);
      if (isNaN(timestamp)) {
        console.warn('[Google OAuth] Invalid state timestamp format.');
        return false;
      }

      const now = Date.now();
      // Allow up to 60s future clock skew; reject if older than TTL
      if (timestamp > now + 60 * 1000) {
        console.warn('[Google OAuth] State timestamp is in the future.');
        return false;
      }
      if (now - timestamp > STATE_TTL_MS) {
        console.warn('[Google OAuth] State token expired.');
        return false;
      }

      const payload = `${nonce}.${tsStr}`;
      const secret = getOAuthStateSecret();
      const expectedHmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      if (signature.length === expectedHmac.length) {
        const sigBuf = Buffer.from(signature, 'hex');
        const expBuf = Buffer.from(expectedHmac, 'hex');
        if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
          consumedStates.set(state, Date.now());
          return true;
        }
      }

      console.warn('[Google OAuth] State HMAC signature mismatch.');
      return false;
    }

    return false;
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
