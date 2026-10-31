import { Request, Response, NextFunction } from 'express';
import { UserFarmService, NormalizedRole, AccountStatus } from '../services/db/userFarmService';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: NormalizedRole;
    accountStatus: AccountStatus;
    isSuperAdmin?: boolean;
    permissions: string[];
  };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required. Please log in to access this feature.',
      code: 'UNAUTHORIZED',
    });
  }

  const token = authHeader.substring(7);
  const decoded = UserFarmService.verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired session token. Please log in again.',
      code: 'INVALID_TOKEN',
    });
  }

  try {
    const dbUser = await UserFarmService.findUserById(decoded.id);
    if (!dbUser) {
      return res.status(401).json({
        status: 'error',
        message: 'User account not found. Please log in again.',
        code: 'USER_NOT_FOUND',
      });
    }

    if (dbUser.accountStatus === 'rejected') {
      return res.status(403).json({
        status: 'error',
        message:
          dbUser.rejectionReason ||
          dbUser.verificationNotes ||
          'Your Government / Organization application was declined during credential verification.',
        code: 'ACCOUNT_REJECTED',
        accountStatus: 'rejected',
        rejectionReason: dbUser.rejectionReason || dbUser.verificationNotes || '',
      });
    }

    if (dbUser.accountStatus === 'suspended') {
      return res.status(403).json({
        status: 'error',
        message:
          dbUser.suspendedReason ||
          dbUser.verificationNotes ||
          'Your account has been suspended by an administrator.',
        code: 'ACCOUNT_SUSPENDED',
        accountStatus: 'suspended',
        suspendedReason: dbUser.suspendedReason || dbUser.verificationNotes || '',
      });
    }

    if (dbUser.accountStatus === 'pending') {
      return res.status(403).json({
        status: 'error',
        message: 'Your Government / Organization account is pending administrator verification.',
        code: 'ACCOUNT_PENDING_VERIFICATION',
        accountStatus: 'pending',
      });
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      accountStatus: dbUser.accountStatus,
      isSuperAdmin: dbUser.isSuperAdmin,
      permissions: dbUser.permissions,
    };
    next();
  } catch (err) {
    console.error('[Auth Middleware Error]:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Authentication verification failed.',
      code: 'AUTH_VERIFICATION_ERROR',
    });
  }
}

export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = UserFarmService.verifyToken(token);
    if (decoded) {
      try {
        const dbUser = await UserFarmService.findUserById(decoded.id);
        if (dbUser && dbUser.accountStatus === 'verified') {
          req.user = {
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
            accountStatus: dbUser.accountStatus,
            isSuperAdmin: dbUser.isSuperAdmin,
            permissions: dbUser.permissions,
          };
        }
      } catch {
        // Ignore DB lookup errors in optionalAuth
      }
    }
  }
  next();
}

export function requireRole(...allowedRoles: NormalizedRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.',
        code: 'UNAUTHORIZED',
      });
    }
    if (req.user.accountStatus !== 'verified') {
      return res.status(403).json({
        status: 'error',
        message: 'Your account is not verified to access this portal.',
        code: 'ACCOUNT_NOT_VERIFIED',
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: Your account role does not have permission to access this portal resource.',
        code: 'FORBIDDEN_ROLE',
      });
    }
    next();
  };
}

export function requirePermission(...requiredPermissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.',
        code: 'UNAUTHORIZED',
      });
    }
    if (req.user.accountStatus !== 'verified') {
      return res.status(403).json({
        status: 'error',
        message: 'Your account is pending verification or suspended.',
        code: 'ACCOUNT_NOT_VERIFIED',
      });
    }
    const userPerms = req.user.permissions || [];
    const hasAll = requiredPermissions.every((perm) => userPerms.includes(perm));
    if (!hasAll) {
      return res.status(403).json({
        status: 'error',
        message: `Forbidden: Missing required permission (${requiredPermissions.join(', ')}).`,
        code: 'FORBIDDEN_PERMISSION',
      });
    }
    next();
  };
}

export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required.',
      code: 'UNAUTHORIZED',
    });
  }
  if (req.user.accountStatus !== 'verified') {
    return res.status(403).json({
      status: 'error',
      message: 'Your account is not verified.',
      code: 'ACCOUNT_NOT_VERIFIED',
    });
  }
  if (!req.user.isSuperAdmin && !(req.user.permissions || []).includes('super_admin')) {
    return res.status(403).json({
      status: 'error',
      message: 'Forbidden: Super Administrator privileges are required for this operation.',
      code: 'SUPER_ADMIN_REQUIRED',
    });
  }
  next();
}

export const requireGovtAdmin = requireRole('govt_org');
