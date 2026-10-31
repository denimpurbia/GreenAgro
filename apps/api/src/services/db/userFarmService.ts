import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, IUser } from '../../models/User';
import { FarmModel, IFarm } from '../../models/Farm';
import { AuditLogModel, AuditActionType } from '../../models/AuditLog';
import { AlertModel } from '../../models/Alert';
import { isConnectedToDb } from '../../database';
import { config } from '../../config';

export type NormalizedRole = 'farmer' | 'govt_org';
export type AccountStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

export interface CleanUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: NormalizedRole;
  rawRole?: string;
  accountStatus: AccountStatus;
  isSuperAdmin: boolean;
  customPermissions: string[];
  organizationName?: string;
  designation?: string;
  state?: string;
  district?: string;
  organizationType?: string;
  officialIdInfo?: string;
  verificationNotes?: string;
  rejectionReason?: string;
  suspendedReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  suspendedBy?: string;
  suspendedAt?: string;
  createdAt?: string;
  permissions: string[];
  location: string;
  language: 'en' | 'hi';
  avatarUrl: string;
  preferences: {
    weatherAlerts: boolean;
    diseaseAlerts: boolean;
    weeklyReports: boolean;
    marketUpdates: boolean;
  };
}

export interface CleanFarm {
  id: string;
  ownerId: string;
  name: string;
  locationName: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  areaAcres: number;
  primaryCrop: string;
  cropVariety: string;
  sowingDate: string;
  growthStage: string;
  soilType: string;
  irrigationMethod: string;
  boundary: Array<{ lat: number; lng: number }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory Store
// Only active when USE_IN_MEMORY_DB=true.
// Starts completely empty — NO hardcoded users, NO demo data, NO fake accounts.
// Reaches here only in local dev when explicitly opted-in.
// When USE_IN_MEMORY_DB=false, the server refuses to start if Atlas is down
// (see database.ts), so these maps are never reached in production.
// ─────────────────────────────────────────────────────────────────────────────
const memoryUsers = new Map<string, CleanUser & { passwordHash: string }>();
const memoryFarms = new Map<string, CleanFarm>();

/**
 * Guard: throws if the server is running without a DB and NOT in dev in-memory mode.
 * This prevents auth from silently returning null/empty in degraded state.
 */
function requireDb(operation: string): void {
  if (!isConnectedToDb && !config.useInMemoryDb) {
    throw new Error(
      `Database unavailable. Cannot perform "${operation}". ` +
      'Check MongoDB Atlas connection and server startup logs.'
    );
  }
}

const FARMER_PERMISSIONS: string[] = [
  'farmer:read_own',
  'farmer:update_own',
  'farm:read_own',
  'farm:update_own',
  'reports:create',
  'reports:read_own',
  'market:read',
  'knowledge:read',
  'soil:read_own',
  'schemes:read',
];

const GOVT_ORG_VERIFIED_PERMISSIONS: string[] = [
  'government:dashboard',
  'lakes:read',
  'watershed:read',
  'aravalli:read',
  'reports:moderate',
  'landscape:read',
  'alerts:read',
  'schemes:manage',
  'schemes:read',
  'regional:read',
  'market:read',
  'knowledge:read',
  'reports:create',
];

const SUPER_ADMIN_PERMISSIONS: string[] = [
  'super_admin',
  'users:verify',
  'users:suspend',
  'users:permissions',
  'audit:read',
];

export const DELEGABLE_ADMIN_PERMISSIONS: string[] = [
  'users:verify',
  'audit:read',
];

export class UserFarmService {
  /**
   * Normalizes legacy or current role strings into the two platform roles:
   * - 'government' | 'govt_org' => 'govt_org'
   * - 'farmer' | 'expert' | 'agronomist' | 'researcher' | 'cooperative' => 'farmer'
   * Legacy 'expert' accounts retain full Farmer Portal access and never silently gain admin powers.
   */
  public static normalizeRole(rawRole?: string): NormalizedRole {
    if (rawRole === 'govt_org' || rawRole === 'government') {
      return 'govt_org';
    }
    return 'farmer';
  }

  public static resolveIsSuperAdmin(docIsSuperAdmin: boolean | undefined, email: string): boolean {
    if (docIsSuperAdmin === true) return true;
    return config.isSuperAdminEmail(email);
  }

  public static resolveAccountStatus(
    role: NormalizedRole,
    rawStatus: string | undefined,
    email: string,
    isSuperAdmin?: boolean
  ): AccountStatus {
    if (rawStatus === 'rejected' || rawStatus === 'suspended') {
      return rawStatus;
    }
    if (role === 'govt_org' && (isSuperAdmin || config.isSuperAdminEmail(email))) {
      return 'verified';
    }
    if (rawStatus === 'pending' || rawStatus === 'verified') {
      return rawStatus;
    }
    // For legacy accounts without accountStatus field in MongoDB:
    if (role === 'govt_org') {
      return 'pending';
    }
    return 'verified';
  }

  public static getPermissionsForUser(
    role: NormalizedRole,
    accountStatus: AccountStatus,
    isSuperAdmin = false,
    customPermissions: string[] = []
  ): string[] {
    if (accountStatus !== 'verified') {
      return [];
    }
    if (role === 'govt_org') {
      const perms = new Set<string>([
        ...GOVT_ORG_VERIFIED_PERMISSIONS,
        ...(Array.isArray(customPermissions) ? customPermissions : []),
      ]);
      if (isSuperAdmin) {
        for (const p of SUPER_ADMIN_PERMISSIONS) {
          perms.add(p);
        }
      }
      return Array.from(perms);
    }
    return [...FARMER_PERMISSIONS];
  }

  public static mapUserDocToCleanUser(doc: IUser): CleanUser {
    const normalizedRole = this.normalizeRole(doc.role);
    const isSuperAdmin = this.resolveIsSuperAdmin(doc.isSuperAdmin, doc.email);
    const accountStatus = this.resolveAccountStatus(normalizedRole, doc.accountStatus, doc.email, isSuperAdmin);
    const customPerms = Array.isArray(doc.customPermissions) ? doc.customPermissions : [];
    const permissions = this.getPermissionsForUser(normalizedRole, accountStatus, isSuperAdmin, customPerms);

    return {
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      phone: doc.phone || '',
      role: normalizedRole,
      rawRole: doc.role,
      accountStatus,
      isSuperAdmin,
      customPermissions: customPerms,
      organizationName: doc.organizationName || '',
      designation: doc.designation || '',
      state: doc.state || '',
      district: doc.district || '',
      organizationType: doc.organizationType || '',
      officialIdInfo: doc.officialIdInfo || '',
      verificationNotes: doc.verificationNotes || '',
      rejectionReason: doc.rejectionReason || '',
      suspendedReason: doc.suspendedReason || '',
      verifiedBy: doc.verifiedBy || '',
      verifiedAt: doc.verifiedAt ? doc.verifiedAt.toISOString() : undefined,
      suspendedBy: doc.suspendedBy || '',
      suspendedAt: doc.suspendedAt ? doc.suspendedAt.toISOString() : undefined,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : undefined,
      permissions,
      location: doc.location || '',
      language: doc.language || 'en',
      avatarUrl: doc.avatarUrl || '/images/farmer-hero.jpg',
      preferences: doc.preferences || {
        weatherAlerts: true,
        diseaseAlerts: true,
        weeklyReports: true,
        marketUpdates: false,
      },
    };
  }

  public static signToken(
    user: Pick<CleanUser, 'id' | 'email' | 'role'> & {
      accountStatus?: AccountStatus;
      isSuperAdmin?: boolean;
    }
  ): string {
    const normalizedRole = this.normalizeRole(user.role);
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: normalizedRole,
        accountStatus: user.accountStatus || 'verified',
        isSuperAdmin: Boolean(user.isSuperAdmin),
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  public static verifyToken(token: string): {
    id: string;
    email: string;
    role: NormalizedRole;
    accountStatus?: AccountStatus;
    isSuperAdmin?: boolean;
  } | null {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      if (!decoded || !decoded.id) return null;
      return {
        id: decoded.id,
        email: decoded.email,
        role: this.normalizeRole(decoded.role),
        accountStatus: decoded.accountStatus,
        isSuperAdmin: Boolean(decoded.isSuperAdmin),
      };
    } catch {
      return null;
    }
  }

  public static async recordAuditLog(params: {
    action: AuditActionType;
    targetUserId: string;
    targetUserEmail: string;
    targetUserName?: string;
    adminId: string;
    adminEmail: string;
    previousStatus?: string;
    newStatus?: string;
    reasonOrNotes?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    if (!isConnectedToDb) return;
    try {
      // Never store sensitive fields in metadata
      const safeMeta = { ...(params.metadata || {}) };
      delete safeMeta.password;
      delete safeMeta.token;
      delete safeMeta.secret;

      await AuditLogModel.create({
        action: params.action,
        targetUserId: params.targetUserId,
        targetUserEmail: params.targetUserEmail.toLowerCase().trim(),
        targetUserName: params.targetUserName || '',
        adminId: params.adminId,
        adminEmail: params.adminEmail,
        previousStatus: params.previousStatus || '',
        newStatus: params.newStatus || '',
        reasonOrNotes: params.reasonOrNotes || '',
        metadata: safeMeta,
      });
    } catch (err) {
      console.error('[AuditLog] Failed to record audit log:', err);
    }
  }

  public static async createStatusNotification(
    targetUserId: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    message: string
  ): Promise<{ inApp: 'recorded' | 'skipped'; email: 'not_configured' }> {
    if (isConnectedToDb) {
      try {
        await AlertModel.create({
          userId: targetUserId,
          category: 'scheme',
          severity,
          title,
          titleHi: title,
          message,
          messageHi: message,
          actionLink: '/app/gov',
          isRead: false,
        });
        return { inApp: 'recorded', email: 'not_configured' };
      } catch {
        // Ignore alert creation failure
      }
    }
    return { inApp: 'skipped', email: 'not_configured' };
  }

  public static async findUserByEmail(email: string): Promise<(CleanUser & { passwordHash?: string }) | null> {
    requireDb('findUserByEmail');
    const cleanEmail = email.toLowerCase().trim();

    if (isConnectedToDb) {
      try {
        const found = await UserModel.findOne({ email: cleanEmail }).select('+password');
        if (found) {
          const clean = this.mapUserDocToCleanUser(found);
          return {
            ...clean,
            passwordHash: found.password,
          };
        }
        return null;
      } catch (err) {
        console.error('MongoDB findUserByEmail error:', err);
        throw err;
      }
    }

    // USE_IN_MEMORY_DB=true path (local dev only)
    const memUser = memoryUsers.get(cleanEmail);
    return memUser ? { ...memUser } : null;
  }

  public static async findUserById(id: string): Promise<CleanUser | null> {
    requireDb('findUserById');

    if (isConnectedToDb) {
      try {
        const found = await UserModel.findById(id);
        if (found) {
          return this.mapUserDocToCleanUser(found);
        }
        return null;
      } catch (err) {
        console.error('MongoDB findUserById error:', err);
        throw err;
      }
    }

    // USE_IN_MEMORY_DB=true path (local dev only)
    for (const u of memoryUsers.values()) {
      if (u.id === id) {
        const { passwordHash: _, ...rest } = u;
        return rest;
      }
    }
    return null;
  }

  /**
   * Public account creation:
   * - Never grants Super Admin from public registration.
   * - All public Govt / Org registrations start in 'pending' status and require Super Admin approval.
   */
  public static async createUser(data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role?: 'farmer' | 'govt_org' | 'government';
    location?: string;
    organizationName?: string;
    designation?: string;
    state?: string;
    district?: string;
    organizationType?: string;
    officialIdInfo?: string;
  }): Promise<CleanUser> {
    requireDb('createUser');
    const cleanEmail = data.email.toLowerCase().trim();
    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : '';
    const normalizedRole = this.normalizeRole(data.role);

    // Public Govt / Org registrations ALWAYS start as 'pending' and isSuperAdmin = false
    const initialStatus: AccountStatus = normalizedRole === 'govt_org' ? 'pending' : 'verified';

    const effectiveLocation =
      data.location?.trim() ||
      (data.district && data.state ? `${data.district.trim()}, ${data.state.trim()}` : data.state?.trim() || '');

    if (isConnectedToDb) {
      try {
        const userDoc = new UserModel({
          name: data.name.trim(),
          email: cleanEmail,
          password: passwordHash,
          phone: data.phone?.trim() || '',
          role: normalizedRole,
          accountStatus: initialStatus,
          isSuperAdmin: false,
          customPermissions: [],
          organizationName: data.organizationName?.trim() || '',
          designation: data.designation?.trim() || '',
          state: data.state?.trim() || '',
          district: data.district?.trim() || '',
          organizationType: data.organizationType?.trim() || '',
          officialIdInfo: data.officialIdInfo?.trim() || '',
          location: effectiveLocation,
          language: 'en',
          avatarUrl: '/images/farmer-hero.jpg',
          preferences: {
            weatherAlerts: true,
            diseaseAlerts: true,
            weeklyReports: true,
            marketUpdates: false,
          },
        });
        await userDoc.save();

        return this.mapUserDocToCleanUser(userDoc);
      } catch (err: any) {
        console.error('MongoDB createUser error:', err);
        throw err;
      }
    }

    // USE_IN_MEMORY_DB=true path (local dev only — empty store, no demo data)
    const id = `usr-${Date.now()}`;
    const permissions = this.getPermissionsForUser(normalizedRole, initialStatus, false, []);
    const cleanUser: CleanUser = {
      id,
      name: data.name.trim(),
      email: cleanEmail,
      phone: data.phone?.trim() || '',
      role: normalizedRole,
      rawRole: normalizedRole,
      accountStatus: initialStatus,
      isSuperAdmin: false,
      customPermissions: [],
      organizationName: data.organizationName?.trim() || '',
      designation: data.designation?.trim() || '',
      state: data.state?.trim() || '',
      district: data.district?.trim() || '',
      organizationType: data.organizationType?.trim() || '',
      officialIdInfo: data.officialIdInfo?.trim() || '',
      createdAt: new Date().toISOString(),
      permissions,
      location: effectiveLocation,
      language: 'en',
      avatarUrl: '/images/farmer-hero.jpg',
      preferences: {
        weatherAlerts: true,
        diseaseAlerts: true,
        weeklyReports: true,
        marketUpdates: false,
      },
    };

    memoryUsers.set(cleanEmail, { ...cleanUser, passwordHash });
    return cleanUser;
  }

  /**
   * Idempotent server-side / CLI bootstrap for the First Super Admin.
   * Preserves existing user ID, password hash, profile, and farm records when promoting an existing user.
   */
  public static async bootstrapSuperAdmin(params: {
    email: string;
    password?: string;
    name?: string;
    organizationName?: string;
    designation?: string;
    state?: string;
    district?: string;
    organizationType?: string;
    provisionedBy?: string;
    notes?: string;
  }): Promise<{ user: CleanUser; alreadySuperAdmin: boolean; createdNew: boolean }> {
    requireDb('bootstrapSuperAdmin');
    const cleanEmail = params.email.toLowerCase().trim();
    const provisionedBy = params.provisionedBy || 'SYSTEM_BOOTSTRAP_CLI';
    const notes = params.notes || 'Provisioned as Platform Super Administrator via server-side bootstrap';

    if (isConnectedToDb) {
      let existing = await UserModel.findOne({ email: cleanEmail }).select('+officialIdInfo');

      if (existing) {
        const wasAlreadySuper = Boolean(existing.isSuperAdmin && existing.accountStatus === 'verified' && existing.role === 'govt_org');
        const prevStatus = existing.accountStatus || 'pending';

        existing.role = 'govt_org';
        existing.accountStatus = 'verified';
        existing.isSuperAdmin = true;
        existing.verifiedBy = existing.verifiedBy || provisionedBy;
        existing.verifiedAt = existing.verifiedAt || new Date();
        existing.verificationNotes = existing.verificationNotes || notes;
        existing.rejectionReason = '';
        existing.suspendedReason = '';
        if (params.organizationName && !existing.organizationName) {
          existing.organizationName = params.organizationName;
        }
        if (params.designation && !existing.designation) {
          existing.designation = params.designation;
        }
        if (params.state && !existing.state) {
          existing.state = params.state;
        }
        if (params.district && !existing.district) {
          existing.district = params.district;
        }
        if (params.organizationType && !existing.organizationType) {
          existing.organizationType = params.organizationType;
        }

        await existing.save();

        if (!wasAlreadySuper) {
          await this.recordAuditLog({
            action: 'SUPER_ADMIN_BOOTSTRAP',
            targetUserId: existing._id.toString(),
            targetUserEmail: existing.email,
            targetUserName: existing.name,
            adminId: provisionedBy,
            adminEmail: provisionedBy,
            previousStatus: prevStatus,
            newStatus: 'verified (super_admin)',
            reasonOrNotes: notes,
            metadata: {
              organizationName: existing.organizationName,
              designation: existing.designation,
              mode: 'promoted_existing_account',
            },
          });
        }

        return {
          user: this.mapUserDocToCleanUser(existing),
          alreadySuperAdmin: wasAlreadySuper,
          createdNew: false,
        };
      }

      if (!params.password) {
        throw new Error(
          `No existing account found for "${cleanEmail}". Either register the Government / Organization account first or supply --password to create a new Super Admin account.`
        );
      }

      const passwordHash = await bcrypt.hash(params.password, 10);
      const created = await UserModel.create({
        name: (params.name || 'Platform Super Administrator').trim(),
        email: cleanEmail,
        password: passwordHash,
        role: 'govt_org',
        accountStatus: 'verified',
        isSuperAdmin: true,
        customPermissions: [],
        organizationName: (params.organizationName || 'Rajasthan Agriculture & Watershed Administration').trim(),
        designation: (params.designation || 'State Nodal Super Administrator').trim(),
        state: (params.state || 'Rajasthan').trim(),
        district: (params.district || 'Udaipur').trim(),
        organizationType: (params.organizationType || 'Agriculture Department').trim(),
        verifiedBy: provisionedBy,
        verifiedAt: new Date(),
        verificationNotes: notes,
        location: `${params.district || 'Udaipur'}, ${params.state || 'Rajasthan'}`,
        language: 'en',
        avatarUrl: '/images/farmer-hero.jpg',
      });

      await this.recordAuditLog({
        action: 'SUPER_ADMIN_BOOTSTRAP',
        targetUserId: created._id.toString(),
        targetUserEmail: created.email,
        targetUserName: created.name,
        adminId: provisionedBy,
        adminEmail: provisionedBy,
        previousStatus: 'none',
        newStatus: 'verified (super_admin)',
        reasonOrNotes: notes,
        metadata: {
          organizationName: created.organizationName,
          designation: created.designation,
          mode: 'created_new_account',
        },
      });

      return {
        user: this.mapUserDocToCleanUser(created),
        alreadySuperAdmin: false,
        createdNew: true,
      };
    }

    throw new Error('Database connection required for Super Admin bootstrap.');
  }

  public static async approveGovtAccount(params: {
    targetUserId: string;
    adminId: string;
    adminEmail: string;
    notes?: string;
  }): Promise<{
    user: CleanUser;
    notification: { inApp: 'recorded' | 'skipped'; email: 'not_configured' };
  }> {
    requireDb('approveGovtAccount');

    const target = await UserModel.findById(params.targetUserId).select('+officialIdInfo');
    if (!target) {
      const err: any = new Error('Applicant account not found.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    const normalizedRole = this.normalizeRole(target.role);
    if (normalizedRole !== 'govt_org') {
      const err: any = new Error('Only Government / Organization accounts require verification approval.');
      err.statusCode = 400;
      err.code = 'INVALID_TARGET_ROLE';
      throw err;
    }

    if (target.accountStatus === 'verified') {
      const err: any = new Error('Applicant account is already verified and approved.');
      err.statusCode = 400;
      err.code = 'ALREADY_VERIFIED';
      throw err;
    }

    if (target.accountStatus === 'suspended') {
      const err: any = new Error('Account is currently suspended. Use the reactivate endpoint to restore access.');
      err.statusCode = 400;
      err.code = 'ACCOUNT_SUSPENDED_USE_REACTIVATE';
      throw err;
    }

    const previousStatus = target.accountStatus || 'pending';
    const cleanNotes = params.notes?.trim() || 'Credentials verified and approved by Super Administrator.';

    target.role = 'govt_org';
    target.accountStatus = 'verified';
    target.verifiedBy = params.adminEmail || params.adminId;
    target.verifiedAt = new Date();
    target.verificationNotes = cleanNotes;
    target.rejectionReason = '';
    await target.save();

    await this.recordAuditLog({
      action: 'GOVT_ACCOUNT_APPROVED',
      targetUserId: target._id.toString(),
      targetUserEmail: target.email,
      targetUserName: target.name,
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      previousStatus,
      newStatus: 'verified',
      reasonOrNotes: cleanNotes,
      metadata: {
        organizationName: target.organizationName,
        designation: target.designation,
        district: target.district,
      },
    });

    const notification = await this.createStatusNotification(
      target._id.toString(),
      'low',
      'Government / Organization Account Approved',
      `Your Government / Organization account (${target.organizationName || target.email}) has been verified. You now have access to the Government Admin Portal.`
    );

    return {
      user: this.mapUserDocToCleanUser(target),
      notification,
    };
  }

  public static async rejectGovtAccount(params: {
    targetUserId: string;
    adminId: string;
    adminEmail: string;
    reason: string;
  }): Promise<{
    user: CleanUser;
    notification: { inApp: 'recorded' | 'skipped'; email: 'not_configured' };
  }> {
    requireDb('rejectGovtAccount');

    const cleanReason = params.reason?.trim();
    if (!cleanReason) {
      const err: any = new Error('A rejection reason is required when rejecting an application.');
      err.statusCode = 400;
      err.code = 'REASON_REQUIRED';
      throw err;
    }

    const target = await UserModel.findById(params.targetUserId).select('+officialIdInfo');
    if (!target) {
      const err: any = new Error('Applicant account not found.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    if (this.resolveIsSuperAdmin(target.isSuperAdmin, target.email)) {
      const err: any = new Error('Cannot reject a Super Administrator account.');
      err.statusCode = 403;
      err.code = 'CANNOT_MODIFY_SUPER_ADMIN';
      throw err;
    }

    const previousStatus = target.accountStatus || 'pending';
    target.accountStatus = 'rejected';
    target.rejectionReason = cleanReason;
    target.verificationNotes = cleanReason;
    target.verifiedBy = params.adminEmail || params.adminId;
    target.verifiedAt = new Date();
    await target.save();

    await this.recordAuditLog({
      action: 'GOVT_ACCOUNT_REJECTED',
      targetUserId: target._id.toString(),
      targetUserEmail: target.email,
      targetUserName: target.name,
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      previousStatus,
      newStatus: 'rejected',
      reasonOrNotes: cleanReason,
      metadata: {
        organizationName: target.organizationName,
        designation: target.designation,
      },
    });

    const notification = await this.createStatusNotification(
      target._id.toString(),
      'high',
      'Government / Organization Account Verification Declined',
      `Your Government / Organization application could not be verified. Reason: ${cleanReason}`
    );

    return {
      user: this.mapUserDocToCleanUser(target),
      notification,
    };
  }

  public static async suspendAccount(params: {
    targetUserId: string;
    adminId: string;
    adminEmail: string;
    reason: string;
  }): Promise<{
    user: CleanUser;
    notification: { inApp: 'recorded' | 'skipped'; email: 'not_configured' };
  }> {
    requireDb('suspendAccount');

    const cleanReason = params.reason?.trim();
    if (!cleanReason) {
      const err: any = new Error('A suspension reason is required.');
      err.statusCode = 400;
      err.code = 'REASON_REQUIRED';
      throw err;
    }

    if (params.targetUserId === params.adminId) {
      const err: any = new Error('You cannot suspend your own administrator account.');
      err.statusCode = 400;
      err.code = 'CANNOT_SUSPEND_SELF';
      throw err;
    }

    const target = await UserModel.findById(params.targetUserId).select('+officialIdInfo');
    if (!target) {
      const err: any = new Error('Target account not found.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    if (this.resolveIsSuperAdmin(target.isSuperAdmin, target.email)) {
      const err: any = new Error('Cannot suspend a Super Administrator account.');
      err.statusCode = 403;
      err.code = 'CANNOT_MODIFY_SUPER_ADMIN';
      throw err;
    }

    const previousStatus = target.accountStatus || 'verified';
    target.accountStatus = 'suspended';
    target.suspendedReason = cleanReason;
    target.verificationNotes = cleanReason;
    target.suspendedBy = params.adminEmail || params.adminId;
    target.suspendedAt = new Date();
    await target.save();

    await this.recordAuditLog({
      action: 'ACCOUNT_SUSPENDED',
      targetUserId: target._id.toString(),
      targetUserEmail: target.email,
      targetUserName: target.name,
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      previousStatus,
      newStatus: 'suspended',
      reasonOrNotes: cleanReason,
      metadata: {
        organizationName: target.organizationName,
      },
    });

    const notification = await this.createStatusNotification(
      target._id.toString(),
      'critical',
      'Account Administrative Access Suspended',
      `Your account access has been suspended by an administrator. Reason: ${cleanReason}`
    );

    return {
      user: this.mapUserDocToCleanUser(target),
      notification,
    };
  }

  public static async reactivateAccount(params: {
    targetUserId: string;
    adminId: string;
    adminEmail: string;
    notes?: string;
  }): Promise<{
    user: CleanUser;
    notification: { inApp: 'recorded' | 'skipped'; email: 'not_configured' };
  }> {
    requireDb('reactivateAccount');

    const target = await UserModel.findById(params.targetUserId).select('+officialIdInfo');
    if (!target) {
      const err: any = new Error('Target account not found.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    const previousStatus = target.accountStatus || 'suspended';
    const cleanNotes = params.notes?.trim() || 'Account reactivated and verified by Super Administrator.';

    target.accountStatus = 'verified';
    target.suspendedReason = '';
    target.rejectionReason = '';
    target.verificationNotes = cleanNotes;
    target.verifiedBy = params.adminEmail || params.adminId;
    target.verifiedAt = new Date();
    await target.save();

    await this.recordAuditLog({
      action: 'ACCOUNT_REACTIVATED',
      targetUserId: target._id.toString(),
      targetUserEmail: target.email,
      targetUserName: target.name,
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      previousStatus,
      newStatus: 'verified',
      reasonOrNotes: cleanNotes,
    });

    const notification = await this.createStatusNotification(
      target._id.toString(),
      'low',
      'Account Access Reactivated',
      `Your account has been reactivated by an administrator. You may now sign in.`
    );

    return {
      user: this.mapUserDocToCleanUser(target),
      notification,
    };
  }

  public static async updateAccountPermissions(params: {
    targetUserId: string;
    customPermissions: string[];
    adminId: string;
    adminEmail: string;
    notes?: string;
  }): Promise<CleanUser> {
    requireDb('updateAccountPermissions');

    const target = await UserModel.findById(params.targetUserId).select('+officialIdInfo');
    if (!target) {
      const err: any = new Error('Target account not found.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    const sanitizedPerms = (params.customPermissions || []).filter((p) =>
      DELEGABLE_ADMIN_PERMISSIONS.includes(p)
    );

    const prevPerms = Array.isArray(target.customPermissions) ? [...target.customPermissions] : [];
    target.customPermissions = sanitizedPerms;
    await target.save();

    await this.recordAuditLog({
      action: 'PERMISSIONS_UPDATED',
      targetUserId: target._id.toString(),
      targetUserEmail: target.email,
      targetUserName: target.name,
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      previousStatus: prevPerms.join(', ') || 'standard',
      newStatus: sanitizedPerms.join(', ') || 'standard',
      reasonOrNotes: params.notes || 'Updated delegated administrative permissions',
    });

    return this.mapUserDocToCleanUser(target);
  }

  public static async verifyGovtAccount(
    targetUserId: string,
    decision: 'verified' | 'rejected' | 'suspended',
    verifierEmailOrId: string,
    notes?: string
  ): Promise<CleanUser | null> {
    requireDb('verifyGovtAccount');

    if (isConnectedToDb) {
      const existing = await UserModel.findById(targetUserId).select('+officialIdInfo');
      if (!existing) return null;

      if (decision === 'verified') {
        if (existing.accountStatus === 'suspended' || existing.accountStatus === 'rejected') {
          const res = await this.reactivateAccount({
            targetUserId,
            adminId: verifierEmailOrId,
            adminEmail: verifierEmailOrId,
            notes,
          });
          return res.user;
        }
        if (existing.accountStatus === 'verified') {
          return this.mapUserDocToCleanUser(existing);
        }
        const res = await this.approveGovtAccount({
          targetUserId,
          adminId: verifierEmailOrId,
          adminEmail: verifierEmailOrId,
          notes,
        });
        return res.user;
      }

      if (decision === 'rejected') {
        const res = await this.rejectGovtAccount({
          targetUserId,
          adminId: verifierEmailOrId,
          adminEmail: verifierEmailOrId,
          reason: notes || 'Application declined during credential verification.',
        });
        return res.user;
      }

      if (decision === 'suspended') {
        const res = await this.suspendAccount({
          targetUserId,
          adminId: verifierEmailOrId,
          adminEmail: verifierEmailOrId,
          reason: notes || 'Account suspended by administrator.',
        });
        return res.user;
      }
    }

    return null;
  }

  public static async listGovtAccounts(statusFilter?: AccountStatus | 'all', search?: string): Promise<CleanUser[]> {
    requireDb('listGovtAccounts');

    if (isConnectedToDb) {
      const query: Record<string, any> = {
        role: { $in: ['govt_org', 'government'] },
      };
      if (statusFilter && statusFilter !== 'all') {
        query.accountStatus = statusFilter;
      }
      if (search && search.trim()) {
        const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [
          { name: regex },
          { email: regex },
          { organizationName: regex },
          { designation: regex },
          { district: regex },
          { state: regex },
          { officialIdInfo: regex },
        ];
      }
      const docs = await UserModel.find(query)
        .select('+officialIdInfo')
        .sort({ createdAt: -1 })
        .limit(200);
      return docs.map((d) => this.mapUserDocToCleanUser(d));
    }

    const results: CleanUser[] = [];
    for (const u of memoryUsers.values()) {
      if (u.role === 'govt_org' && (!statusFilter || statusFilter === 'all' || u.accountStatus === statusFilter)) {
        const { passwordHash: _, ...clean } = u;
        results.push(clean);
      }
    }
    return results;
  }

  public static async getGovtAccountDetails(targetUserId: string): Promise<{
    account: CleanUser;
    auditHistory: any[];
  } | null> {
    requireDb('getGovtAccountDetails');
    if (!isConnectedToDb) return null;

    const doc = await UserModel.findById(targetUserId).select('+officialIdInfo');
    if (!doc) return null;

    const auditHistory = await AuditLogModel.find({ targetUserId: doc._id.toString() })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return {
      account: this.mapUserDocToCleanUser(doc),
      auditHistory,
    };
  }

  public static async getAuditLogs(limit = 100, actionFilter?: string): Promise<any[]> {
    requireDb('getAuditLogs');
    if (!isConnectedToDb) return [];
    const query: Record<string, any> = {};
    if (actionFilter && actionFilter !== 'all') {
      query.action = actionFilter;
    }
    return AuditLogModel.find(query).sort({ createdAt: -1 }).limit(Math.min(limit, 500)).lean();
  }

  public static async createFarm(
    ownerId: string,
    farmData: {
      name: string;
      locationName?: string;
      state?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
      areaAcres?: number;
      primaryCrop?: string;
      cropVariety?: string;
      soilType?: string;
      irrigationMethod?: string;
      boundary?: Array<{ lat: number; lng: number }>;
    }
  ): Promise<CleanFarm> {
    requireDb('createFarm');

    if (isConnectedToDb) {
      try {
        const farmDoc = new FarmModel({
          ownerId,
          name: farmData.name.trim(),
          locationName: farmData.locationName?.trim() || '',
          state: farmData.state || '',
          country: farmData.country || '',
          latitude: Number(farmData.latitude ?? 0),
          longitude: Number(farmData.longitude ?? 0),
          areaAcres: Number(farmData.areaAcres ?? 0),
          primaryCrop: farmData.primaryCrop?.trim() || '',
          cropVariety: farmData.cropVariety?.trim() || '',
          soilType: farmData.soilType?.trim() || '',
          irrigationMethod: farmData.irrigationMethod?.trim() || '',
          boundary: farmData.boundary || [],
        });
        await farmDoc.save();

        return {
          id: farmDoc._id.toString(),
          ownerId: farmDoc.ownerId,
          name: farmDoc.name,
          locationName: farmDoc.locationName,
          state: farmDoc.state,
          country: farmDoc.country,
          latitude: farmDoc.latitude,
          longitude: farmDoc.longitude,
          areaAcres: farmDoc.areaAcres,
          primaryCrop: farmDoc.primaryCrop,
          cropVariety: farmDoc.cropVariety,
          sowingDate: farmDoc.sowingDate || '',
          growthStage: farmDoc.growthStage || '',
          soilType: farmDoc.soilType,
          irrigationMethod: farmDoc.irrigationMethod,
          boundary: farmDoc.boundary || [],
        };
      } catch (err) {
        console.error('MongoDB createFarm error:', err);
        throw err;
      }
    }

    // USE_IN_MEMORY_DB=true path (local dev only)
    const newId = `farm-${Date.now()}`;
    const clean: CleanFarm = {
      id: newId,
      ownerId,
      name: farmData.name.trim(),
      locationName: farmData.locationName?.trim() || '',
      state: farmData.state || '',
      country: farmData.country || '',
      latitude: Number(farmData.latitude ?? 0),
      longitude: Number(farmData.longitude ?? 0),
      areaAcres: Number(farmData.areaAcres ?? 0),
      primaryCrop: farmData.primaryCrop?.trim() || '',
      cropVariety: farmData.cropVariety?.trim() || '',
      sowingDate: '',
      growthStage: '',
      soilType: farmData.soilType?.trim() || '',
      irrigationMethod: farmData.irrigationMethod?.trim() || '',
      boundary: farmData.boundary || [],
    };
    memoryFarms.set(ownerId, clean);
    return clean;
  }

  public static async getFarmByOwnerId(ownerId: string): Promise<CleanFarm | null> {
    requireDb('getFarmByOwnerId');

    if (isConnectedToDb) {
      try {
        const found = await FarmModel.findOne({ ownerId });
        if (found) {
          return {
            id: found._id.toString(),
            ownerId: found.ownerId,
            name: found.name,
            locationName: found.locationName,
            state: found.state,
            country: found.country,
            latitude: found.latitude,
            longitude: found.longitude,
            areaAcres: found.areaAcres,
            primaryCrop: found.primaryCrop,
            cropVariety: found.cropVariety,
            sowingDate: found.sowingDate,
            growthStage: found.growthStage,
            soilType: found.soilType,
            irrigationMethod: found.irrigationMethod,
            boundary: found.boundary || [],
          };
        }
        return null;
      } catch (err) {
        console.error('MongoDB getFarmByOwnerId error:', err);
        throw err;
      }
    }

    // USE_IN_MEMORY_DB=true path (local dev only)
    return memoryFarms.get(ownerId) || null;
  }

  public static async updateFarm(
    ownerId: string,
    farmData: Partial<CleanFarm>
  ): Promise<CleanFarm> {
    requireDb('updateFarm');

    // Prevent ownerId tampering
    const safeUpdate = { ...farmData };
    delete (safeUpdate as any).ownerId;
    delete (safeUpdate as any).id;
    delete (safeUpdate as any)._id;

    if (isConnectedToDb) {
      try {
        const updated = await FarmModel.findOneAndUpdate(
          { ownerId },
          { $set: safeUpdate },
          { new: true, upsert: true }
        );
        return {
          id: updated._id.toString(),
          ownerId: updated.ownerId,
          name: updated.name,
          locationName: updated.locationName,
          state: updated.state,
          country: updated.country,
          latitude: updated.latitude,
          longitude: updated.longitude,
          areaAcres: updated.areaAcres,
          primaryCrop: updated.primaryCrop,
          cropVariety: updated.cropVariety,
          sowingDate: updated.sowingDate,
          growthStage: updated.growthStage,
          soilType: updated.soilType,
          irrigationMethod: updated.irrigationMethod,
          boundary: updated.boundary || [],
        };
      } catch (err) {
        console.error('MongoDB updateFarm error:', err);
        throw err;
      }
    }

    // USE_IN_MEMORY_DB=true path (local dev only)
    const current = memoryFarms.get(ownerId) || {
      id: `farm-${Date.now()}`,
      ownerId,
      name: 'My Farm',
      locationName: '',
      state: '',
      country: '',
      latitude: 0,
      longitude: 0,
      areaAcres: 0,
      primaryCrop: '',
      cropVariety: '',
      sowingDate: '',
      growthStage: '',
      soilType: '',
      irrigationMethod: '',
      boundary: [],
    };

    const merged = { ...current, ...safeUpdate };
    memoryFarms.set(ownerId, merged);
    return merged;
  }
}
