import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { SoilEngine } from '../services/soil/soilEngine';
import { RegenerativeEngine } from '../services/regenerative/regenerativeEngine';
import { GeminiService } from '../services/ai/geminiService';
import { WeatherService } from '../services/weather/weatherService';
import { SatelliteService } from '../services/satellite/satelliteService';
import { UserFarmService } from '../services/db/userFarmService';
import { UserModel } from '../models/User';
import {
  requireAuth,
  optionalAuth,
  AuthenticatedRequest,
} from '../middleware/auth';
import { SoilObservationModel } from '../models/SoilObservation';
import { DiseaseDiagnosisModel } from '../models/DiseaseDiagnosis';
import { AdvisoryMessageModel } from '../models/AdvisoryMessage';
import { KnowledgeService } from '../services/knowledge/knowledgeService';
import { config } from '../config';
import { isConnectedToDb } from '../database';
import { GoogleOAuthService } from '../services/google/googleOAuthService';

export const apiRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────────────────────
apiRouter.get('/health', (_req: Request, res: Response) => {
  let dbStatus: string;

  if (isConnectedToDb) {
    dbStatus = 'mongodb';
  } else if (config.useInMemoryDb) {
    dbStatus = 'in-memory (dev mode)';
  } else {
    dbStatus = 'unavailable';
  }

  res.json({
    status:
      isConnectedToDb || config.useInMemoryDb ? 'healthy' : 'degraded',
    platform: 'GreenAgro / AgriN Intelligence Network',
    environment: config.nodeEnv,
    database: dbStatus,
    timestamp: new Date().toISOString(),
    services: {
      gemini: GeminiService.isConfigured()
        ? 'configured'
        : 'not_configured',
      weather: 'open-meteo (live, free, no key required)',
      satellite:
        config.satelliteProvider === 'earth-engine'
          ? 'earth-engine'
          : 'not_configured',
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Authentication Routes
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/register
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  const {
    name,
    email,
    password,
    phone,
    role,
    location,
    organizationName,
    designation,
    state,
    district,
    organizationType,
    officialIdInfo,
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Name, email, and password are required.',
      code: 'MISSING_FIELDS',
    });
  }

  // Only allow the two official roles: 'farmer' or 'govt_org' (with 'government' normalized to 'govt_org')
  const requestedRole = role ? String(role).trim() : 'farmer';
  if (requestedRole !== 'farmer' && requestedRole !== 'govt_org' && requestedRole !== 'government') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid account role. Allowed roles are Farmer ("farmer") and Government / Organization ("govt_org").',
      code: 'INVALID_ROLE',
    });
  }

  const normalizedRole: 'farmer' | 'govt_org' =
    requestedRole === 'govt_org' || requestedRole === 'government' ? 'govt_org' : 'farmer';

  if (normalizedRole === 'govt_org') {
    if (!organizationName || !designation || !state || !district || !organizationType) {
      return res.status(400).json({
        status: 'error',
        message:
          'Government / Organization registration requires organizationName, designation, state, district, and organizationType.',
        code: 'MISSING_GOVT_FIELDS',
      });
    }
  }

  try {
    const existing = await UserFarmService.findUserByEmail(email);

    if (existing) {
      return res.status(409).json({
        status: 'error',
        message: 'An account with this email address already exists.',
        code: 'USER_EXISTS',
      });
    }

    const user = await UserFarmService.createUser({
      name,
      email,
      password,
      phone,
      role: normalizedRole,
      location,
      organizationName,
      designation,
      state,
      district,
      organizationType,
      officialIdInfo,
    });

    // If the account is pending verification (Government / Organization accounts not in SUPER_ADMIN_EMAILS),
    // do NOT issue an active session token; return pending_verification status clearly.
    if (user.accountStatus === 'pending') {
      return res.status(201).json({
        status: 'pending_verification',
        pendingVerification: true,
        accountStatus: 'pending',
        user,
        message:
          'Government / Organization account registered and submitted for administrator verification. You will be able to access the Government Admin Portal once verified.',
      });
    }

    const token = UserFarmService.signToken(user);

    return res.status(201).json({
      status: 'success',
      accountStatus: user.accountStatus,
      user,
      token,
      message: 'Account created successfully.',
    });
  } catch (err: any) {
    console.error('[Auth Register Error]:', err);

    return res.status(500).json({
      status: 'error',
      message: 'Failed to create account.',
      code: 'REGISTRATION_ERROR',
    });
  }
});

// POST /api/auth/login
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Email and password are required.',
      code: 'MISSING_CREDENTIALS',
    });
  }

  try {
    const userWithHash = await UserFarmService.findUserByEmail(email);

    if (!userWithHash) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    if (userWithHash.passwordHash) {
      const match = await bcrypt.compare(
        password,
        userWithHash.passwordHash
      );

      if (!match) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS',
        });
      }
    }

    const { passwordHash: _, ...cleanUser } = userWithHash;

    // Enforce verification & suspension status on login
    if (cleanUser.accountStatus === 'pending') {
      return res.status(403).json({
        status: 'error',
        code: 'ACCOUNT_PENDING_VERIFICATION',
        pendingVerification: true,
        accountStatus: 'pending',
        user: {
          id: cleanUser.id,
          name: cleanUser.name,
          email: cleanUser.email,
          role: cleanUser.role,
          accountStatus: 'pending',
          organizationName: cleanUser.organizationName,
          designation: cleanUser.designation,
          state: cleanUser.state,
          district: cleanUser.district,
          organizationType: cleanUser.organizationType,
          createdAt: cleanUser.createdAt,
        },
        message:
          'Your Government / Organization account is pending administrator verification. Access to the Government Admin Portal will be enabled once your credentials are verified.',
      });
    }

    if (cleanUser.accountStatus === 'rejected') {
      const reason = cleanUser.rejectionReason || cleanUser.verificationNotes || 'Credentials could not be verified.';
      return res.status(403).json({
        status: 'error',
        code: 'ACCOUNT_REJECTED',
        accountStatus: 'rejected',
        rejectionReason: reason,
        user: {
          id: cleanUser.id,
          name: cleanUser.name,
          email: cleanUser.email,
          role: cleanUser.role,
          accountStatus: 'rejected',
          organizationName: cleanUser.organizationName,
          rejectionReason: reason,
          verifiedAt: cleanUser.verifiedAt,
        },
        message: `Your Government / Organization account verification was declined: ${reason}`,
      });
    }

    if (cleanUser.accountStatus === 'suspended') {
      const reason = cleanUser.suspendedReason || cleanUser.verificationNotes || 'Administrative suspension.';
      return res.status(403).json({
        status: 'error',
        code: 'ACCOUNT_SUSPENDED',
        accountStatus: 'suspended',
        suspendedReason: reason,
        user: {
          id: cleanUser.id,
          name: cleanUser.name,
          email: cleanUser.email,
          role: cleanUser.role,
          accountStatus: 'suspended',
          organizationName: cleanUser.organizationName,
          suspendedReason: reason,
          suspendedAt: cleanUser.suspendedAt,
        },
        message: `Your account access has been suspended: ${reason}`,
      });
    }

    const token = UserFarmService.signToken(cleanUser);

    return res.json({
      status: 'success',
      user: cleanUser,
      token,
      message: 'Logged in successfully.',
    });
  } catch (err: any) {
    console.error('[Auth Login Error]:', err);

    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during authentication.',
      code: 'AUTH_ERROR',
    });
  }
});

// POST /api/auth/phone
apiRouter.post('/auth/phone', async (_req: Request, res: Response) => {
  return res.status(501).json({
    status: 'error',
    message:
      'Phone OTP authentication is not yet available. Please use email and password to sign in.',
    code: 'NOT_IMPLEMENTED',
  });
});

// GET /api/auth/me
// PUT /api/auth/profile
// Update authenticated user's profile
apiRouter.put(
  '/auth/profile',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required.',
          code: 'UNAUTHORIZED',
        });
      }

      // Security: Never allow self-modification of role, accountStatus, or permissions via profile update
      if (
        req.body.role !== undefined ||
        req.body.accountStatus !== undefined ||
        req.body.permissions !== undefined ||
        req.body.isSuperAdmin !== undefined ||
        req.body.customPermissions !== undefined ||
        req.body.verifiedBy !== undefined
      ) {
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: Role, verification status, and permissions cannot be modified through profile settings.',
          code: 'ROLE_CHANGE_FORBIDDEN',
        });
      }

      const {
        name,
        phone,
        location,
        language,
        preferences,
        avatarUrl,
        organizationName,
        designation,
        state,
        district,
        organizationType,
      } = req.body;

      const updateData: any = {};

      if (typeof name === 'string') {
        updateData.name = name.trim();
      }

      if (typeof phone === 'string') {
        updateData.phone = phone.trim();
      }

      if (typeof location === 'string') {
        updateData.location = location.trim();
      }

      if (language === 'en' || language === 'hi') {
        updateData.language = language;
      }

      if (typeof avatarUrl === 'string') {
        updateData.avatarUrl = avatarUrl;
      }

      if (req.user?.role === 'govt_org') {
        if (typeof organizationName === 'string') updateData.organizationName = organizationName.trim();
        if (typeof designation === 'string') updateData.designation = designation.trim();
        if (typeof state === 'string') updateData.state = state.trim();
        if (typeof district === 'string') updateData.district = district.trim();
        if (typeof organizationType === 'string') updateData.organizationType = organizationType.trim();
      }

      if (
        preferences &&
        typeof preferences === 'object'
      ) {
        updateData.preferences = {
          weatherAlerts: Boolean(
            preferences.weatherAlerts
          ),
          diseaseAlerts: Boolean(
            preferences.diseaseAlerts
          ),
          weeklyReports: Boolean(
            preferences.weeklyReports
          ),
          marketUpdates: Boolean(
            preferences.marketUpdates
          ),
        };
      }

      if (!isConnectedToDb) {
        return res.status(503).json({
          status: 'error',
          message:
            'Database is unavailable. Profile cannot be saved.',
          code: 'DATABASE_UNAVAILABLE',
        });
      }

      const updatedUser =
        await UserModel.findByIdAndUpdate(
          userId,
          { $set: updateData },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!updatedUser) {
        return res.status(404).json({
          status: 'error',
          message: 'User profile not found.',
          code: 'USER_NOT_FOUND',
        });
      }

      const cleanUser = UserFarmService.mapUserDocToCleanUser(updatedUser);

      return res.status(200).json({
        status: 'success',
        user: cleanUser,
        message: 'Profile updated successfully.',
      });
    } catch (err: any) {
      console.error(
        '[Auth Profile Update Error]:',
        err
      );

      return res.status(500).json({
        status: 'error',
        message: 'Failed to update profile.',
        code: 'PROFILE_UPDATE_ERROR',
      });
    }
  }
);

apiRouter.get(
  '/auth/me',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required.',
          code: 'UNAUTHORIZED',
        });
      }

      const user = await UserFarmService.findUserById(userId);

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User profile not found.',
          code: 'USER_NOT_FOUND',
        });
      }

      return res.status(200).json({
        status: 'success',
        user,
      });
    } catch (err: any) {
      console.error('[Auth Me Error]:', err);

      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve profile.',
        code: 'SERVER_ERROR',
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Google OAuth Routes
// GET /api/auth/google          → redirect to Google consent screen
// GET /api/auth/google/callback → exchange code, find/create user, issue JWT
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/auth/google
apiRouter.get('/auth/google', (_req: Request, res: Response) => {
  console.log('[Google OAuth] /auth/google called');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');

  if (!GoogleOAuthService.isConfigured()) {
    const frontendUrl = config.frontendUrl;
    return res.redirect(`${frontendUrl}/login?google_error=not_configured`);
  }

  const authUrl = GoogleOAuthService.getAuthorizationUrl();
  return res.redirect(authUrl);
});

// GET /api/auth/google/callback
apiRouter.get('/auth/google/callback', async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');

  // Forward callback from the Google-authorized Vercel host to the Render backend
  const reqHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
  if (reqHost.includes('greenagro-api.vercel.app')) {
    const qIdx = req.originalUrl.indexOf('?');
    const queryStr = qIdx >= 0 ? req.originalUrl.slice(qIdx) : '';
    return res.redirect(302, `https://greenagro-api-tmpp.onrender.com/api/auth/google/callback${queryStr}`);
  }

  const frontendUrl = config.frontendUrl;
  const errorRedirect = (reason: string) =>
    res.redirect(`${frontendUrl}/login?google_error=${encodeURIComponent(reason)}`);

  console.log('[Google OAuth] Callback received');
  console.log(`[Google OAuth] MongoDB connected: ${isConnectedToDb}`);

  const { code, state, error: oauthError } = req.query as Record<string, string>;

  if (oauthError) {
    console.warn('[Google OAuth] User cancelled or consent denied:', oauthError);
    return errorRedirect('cancelled');
  }

  if (!code || !state) {
    console.warn('[Google OAuth] Missing code or state in callback.');
    return errorRedirect('missing_code');
  }

  console.log('[Google OAuth] Authorization code received');

  if (!GoogleOAuthService.validateState(state)) {
    console.warn('[Google OAuth] Invalid or expired state — possible CSRF attempt.');
    return errorRedirect('invalid_state');
  }
  console.log('[Google OAuth] State validated');

  try {
    // Exchange code for Google identity (never logs code, client secret, or access token)
    const googleUser = await GoogleOAuthService.exchangeCodeForUser(code);
    console.log('[Google OAuth] Google token exchange successful');
    console.log('[Google OAuth] Google profile received');

    const cleanEmail = googleUser.email.toLowerCase().trim();
    console.log(`[Google OAuth] Verified email: ${cleanEmail}`);

    if (!isConnectedToDb && !config.useInMemoryDb) {
      console.error('[Google OAuth] Database disconnected when attempting user save.');
      return errorRedirect('db_error');
    }

    console.log('[Google OAuth] Looking for existing user');
    let existingDoc = await UserModel.findOne({ email: cleanEmail });

    let finalUser = existingDoc ? UserFarmService.mapUserDocToCleanUser(existingDoc) : null;

    if (existingDoc && finalUser) {
      console.log('[Google OAuth] Existing user found');
      let needsSave = false;
      if (!existingDoc.googleId) {
        existingDoc.googleId = googleUser.sub;
        needsSave = true;
      }
      if (googleUser.picture && (!existingDoc.avatarUrl || existingDoc.avatarUrl === '/images/farmer-hero.jpg')) {
        existingDoc.avatarUrl = googleUser.picture;
        needsSave = true;
      }
      if (needsSave) {
        await existingDoc.save();
        console.log('[Google OAuth] MongoDB user saved');
      }
      finalUser = UserFarmService.mapUserDocToCleanUser(existingDoc);
    } else {
      console.log('[Google OAuth] Creating new user');
      const newUser = new UserModel({
        name: googleUser.name?.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        googleId: googleUser.sub,
        phone: '',
        role: 'farmer',
        accountStatus: 'verified',
        location: '',
        language: 'en',
        avatarUrl: googleUser.picture || '/images/farmer-hero.jpg',
        preferences: {
          weatherAlerts: true,
          diseaseAlerts: true,
          weeklyReports: true,
          marketUpdates: false,
        },
      });
      await newUser.save();
      console.log('[Google OAuth] MongoDB user saved');

      finalUser = UserFarmService.mapUserDocToCleanUser(newUser);
    }

    if (finalUser.accountStatus === 'pending') {
      console.log('[Google OAuth] Account is pending administrator verification');
      return errorRedirect('pending_verification');
    }

    if (finalUser.accountStatus === 'rejected' || finalUser.accountStatus === 'suspended') {
      console.log('[Google OAuth] Account is rejected or suspended');
      return errorRedirect('account_suspended');
    }

    // Issue GreenAgro JWT using the exact same mechanism as email/password login
    const token = UserFarmService.signToken(finalUser);
    console.log('[Google OAuth] JWT created');

    // Redirect to frontend success handler
    console.log('[Google OAuth] Redirecting to frontend');
    return res.redirect(
      `${frontendUrl}/auth/google/success?token=${encodeURIComponent(token)}`
    );
  } catch (err: any) {
    console.error('[Google OAuth] Callback error:', err?.message || err);
    return errorRedirect('auth_failed');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Farm Management Routes
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/farms/me
apiRouter.get(
  '/farms/me',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      let farm = await UserFarmService.getFarmByOwnerId(
        req.user!.id
      );

      if (!farm) {
        farm = await UserFarmService.createFarm(req.user!.id, {
          name: 'GreenAgro Farm (Udaipur)',
          locationName: 'Udaipur, Rajasthan, India',
          state: 'Rajasthan',
          country: 'India',
          latitude: 24.5854,
          longitude: 73.7125,
          areaAcres: 4.5,
          primaryCrop: 'Wheat',
          cropVariety: 'Raj-4079',
          soilType: 'Loamy',
          irrigationMethod: 'Drip',
        });
      } else if (
        !farm.latitude ||
        !farm.longitude ||
        (Number(farm.latitude) === 0 && Number(farm.longitude) === 0)
      ) {
        const updated = await UserFarmService.updateFarm(req.user!.id, {
          latitude: 24.5854,
          longitude: 73.7125,
          locationName: farm.locationName || 'Udaipur, Rajasthan, India',
          state: farm.state || 'Rajasthan',
          country: farm.country || 'India',
          primaryCrop: farm.primaryCrop || 'Wheat',
          soilType: farm.soilType || 'Loamy',
          irrigationMethod: farm.irrigationMethod || 'Drip',
        });
        if (updated) {
          farm = updated;
        }
      }

      return res.json({
        status: 'success',
        farm: farm || null,
      });
    } catch (err: any) {
      console.error('[Farm Fetch Error]:', err);

      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch farm data.',
        code: 'FARM_FETCH_ERROR',
      });
    }
  }
);

// POST /api/farms
apiRouter.post(
  '/farms',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        name,
        locationName,
        state,
        country,
        latitude,
        longitude,
        areaAcres,
        primaryCrop,
        cropVariety,
        soilType,
        irrigationMethod,
        boundary,
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Farm name is required.',
          code: 'MISSING_FARM_NAME',
        });
      }

      const farm = await UserFarmService.createFarm(req.user!.id, {
        name,
        locationName,
        state,
        country,
        latitude: latitude ? Number(latitude) : 0,
        longitude: longitude ? Number(longitude) : 0,
        areaAcres: areaAcres ? Number(areaAcres) : 0,
        primaryCrop,
        cropVariety,
        soilType,
        irrigationMethod,
        boundary,
      });

      return res.status(201).json({
        status: 'success',
        farm,
        message: 'Farm created successfully.',
      });
    } catch (err: any) {
      console.error('[Farm Create Error]:', err);

      return res.status(500).json({
        status: 'error',
        message: 'Failed to create farm.',
        code: 'FARM_CREATE_ERROR',
      });
    }
  }
);

// PUT /api/farms/me
apiRouter.put(
  '/farms/me',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updated = await UserFarmService.updateFarm(
        req.user!.id,
        req.body
      );

      return res.json({
        status: 'success',
        farm: updated,
        message: 'Farm updated successfully.',
      });
    } catch (err: any) {
      console.error('[Farm Update Error]:', err);

      return res.status(500).json({
        status: 'error',
        message: 'Failed to update farm.',
        code: 'FARM_UPDATE_ERROR',
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Weather
// GET /api/weather?lat=XX&lon=YY&location=CityName
// ─────────────────────────────────────────────────────────────────────────────
apiRouter.get('/weather', async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  const locationName =
    (req.query.location as string) || 'Your Location';

  if (!isFinite(lat) || !isFinite(lon)) {
    return res.status(400).json({
      status: 'error',
      message: 'Valid lat and lon query parameters are required.',
      code: 'MISSING_COORDINATES',
    });
  }

  const result = await WeatherService.fetchWeather(
    lat,
    lon,
    locationName
  );

  if (result.status === 'error') {
    return res.status(502).json(result);
  }

  return res.json(result);
});

// ─────────────────────────────────────────────────────────────────────────────
// Satellite / NDVI
// GET /api/satellite?lat=XX&lon=YY
// ─────────────────────────────────────────────────────────────────────────────
apiRouter.get(
  '/satellite',
  async (req: Request, res: Response) => {
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (!isFinite(lat) || !isFinite(lon)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid lat and lon query parameters are required.',
        code: 'MISSING_COORDINATES',
      });
    }

    try {
      const result = await SatelliteService.fetchNDVI(lat, lon);

      // not_configured → 200 (frontend handles this state gracefully)
      // error → 200 (provider-level errors are returned as structured JSON)
      // success → 200
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('[Satellite Route Error]:', error);

      // If credentials are missing / not configured, return structured not_configured
      const errMsg = error?.message || String(error);
      const isCredentialsError =
        errMsg.includes('credentials') ||
        errMsg.includes('not found') ||
        errMsg.includes('EARTH_ENGINE') ||
        errMsg.includes('GOOGLE_APPLICATION');

      if (isCredentialsError) {
        return res.status(200).json({
          status: 'not_configured',
          message: errMsg,
          configurationRequired: [
            'Set EARTH_ENGINE_PROJECT to your Google Cloud Project ID.',
            'Set EARTH_ENGINE_CREDENTIALS_JSON to the full service account JSON string (Vercel production).',
          ],
        });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Satellite service encountered an unexpected error.',
        code: 'SATELLITE_SERVICE_ERROR',
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Soil analysis
// POST /api/soil
// ─────────────────────────────────────────────────────────────────────────────
apiRouter.post(
  '/soil',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      ph,
      nitrogen,
      phosphorus,
      potassium,
      organicCarbon,
      farmId,
    } = req.body;

    const inputs = {
      ph,
      nitrogen,
      phosphorus,
      potassium,
      organicCarbon,
    };

    for (const [key, val] of Object.entries(inputs)) {
      const num = Number(val);

      if (
        val === undefined ||
        val === null ||
        val === '' ||
        !isFinite(num)
      ) {
        return res.status(400).json({
          status: 'error',
          message: `Missing or invalid field: ${key}. All soil parameters are required.`,
          code: 'INVALID_INPUT',
        });
      }
    }

    try {
      const result = SoilEngine.calculate({
        ph: Number(ph),
        nitrogen: Number(nitrogen),
        phosphorus: Number(phosphorus),
        potassium: Number(potassium),
        organicCarbon: Number(organicCarbon),
      });

      let savedObservation: any = null;

      const userId = req.user?.id;

      if (userId && isConnectedToDb) {
        try {
          savedObservation =
            await SoilObservationModel.create({
              userId,
              farmId: farmId || '',
              ph: Number(ph),
              nitrogen: Number(nitrogen),
              phosphorus: Number(phosphorus),
              potassium: Number(potassium),
              organicCarbon: Number(organicCarbon),
              score: result.score,
              rating: result.rating,
              nutrients: result.nutrients,
              limitingFactor: result.limitingFactor,
              aiInsight: result.aiInsight,
              recommendations: result.recommendations,
            });
        } catch (dbErr) {
          console.error('[Soil Save DB Error]:', dbErr);
        }
      }

      return res.json({
        status: 'success',
        ...result,
        observationId: savedObservation?._id || undefined,
      });
    } catch (err: any) {
      console.error('[Soil Calculation Error]:', err);

      return res.status(500).json({
        status: 'error',
        message: 'Soil score calculation failed.',
        code: 'CALCULATION_ERROR',
      });
    }
  }
);

// GET /api/soil/latest
apiRouter.get(
  '/soil/latest',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!isConnectedToDb) {
        return res.json({
          status: 'success',
          observation: null,
        });
      }

      let observation =
        await SoilObservationModel.findOne({
          userId: req.user!.id,
        }).sort({ createdAt: -1 });

      if (!observation) {
        const baselineInputs = {
          ph: 7.1,
          nitrogen: 245,
          phosphorus: 22,
          potassium: 210,
          organicCarbon: 0.68,
        };
        const calc = SoilEngine.calculate(baselineInputs);
        observation = await SoilObservationModel.create({
          userId: req.user!.id,
          farmId: '',
          ...baselineInputs,
          score: calc.score,
          rating: calc.rating,
          nutrients: calc.nutrients,
          limitingFactor: calc.limitingFactor,
          aiInsight: calc.aiInsight,
          recommendations: calc.recommendations,
        });
      }

      return res.json({
        status: 'success',
        observation,
      });
    } catch (err: any) {
      console.error('[Soil Latest Error]:', err);

      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch latest soil test.',
        code: 'SOIL_FETCH_ERROR',
      });
    }
  }
);

// GET /api/soil/history
apiRouter.get(
  '/soil/history',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!isConnectedToDb) {
        return res.json({
          status: 'success',
          observations: [],
        });
      }

      const observations =
        await SoilObservationModel.find({
          userId: req.user!.id,
        })
          .sort({ createdAt: -1 })
          .limit(20);

      return res.json({
        status: 'success',
        observations,
      });
    } catch (err: any) {
      console.error('[Soil History Error]:', err);

      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch soil test history.',
        code: 'SOIL_HISTORY_ERROR',
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Regenerative farming plan
// POST /api/regenerative
// ─────────────────────────────────────────────────────────────────────────────
apiRouter.post(
  '/regenerative',
  (req: Request, res: Response) => {
    const {
      soilScore,
      irrigationType = 'Flood',
      hasDrip,
      cropRotationCycles = 1,
      ndvi,
      organicPracticeAdopted = false,
    } = req.body;

    if (
      soilScore === undefined ||
      soilScore === null ||
      !isFinite(Number(soilScore))
    ) {
      return res.status(400).json({
        status: 'error',
        message:
          'soilScore is required to generate a regenerative plan.',
        code: 'MISSING_INPUT',
      });
    }

    try {
      const plan = RegenerativeEngine.calculate({
        soilScore: Number(soilScore),
        irrigationType: String(irrigationType),
        hasDrip: Boolean(
          hasDrip ?? irrigationType === 'Drip'
        ),
        cropRotationCycles: Number(cropRotationCycles),
        ndvi:
          ndvi !== undefined &&
          ndvi !== null &&
          isFinite(Number(ndvi))
            ? Number(ndvi)
            : null,
        organicPracticeAdopted: Boolean(
          organicPracticeAdopted
        ),
      });

      return res.json({
        status: 'success',
        ...plan,
      });
    } catch (err: any) {
      console.error('[Regenerative Error]:', err);

      return res.status(500).json({
        status: 'error',
        message: 'Regenerative plan calculation failed.',
        code: 'CALCULATION_ERROR',
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Crop Disease Diagnosis
// POST /api/disease/diagnose
// ─────────────────────────────────────────────────────────────────────────────
apiRouter.post(
  '/disease/diagnose',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      cropName = 'crop',
      language = 'en',
      farmId,
    } = req.body;

    if (
      !imageBase64 ||
      typeof imageBase64 !== 'string'
    ) {
      return res.status(400).json({
        status: 'error',
        message:
          'imageBase64 is required for disease diagnosis.',
        code: 'MISSING_IMAGE',
      });
    }

    const ALLOWED_MIME_TYPES = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg',
      'image/heic',
      'image/heif',
    ];

    const normalizedMime = mimeType
      .trim()
      .toLowerCase();

    if (!ALLOWED_MIME_TYPES.includes(normalizedMime)) {
      return res.status(400).json({
        status: 'error',
        message: `Unsupported image format (${mimeType}). Supported formats: JPEG, PNG, WebP, HEIC.`,
        code: 'INVALID_MIME_TYPE',
      });
    }

    const MAX_BASE64_LENGTH = 14 * 1024 * 1024;

    if (imageBase64.length > MAX_BASE64_LENGTH) {
      return res.status(400).json({
        status: 'error',
        message:
          'Image size exceeds the maximum limit (10MB). Please upload a smaller or compressed image.',
        code: 'IMAGE_TOO_LARGE',
      });
    }

    const rawBase64 = imageBase64
      .replace(
        /^data:image\/[a-z]+;base64,/i,
        ''
      )
      .trim();

    if (rawBase64.length < 50) {
      return res.status(400).json({
        status: 'error',
        message:
          'Image data is too small or corrupted to be analyzed.',
        code: 'INVALID_IMAGE_DATA',
      });
    }

    const reply = await GeminiService.diagnoseCrop(
      rawBase64,
      normalizedMime,
      cropName,
      language
    );

    if (reply.status === 'success') {
      const userId = req.user?.id;

      if (userId && isConnectedToDb) {
        try {
          const persistedCrop =
            reply.cropIdentificationStatus ===
              'identified' &&
            reply.identifiedCrop
              ? reply.identifiedCrop
              : 'Unknown';

          await DiseaseDiagnosisModel.create({
            userId,
            farmId: farmId || '',
            crop: persistedCrop,
            diagnosis:
              reply.diagnosis ||
              reply.diseaseName,
            diseaseName:
              reply.diseaseName || 'Unknown',
            confidence:
              reply.confidence ||
              'Low Confidence',
            confidenceScore:
              reply.confidenceScore || 0,
            severity:
              reply.severity || 'none',
            symptoms:
              reply.symptoms ||
              reply.observedSymptoms ||
              [],
            observedSymptoms:
              reply.observedSymptoms || [],
            recommendedActions:
              reply.recommendedActions || [],
            prevention:
              reply.prevention || [],
            disclaimer: reply.disclaimer,
          });
        } catch (dbErr) {
          console.error(
            '[Disease Save DB Error]:',
            dbErr
          );
        }
      }
    }

    return res.json(reply);
  }
);

// GET /api/disease/history
apiRouter.get(
  '/disease/history',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!isConnectedToDb) {
        return res.json({
          status: 'success',
          history: [],
        });
      }

      const history =
        await DiseaseDiagnosisModel.find({
          userId: req.user!.id,
        })
          .sort({ createdAt: -1 })
          .limit(20);

      return res.json({
        status: 'success',
        history,
      });
    } catch (err: any) {
      console.error(
        '[Disease History Error]:',
        err
      );

      return res.status(500).json({
        status: 'error',
        message:
          'Failed to fetch disease diagnosis history.',
        code: 'DISEASE_HISTORY_ERROR',
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// BRICS Knowledge Exchange Routes
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/knowledge?country=India
apiRouter.get(
  '/knowledge',
  async (req: Request, res: Response) => {
    try {
      const country =
        typeof req.query.country === 'string'
          ? req.query.country
          : undefined;

      const practices =
        await KnowledgeService.getPractices(country);

      return res.json({
        status: 'success',
        practices,
      });
    } catch (err: any) {
      console.error(
        '[Knowledge Fetch Error]:',
        err
      );

      return res.status(500).json({
        status: 'error',
        message:
          'Failed to retrieve knowledge practices.',
        code: 'KNOWLEDGE_FETCH_ERROR',
      });
    }
  }
);

// POST /api/knowledge/:id/like
apiRouter.post(
  '/knowledge/:id/like',
  optionalAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const id = String(req.params.id);
      const userId = req.user?.id;

      const result =
        await KnowledgeService.likePractice(
          id,
          userId
        );

      if (!result.success) {
        return res.status(404).json({
          status: 'error',
          message: 'Practice not found.',
          code: 'PRACTICE_NOT_FOUND',
        });
      }

      return res.json({
        status: 'success',
        likes: result.likes,
        alreadyLiked: result.alreadyLiked,
      });
    } catch (err: any) {
      console.error(
        '[Knowledge Like Error]:',
        err
      );

      return res.status(500).json({
        status: 'error',
        message:
          'Failed to update like status.',
        code: 'LIKE_ERROR',
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// AI Assistant Chat
// POST /api/assistant/message
// ─────────────────────────────────────────────────────────────────────────────
apiRouter.post(
  '/assistant/message',
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const {
      message = '',
      language = 'en',
      farmContext,
      history,
      inputMode = 'text',
      imageBase64,
      imageMimeType,
    } = req.body;

    if (!message.trim() && !imageBase64) {
      return res.status(400).json({
        status: 'error',
        message: 'message field is required.',
        code: 'MISSING_MESSAGE',
      });
    }

    if (
      !farmContext ||
      typeof farmContext !== 'object'
    ) {
      return res.status(400).json({
        status: 'error',
        message:
          'farmContext object is required for personalized advisory.',
        code: 'MISSING_CONTEXT',
      });
    }

    try {
      const reply =
        await GeminiService.generateAdvisory(
          farmContext,
          message,
          language,
          typeof imageBase64 === 'string' ? imageBase64 : undefined,
          typeof imageMimeType === 'string' ? imageMimeType : undefined,
          Array.isArray(history) ? history : undefined
        );

      if (isConnectedToDb) {
        try {
          await AdvisoryMessageModel.create({
            userId: req.user!.id,
            farmId: farmContext?.farmId || '',
            role: 'user',
            content: message,
            language,
          });

          await AdvisoryMessageModel.create({
            userId: req.user!.id,
            farmId: farmContext?.farmId || '',
            role: 'assistant',
            content: reply,
            language,
            metadata: {
              farmName:
                farmContext?.farmName,
              crop: farmContext?.crop,
            },
          });
        } catch (dbErr) {
          console.error(
            '[Advisory Save DB Error]:',
            dbErr
          );
        }
      }

      return res.json({
        status: 'success',
        reply,
        language,
        inputMode,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error(
        '[Assistant Message Error]:',
        err
      );

      return res.status(500).json({
        status: 'error',
        message:
          'Failed to generate advisory response.',
        code: 'ASSISTANT_ERROR',
      });
    }
  }
);

// GET /api/assistant/history
apiRouter.get(
  '/assistant/history',
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!isConnectedToDb) {
        return res.json({
          status: 'success',
          messages: [],
        });
      }

      const history =
        await AdvisoryMessageModel.find({
          userId: req.user!.id,
        })
          .sort({ createdAt: 1 })
          .limit(50);

      return res.json({
        status: 'success',
        messages: history,
      });
    } catch (err: any) {
      console.error(
        '[Assistant History Error]:',
        err
      );

      return res.status(500).json({
        status: 'error',
        message:
          'Failed to fetch advisory chat history.',
        code: 'ADVISORY_HISTORY_ERROR',
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Legacy farm-scoped routes
// ─────────────────────────────────────────────────────────────────────────────

apiRouter.get(
  '/farms/:farmId/weather',
  async (req: Request, res: Response) => {
    const lat = parseFloat(
      req.query.lat as string
    );

    const lon = parseFloat(
      req.query.lon as string
    );

    if (!isFinite(lat) || !isFinite(lon)) {
      return res.status(400).json({
        status: 'error',
        message: 'lat and lon required.',
      });
    }

    const result =
      await WeatherService.fetchWeather(
        lat,
        lon
      );

    return res.json(result);
  }
);

apiRouter.get(
  '/farms/:farmId/satellite',
  async (req: Request, res: Response) => {
    const lat = parseFloat(
      req.query.lat as string
    );

    const lon = parseFloat(
      req.query.lon as string
    );

    const result =
      await SatelliteService.fetchNDVI(
        isFinite(lat) ? lat : 0,
        isFinite(lon) ? lon : 0
      );

    return res.json(result);
  }
);