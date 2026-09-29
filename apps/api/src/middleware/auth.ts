import { Request, Response, NextFunction } from 'express';
import { UserFarmService } from '../services/db/userFarmService';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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

  req.user = decoded;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = UserFarmService.verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}
