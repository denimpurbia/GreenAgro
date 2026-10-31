import { Router, Request, Response } from 'express';
import multer from 'multer';
import {
  requireAuth,
  optionalAuth,
  requireGovtAdmin,
  requirePermission,
  requireSuperAdmin,
  AuthenticatedRequest,
} from '../middleware/auth';
import { LakeService } from '../modules/lake/lakeService';
import { WatershedService } from '../modules/watershed/watershedService';
import { AravalliService } from '../modules/aravalli/aravalliService';
import { CommunityReportService } from '../modules/community/communityReportService';
import { MarketService, REGIONAL_MANDIS, OFFICIAL_MSP_2024_25 } from '../modules/market/marketService';
import { LandscapeService } from '../modules/landscape/landscapeService';
import { AlertService } from '../modules/alerts/alertService';
import { SchemeService } from '../modules/schemes/schemeService';
import { LocalKnowledgeService } from '../modules/knowledge/localKnowledgeService';
import { UserFarmService } from '../services/db/userFarmService';
import { UserModel } from '../models/User';
import { FarmModel } from '../models/Farm';
import { FarmTerrainModel } from '../models/FarmTerrain';
import { CommunityReportModel } from '../models/CommunityReport';
import { AlertModel } from '../models/Alert';
import { SoilObservationModel } from '../models/SoilObservation';
import { config } from '../config';

export const modulesRouter = Router();

// Configure memory storage for community report photo uploads (max 5MB, images only)
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are permitted.'));
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 0. Government / Organization Admin Portal Routes (Strictly Protected)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/gov/dashboard — Real DB-backed regional & administrative metrics
modulesRouter.get(
  '/gov/dashboard',
  requireAuth,
  requireGovtAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const canVerifyUsers = Boolean(req.user?.permissions?.includes('users:verify'));
      // 1. Registered Farmers & Farms from MongoDB
      const [
        totalFarmers,
        totalGovtUsers,
        pendingGovtCount,
        pendingGovtAccounts,
        allFarms,
        soilObservationsCount,
        pendingReportsCount,
        verifiedReportsCount,
        rejectedReportsCount,
        lakes,
        aravalli,
        landscape,
        terrainDocs,
      ] = await Promise.all([
        UserModel.countDocuments({ role: { $nin: ['govt_org', 'government'] } }),
        UserModel.countDocuments({ role: { $in: ['govt_org', 'government'] }, accountStatus: 'verified' }),
        UserModel.countDocuments({ role: { $in: ['govt_org', 'government'] }, accountStatus: 'pending' }),
        canVerifyUsers ? UserFarmService.listGovtAccounts('pending') : Promise.resolve([]),
        FarmModel.find().sort({ updatedAt: -1 }).limit(200).lean(),
        SoilObservationModel.countDocuments(),
        CommunityReportModel.countDocuments({ status: 'pending' }),
        CommunityReportModel.countDocuments({ status: 'verified' }),
        CommunityReportModel.countDocuments({ status: 'rejected' }),
        LakeService.getAllLakes(),
        AravalliService.getSummary(),
        LandscapeService.getLandscapeOverview(),
        FarmTerrainModel.find({
          dataset: 'Copernicus DEM GLO-90 (Open-Meteo Elevation)',
        }).lean(),
      ]);

      await AlertService.cleanupLegacySeeded();
      const recentAlerts = await AlertModel.find().sort({ createdAt: -1 }).limit(15).lean();
      const unreadAlertsCount = await AlertModel.countDocuments({ isRead: false });

      const totalFarmsCount = await FarmModel.countDocuments();
      const totalCultivatedAcres = Number(
        allFarms.reduce((sum, f) => sum + (Number(f.areaAcres) || 0), 0).toFixed(1)
      );

      // Aggregate farms by crop and location/state (real DB records only)
      const cropCounts: Record<string, number> = {};
      const locationCounts: Record<string, { farms: number; acres: number }> = {};

      for (const f of allFarms) {
        const crop = (f.primaryCrop || 'Unspecified').trim() || 'Unspecified';
        cropCounts[crop] = (cropCounts[crop] || 0) + 1;

        const loc = (f.locationName || f.state || 'Unspecified').trim() || 'Unspecified';
        if (!locationCounts[loc]) {
          locationCounts[loc] = { farms: 0, acres: 0 };
        }
        locationCounts[loc].farms += 1;
        locationCounts[loc].acres = Number((locationCounts[loc].acres + (Number(f.areaAcres) || 0)).toFixed(1));
      }

      const observedLakes = lakes.filter((l) => typeof l.healthScore === 'number');
      const avgLakeHealth =
        observedLakes.length > 0
          ? Math.round(observedLakes.reduce((s, l) => s + Number(l.healthScore), 0) / observedLakes.length)
          : null;

      // Watershed erosion indicators from real analyzed DEM records
      const avgSoilLoss =
        terrainDocs.length > 0
          ? Number(
              (
                terrainDocs.reduce((s, t) => s + (Number(t.rusleA) || 0), 0) / terrainDocs.length
              ).toFixed(1)
            )
          : null;
      const highErosionParcelsCount = terrainDocs.filter(
        (t) => t.erosionRisk === 'high' || t.erosionRisk === 'severe'
      ).length;

      return res.json({
        success: true,
        timestamp: new Date().toISOString(),
        metrics: {
          totalRegisteredFarmers: totalFarmers,
          totalVerifiedGovtAdmins: totalGovtUsers,
          pendingGovtVerificationsCount: pendingGovtCount,
          totalRegisteredFarms: totalFarmsCount,
          totalCultivatedAcres,
          totalSoilTestsRecorded: soilObservationsCount,
          totalMonitoredLakes: lakes.length,
          observedLakesCount: observedLakes.length,
          regionalLakeHealthScore: avgLakeHealth,
          lakeObservationStatus:
            observedLakes.length > 0
              ? 'available'
              : LakeService.isSatelliteConfigured()
                ? 'no_data_yet'
                : 'configuration_required',
          watershedAnalyzedParcels: terrainDocs.length,
          watershedAvgSoilLossThaYr: avgSoilLoss,
          watershedHighErosionParcels: highErosionParcelsCount,
          aravalliIntegrityScore: aravalli.score,
          aravalliDisturbedAreaHa: aravalli.disturbedAreaHa,
          aravalliLandCoverStatus: aravalli.landCoverStatus,
          activeFireAlerts7d: aravalli.fireAlerts7d,
          activeFireAlerts30d: aravalli.fireAlerts30d,
          firmsStatus: aravalli.firmsStatus,
          pendingCommunityReports: pendingReportsCount,
          verifiedCommunityReports: verifiedReportsCount,
          rejectedCommunityReports: rejectedReportsCount,
          totalCommunityReports: pendingReportsCount + verifiedReportsCount + rejectedReportsCount,
          regionalEnvironmentalAlertsCount: recentAlerts.length,
          unreadEnvironmentalAlertsCount: unreadAlertsCount,
          regionalLandscapeHealthScore: landscape.index.score,
          regionalLandscapeStatus: landscape.index.status,
        },
        providerConfiguration: {
          earthEngine: config.satelliteProvider === 'earth-engine' ? 'configured' : 'configuration_required',
          nasaFirms: config.firmsMapKey ? 'configured' : 'configuration_required',
          agmarknetDataGovIn: config.dataGovInApiKey ? 'configured' : 'configuration_required',
          openMeteoDem: 'configured',
        },
        regionalOverview: {
          cropDistribution: Object.entries(cropCounts).map(([crop, count]) => ({ crop, count })),
          locationDistribution: Object.entries(locationCounts).map(([location, stats]) => ({
            location,
            farms: stats.farms,
            acres: stats.acres,
          })),
          recentFarms: allFarms.slice(0, 20).map((f) => ({
            id: f._id,
            name: f.name,
            locationName: f.locationName,
            state: f.state,
            areaAcres: f.areaAcres,
            primaryCrop: f.primaryCrop,
            soilType: f.soilType,
            irrigationMethod: f.irrigationMethod,
            latitude: f.latitude,
            longitude: f.longitude,
          })),
        },
        pendingGovtAccounts,
        lakesSummary: lakes.map((l) => ({
          slug: l.slug,
          nameEn: l.nameEn,
          nameHi: l.nameHi,
          district: l.district,
          baselineAreaHa: l.baselineAreaHa,
          healthScore: l.healthScore,
          observationStatus: l.observationStatus,
        })),
        recentAlerts,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to load Government Admin Dashboard',
      });
    }
  }
);

// GET /api/gov/users/pending — List pending or all Government / Organization accounts
modulesRouter.get(
  '/gov/users/pending',
  requireAuth,
  requirePermission('users:verify'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const status = req.query.status as 'pending' | 'verified' | 'rejected' | 'suspended' | undefined;
      const accounts = await UserFarmService.listGovtAccounts(status);
      return res.json({
        success: true,
        count: accounts.length,
        accounts,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch Government / Organization accounts',
      });
    }
  }
);

// PUT /api/gov/users/:id/verify — Approve, reject, or suspend a Govt / Org account
modulesRouter.put(
  '/gov/users/:id/verify',
  requireAuth,
  requirePermission('users:verify'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { accountStatus, notes, reason } = req.body;

      if (!['verified', 'rejected', 'suspended'].includes(accountStatus)) {
        return res.status(400).json({
          success: false,
          error: 'accountStatus must be "verified", "rejected", or "suspended".',
        });
      }

      const updated = await UserFarmService.verifyGovtAccount(
        targetUserId,
        accountStatus,
        req.user?.email || req.user?.id || 'admin',
        reason || notes
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Target user account not found.',
        });
      }

      return res.json({
        success: true,
        user: updated,
        message: `Account status updated to "${accountStatus}".`,
      });
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code,
        error: err.message || 'Failed to update account verification status',
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 0B. Super Admin Account Verification & Audit Log Endpoints
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/verifications — List Govt / Org accounts by status + summary counts
modulesRouter.get(
  '/admin/verifications',
  requireAuth,
  requirePermission('users:verify'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const status = (req.query.status as 'pending' | 'verified' | 'rejected' | 'suspended' | 'all') || 'all';
      const search = (req.query.search as string) || '';

      const [accounts, pendingCount, verifiedCount, rejectedCount, suspendedCount, superAdminCount] =
        await Promise.all([
          UserFarmService.listGovtAccounts(status, search),
          UserModel.countDocuments({ role: { $in: ['govt_org', 'government'] }, accountStatus: 'pending' }),
          UserModel.countDocuments({ role: { $in: ['govt_org', 'government'] }, accountStatus: 'verified' }),
          UserModel.countDocuments({ role: { $in: ['govt_org', 'government'] }, accountStatus: 'rejected' }),
          UserModel.countDocuments({ role: { $in: ['govt_org', 'government'] }, accountStatus: 'suspended' }),
          UserModel.countDocuments({ isSuperAdmin: true }),
        ]);

      return res.json({
        success: true,
        count: accounts.length,
        summary: {
          pendingCount,
          verifiedCount,
          rejectedCount,
          suspendedCount,
          superAdminCount,
        },
        accounts,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to load verification requests',
      });
    }
  }
);

// GET /api/admin/verifications/:id — View single applicant details & audit trail
modulesRouter.get(
  '/admin/verifications/:id',
  requireAuth,
  requirePermission('users:verify'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const targetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const details = await UserFarmService.getGovtAccountDetails(targetId);
      if (!details) {
        return res.status(404).json({
          success: false,
          code: 'USER_NOT_FOUND',
          error: 'Applicant account not found.',
        });
      }
      return res.json({
        success: true,
        ...details,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to load applicant details',
      });
    }
  }
);

// PUT /api/admin/verifications/:id/approve — Approve a pending Govt / Org registration
modulesRouter.put(
  '/admin/verifications/:id/approve',
  requireAuth,
  requirePermission('users:verify'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { notes } = req.body;

      const result = await UserFarmService.approveGovtAccount({
        targetUserId,
        adminId: req.user?.id || 'admin',
        adminEmail: req.user?.email || 'admin',
        notes,
      });

      return res.json({
        success: true,
        user: result.user,
        notificationDelivery: result.notification,
        message: `Account "${result.user.email}" approved. The official can now sign in to the Government Admin Portal.`,
      });
    } catch (err: any) {
      return res.status(err.statusCode || 400).json({
        success: false,
        code: err.code || 'APPROVAL_ERROR',
        error: err.message || 'Failed to approve account',
      });
    }
  }
);

// PUT /api/admin/verifications/:id/reject — Reject a Govt / Org registration (reason required)
modulesRouter.put(
  '/admin/verifications/:id/reject',
  requireAuth,
  requirePermission('users:verify'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const reason = req.body.reason || req.body.rejectionReason || req.body.notes;

      const result = await UserFarmService.rejectGovtAccount({
        targetUserId,
        adminId: req.user?.id || 'admin',
        adminEmail: req.user?.email || 'admin',
        reason,
      });

      return res.json({
        success: true,
        user: result.user,
        notificationDelivery: result.notification,
        message: `Application for "${result.user.email}" rejected.`,
      });
    } catch (err: any) {
      return res.status(err.statusCode || 400).json({
        success: false,
        code: err.code || 'REJECTION_ERROR',
        error: err.message || 'Failed to reject account',
      });
    }
  }
);

// PUT /api/admin/accounts/:id/suspend — Suspend an account (Super Admin or users:suspend)
modulesRouter.put(
  '/admin/accounts/:id/suspend',
  requireAuth,
  requirePermission('users:verify'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const reason = req.body.reason || req.body.suspendedReason || req.body.notes;

      const result = await UserFarmService.suspendAccount({
        targetUserId,
        adminId: req.user?.id || 'admin',
        adminEmail: req.user?.email || 'admin',
        reason,
      });

      return res.json({
        success: true,
        user: result.user,
        notificationDelivery: result.notification,
        message: `Account "${result.user.email}" has been suspended.`,
      });
    } catch (err: any) {
      return res.status(err.statusCode || 400).json({
        success: false,
        code: err.code || 'SUSPENSION_ERROR',
        error: err.message || 'Failed to suspend account',
      });
    }
  }
);

// PUT /api/admin/accounts/:id/reactivate — Reactivate a suspended or rejected account
modulesRouter.put(
  '/admin/accounts/:id/reactivate',
  requireAuth,
  requirePermission('users:verify'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { notes } = req.body;

      const result = await UserFarmService.reactivateAccount({
        targetUserId,
        adminId: req.user?.id || 'admin',
        adminEmail: req.user?.email || 'admin',
        notes,
      });

      return res.json({
        success: true,
        user: result.user,
        notificationDelivery: result.notification,
        message: `Account "${result.user.email}" has been reactivated.`,
      });
    } catch (err: any) {
      return res.status(err.statusCode || 400).json({
        success: false,
        code: err.code || 'REACTIVATION_ERROR',
        error: err.message || 'Failed to reactivate account',
      });
    }
  }
);

// PUT /api/admin/accounts/:id/permissions — Delegate/revoke permissions (Strictly Super Admin)
modulesRouter.put(
  '/admin/accounts/:id/permissions',
  requireAuth,
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { customPermissions, notes } = req.body;

      if (!Array.isArray(customPermissions)) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_PERMISSIONS',
          error: 'customPermissions must be an array of permission strings.',
        });
      }

      const updated = await UserFarmService.updateAccountPermissions({
        targetUserId,
        customPermissions,
        adminId: req.user?.id || 'super_admin',
        adminEmail: req.user?.email || 'super_admin',
        notes,
      });

      return res.json({
        success: true,
        user: updated,
        message: `Administrative permissions updated for "${updated.email}".`,
      });
    } catch (err: any) {
      return res.status(err.statusCode || 400).json({
        success: false,
        code: err.code || 'PERMISSION_UPDATE_ERROR',
        error: err.message || 'Failed to update permissions',
      });
    }
  }
);

// GET /api/admin/audit-logs — View administrative audit trail
modulesRouter.get(
  '/admin/audit-logs',
  requireAuth,
  requirePermission('audit:read'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = parseInt((req.query.limit as string) || '100', 10) || 100;
      const action = (req.query.action as string) || 'all';
      const logs = await UserFarmService.getAuditLogs(limit, action);
      return res.json({
        success: true,
        count: logs.length,
        logs,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to load administrative audit logs',
      });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 1. Lake Monitor Routes (Government / Organization Admin Portal)
// ─────────────────────────────────────────────────────────────────────────────

modulesRouter.get(
  '/lakes',
  requireAuth,
  requireGovtAdmin,
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const lakes = await LakeService.getAllLakes();
      return res.json({
        success: true,
        count: lakes.length,
        satelliteConfigured: LakeService.isSatelliteConfigured(),
        lakes,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Failed to fetch lakes' });
    }
  }
);

modulesRouter.get(
  '/lakes/:slug',
  requireAuth,
  requireGovtAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
      const result = await LakeService.getLakeBySlug(slug);
      if (!result) {
        return res.status(404).json({ success: false, error: 'Lake not found' });
      }
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Failed to fetch lake details' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Watershed & Soil Erosion Defense Routes (Government / Organization Admin Portal)
// ─────────────────────────────────────────────────────────────────────────────

async function handleWatershedRequest(req: AuthenticatedRequest, res: Response) {
  try {
    let farmId = req.query.farmId as string;
    let lat = req.query.lat !== undefined ? parseFloat(req.query.lat as string) : undefined;
    let lng = req.query.lng !== undefined ? parseFloat(req.query.lng as string) : undefined;
    let soilType = req.query.soilType as string;
    const ownerId = req.user?.id || '';

    // If farmId is provided, look up that farm's coordinates
    if (farmId) {
      const targetFarm = await FarmModel.findById(farmId).lean();
      if (targetFarm) {
        lat = targetFarm.latitude;
        lng = targetFarm.longitude;
        soilType = targetFarm.soilType;
      }
    } else if (lat === undefined || lng === undefined || !isFinite(lat) || !isFinite(lng)) {
      // Check if the user has a farm or look up the most recently registered farm with coordinates
      const anyFarm = await FarmModel.findOne({
        latitude: { $ne: 0 },
        longitude: { $ne: 0 },
      })
        .sort({ updatedAt: -1 })
        .lean();

      if (anyFarm) {
        farmId = anyFarm._id.toString();
        lat = anyFarm.latitude;
        lng = anyFarm.longitude;
        soilType = anyFarm.soilType;
      }
    }

    const terrain = await WatershedService.getFarmTerrainAnalysis(
      farmId || 'default-watershed',
      ownerId,
      lat,
      lng,
      soilType
    );
    return res.json({ success: true, terrain });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch watershed analysis' });
  }
}

modulesRouter.get('/watershed', requireAuth, requireGovtAdmin, handleWatershedRequest);
modulesRouter.get('/watershed/me', requireAuth, requireGovtAdmin, handleWatershedRequest);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Aravalli Guard Routes (Government / Organization Admin Portal)
// ─────────────────────────────────────────────────────────────────────────────

async function handleAravalliSummary(_req: AuthenticatedRequest, res: Response) {
  try {
    const summary = await AravalliService.getSummary();
    return res.json({ success: true, ...summary, summary });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch Aravalli summary' });
  }
}

modulesRouter.get('/aravalli', requireAuth, requireGovtAdmin, handleAravalliSummary);
modulesRouter.get('/aravalli/summary', requireAuth, requireGovtAdmin, handleAravalliSummary);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Community Reporting System Routes
//    - Farmers: submit reports, view own reports (/reports/my), view public verified reports (/reports)
//    - Verified Govt / Org: moderate pending reports (/reports/moderation, /reports/:id/moderate)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/reports — Public verified reports (coordinates rounded to ~500m, identities hidden)
modulesRouter.get('/reports', async (req: Request, res: Response) => {
  try {
    const district = req.query.district as string;
    const reports = await CommunityReportService.getPublicVerifiedReports(district);
    return res.json({ success: true, count: reports.length, reports });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch public reports' });
  }
});

// GET /api/reports/my — Authenticated user's own submitted reports (with moderation status)
modulesRouter.get('/reports/my', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reports = await CommunityReportService.getMyReports(req.user!.id);
    return res.json({ success: true, count: reports.length, reports });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch your submitted reports' });
  }
});

// POST /api/reports — Submit a new citizen/farmer report
modulesRouter.post(
  '/reports',
  optionalAuth,
  upload.single('photo'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { category, description, lat, lng, district, isAnonymous } = req.body;

      if (!category || !description) {
        return res.status(400).json({ success: false, error: 'Category and description are required.' });
      }

      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);

      if (isNaN(parsedLat) || isNaN(parsedLng)) {
        return res.status(400).json({ success: false, error: 'Valid GPS coordinates (lat, lng) are required.' });
      }

      let photoUrl: string | undefined;
      if (req.file) {
        photoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      } else if (req.body.photoUrl) {
        photoUrl = req.body.photoUrl;
      }

      const result = await CommunityReportService.createReport({
        category,
        description,
        lat: parsedLat,
        lng: parsedLng,
        district: district || 'udaipur',
        photoUrl,
        isAnonymous: isAnonymous === 'true' || isAnonymous === true,
        reporterId: req.user?.id,
      });

      return res.status(201).json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Failed to submit report' });
    }
  }
);

// GET /api/reports/moderation — Government / Organization moderation queue ONLY
modulesRouter.get(
  '/reports/moderation',
  requireAuth,
  requirePermission('reports:moderate'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const statusFilter = req.query.status as string | undefined;
      const reports = await CommunityReportService.getAllReportsForModerator(statusFilter);
      return res.json({ success: true, count: reports.length, reports });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Failed to fetch moderation reports' });
    }
  }
);

// PUT /api/reports/:id/moderate — Verify or reject a report (Strictly Government / Organization moderators)
modulesRouter.put(
  '/reports/:id/moderate',
  requireAuth,
  requirePermission('reports:moderate'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, rejectionReason, notes } = req.body;
      if (status !== 'verified' && status !== 'rejected') {
        return res.status(400).json({ success: false, error: 'Status must be verified or rejected.' });
      }

      const reportId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const moderated = await CommunityReportService.moderateReport(
        reportId,
        status,
        req.user?.email || req.user?.id || 'moderator',
        rejectionReason || notes
      );

      if (!moderated) {
        return res.status(404).json({ success: false, error: 'Community report not found.' });
      }

      return res.json({ success: true, report: moderated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Failed to moderate report' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. Fair Market Access Routes (Shared: Farmers & Government Monitoring)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/market/prices — List real mandi prices + MSP + provider status
modulesRouter.get('/market/prices', async (req: Request, res: Response) => {
  try {
    const commodity = req.query.commodity as string;
    const district = req.query.district as string;
    const prices = await MarketService.getPrices(commodity, district);
    const hasKey = Boolean(config.dataGovInApiKey);

    return res.json({
      success: true,
      count: prices.length,
      prices,
      mandis: REGIONAL_MANDIS,
      mspRates: OFFICIAL_MSP_2024_25,
      providerStatus: prices.length > 0 ? 'available' : hasKey ? 'no_data_yet' : 'configuration_required',
      providerMessage:
        prices.length > 0
          ? 'Live / Official APMC Mandi Arrival Prices'
          : hasKey
            ? 'No live mandi arrival records returned for this filter today.'
            : 'Configure DATA_GOV_IN_API_KEY in apps/api/.env for live Agmarknet daily arrivals, or use the Government Admin Portal to publish verified APMC bulletin prices. Statutory GOI MSP rates (2024-25) are active below.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch market prices' });
  }
});

// POST /api/market/prices — Verified Govt/Org admin can publish official APMC bulletin price
modulesRouter.post(
  '/market/prices',
  requireAuth,
  requireGovtAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { mandiCode, commodity, modalPrice, minPrice, maxPrice, priceDate } = req.body;
      if (!mandiCode || !commodity || !modalPrice || !isFinite(Number(modalPrice))) {
        return res.status(400).json({
          success: false,
          error: 'mandiCode, commodity, and a valid modalPrice are required.',
        });
      }

      const saved = await MarketService.recordOfficialMandiPrice({
        mandiCode,
        commodity,
        modalPrice: Number(modalPrice),
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        priceDate,
        recordedByEmail: req.user?.email || 'govt_admin',
      });

      return res.status(201).json({
        success: true,
        price: saved,
        message: 'Official APMC mandi price bulletin published.',
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || 'Failed to publish mandi price' });
    }
  }
);

async function handleMarketCompare(req: Request, res: Response) {
  try {
    const commodity = (req.query.commodity as string) || 'Maize';
    const lat = parseFloat(req.query.lat as string) || 24.585;
    const lng = parseFloat(req.query.lng as string) || 73.712;
    const transportCostPerKm =
      parseFloat((req.query.transportRate as string) || (req.query.transportCostPerKm as string)) || 1.8;

    const ranked = await MarketService.getNetPriceComparison(commodity, lat, lng, transportCostPerKm);
    const advisory = await MarketService.getAdvisory(commodity);
    const hasKey = Boolean(config.dataGovInApiKey);

    return res.json({
      success: true,
      commodity,
      rankedMandis: ranked,
      advisory,
      mspRates: OFFICIAL_MSP_2024_25,
      mandis: REGIONAL_MANDIS,
      providerStatus: ranked.length > 0 ? 'available' : hasKey ? 'no_data_yet' : 'configuration_required',
      formulaExplanation: 'Net Price = Modal Mandi Price − Transport Cost (distance × rate) − APMC User Fee (1.6%)',
      formulaExplanationHi: 'शुद्ध भाव = मॉडल मंडी भाव − परिवहन खर्च (दूरी × दर) − मंडी शुल्क (1.6%)',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to calculate net prices' });
  }
}

modulesRouter.get('/market/compare', handleMarketCompare);
modulesRouter.get('/market/net-price', handleMarketCompare);

// ─────────────────────────────────────────────────────────────────────────────
// 6. Flagship Ridge-to-Lake Dashboard Route (Government / Organization Admin Portal)
// ─────────────────────────────────────────────────────────────────────────────

async function handleLandscapeOverview(_req: AuthenticatedRequest, res: Response) {
  try {
    const overview = await LandscapeService.getLandscapeOverview();
    return res.json({ success: true, ...overview, overview });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch landscape overview' });
  }
}

modulesRouter.get('/landscape', requireAuth, requireGovtAdmin, handleLandscapeOverview);
modulesRouter.get('/landscape/overview', requireAuth, requireGovtAdmin, handleLandscapeOverview);

// ─────────────────────────────────────────────────────────────────────────────
// 7. Unified Alerts Engine Routes (Government / Organization Admin Portal)
// ─────────────────────────────────────────────────────────────────────────────

modulesRouter.get(
  '/alerts',
  requireAuth,
  requireGovtAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const alerts = await AlertService.getUserAlerts(req.user?.id);
      return res.json({ success: true, count: alerts.length, alerts });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Failed to fetch alerts' });
    }
  }
);

modulesRouter.post(
  '/alerts',
  requireAuth,
  requireGovtAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { category, severity, title, titleHi, message, messageHi, actionLink } = req.body;
      if (!category || !severity || !title || !message) {
        return res.status(400).json({
          success: false,
          error: 'category, severity, title, and message are required.',
        });
      }
      const created = await AlertService.createAlert({
        category,
        severity,
        title,
        titleHi,
        message,
        messageHi,
        actionLink,
      });
      return res.status(201).json({ success: true, alert: created });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Failed to create alert' });
    }
  }
);

modulesRouter.put(
  '/alerts/read-all',
  requireAuth,
  requireGovtAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await AlertService.markAllAsRead(req.user?.id);
      return res.json({ success: true, message: 'All alerts marked as read' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Failed to mark all alerts read' });
    }
  }
);

modulesRouter.put(
  '/alerts/:id/read',
  requireAuth,
  requireGovtAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const alertId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await AlertService.markAsRead(alertId);
      return res.json({ success: true, alert: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Failed to update alert' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 8. Government Agricultural Schemes Routes
//    - GET /api/schemes: accessible to both Farmers (read-only) and Govt/Org
//    - POST /api/schemes & PUT /api/schemes/:code: strictly Govt/Org ('schemes:manage')
// ─────────────────────────────────────────────────────────────────────────────

modulesRouter.get('/schemes', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string;
    const schemes = await SchemeService.getAllSchemes(category);
    return res.json({ success: true, count: schemes.length, schemes });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch schemes' });
  }
});

modulesRouter.post(
  '/schemes',
  requireAuth,
  requirePermission('schemes:manage'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { code, nameEn, nameHi, category, descriptionEn, descriptionHi, benefitsEn, benefitsHi, eligibilityEn, eligibilityHi, officialUrl, isNational, state } = req.body;
      if (!code || !nameEn || !category || !descriptionEn || !benefitsEn || !eligibilityEn || !officialUrl) {
        return res.status(400).json({
          success: false,
          error: 'code, nameEn, category, descriptionEn, benefitsEn, eligibilityEn, and officialUrl are required.',
        });
      }
      const saved = await SchemeService.upsertScheme({
        code,
        nameEn,
        nameHi,
        category,
        descriptionEn,
        descriptionHi,
        benefitsEn,
        benefitsHi,
        eligibilityEn,
        eligibilityHi,
        officialUrl,
        isNational,
        state,
      });
      return res.status(201).json({ success: true, scheme: saved });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Failed to save scheme' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 9. Local Southern Rajasthan Knowledge Route
// ─────────────────────────────────────────────────────────────────────────────

async function handleLocalKnowledge(req: Request, res: Response) {
  try {
    const category = req.query.category as string;
    const practices = LocalKnowledgeService.getAllPractices(category);
    return res.json({ success: true, count: practices.length, practices });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch local practices' });
  }
}

modulesRouter.get('/knowledge/local', handleLocalKnowledge);
modulesRouter.get('/knowledge/rajasthan', handleLocalKnowledge);
