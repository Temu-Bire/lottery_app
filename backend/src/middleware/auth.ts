import { type Request, type Response, type NextFunction, type RequestHandler } from 'express';
import { ApiError } from '../utils/errors.js';
import { verifyAccessToken } from '../utils/token.js';
import { prisma } from '../config/database.js';
import { type SystemRole, type SystemPermission, SystemRoles } from '../modules/role/role.types.js';

export const authenticate: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication token missing or invalid', 'AUTH_TOKEN_MISSING');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw ApiError.unauthorized('Authentication token missing', 'AUTH_TOKEN_MISSING');
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired authentication token', 'AUTH_TOKEN_INVALID');
    }

    // Check account status directly in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, status: true },
    });

    if (!user) {
      throw ApiError.unauthorized('User not found', 'USER_NOT_FOUND');
    }

    if (user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
      throw ApiError.forbidden(`Account is ${user.status.toLowerCase()}`, 'ACCOUNT_INACTIVE');
    }

    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...roles: SystemRole[]): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Super Admin has all privileges
    if (req.user.roles.includes(SystemRoles.SUPER_ADMIN)) {
      return next();
    }

    const hasRole = roles.some((role) => req.user?.roles.includes(role));
    if (!hasRole) {
      return next(ApiError.forbidden('Insufficient role privileges for this resource', 'INSUFFICIENT_ROLE'));
    }

    next();
  };
};

export const requirePermission = (...permissions: SystemPermission[]): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Super Admin has all permissions
    if (req.user.roles.includes(SystemRoles.SUPER_ADMIN)) {
      return next();
    }

    const hasAllPermissions = permissions.every((permission) =>
      req.user?.permissions.includes(permission),
    );

    if (!hasAllPermissions) {
      return next(
        ApiError.forbidden(
          'Insufficient permissions to perform this action',
          'INSUFFICIENT_PERMISSIONS',
        ),
      );
    }

    next();
  };
};

export const authorize = (
  options: { roles?: SystemRole[]; permissions?: SystemPermission[] } = {},
): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (req.user.roles.includes(SystemRoles.SUPER_ADMIN)) {
      return next();
    }

    if (options.roles && options.roles.length > 0) {
      const hasRole = options.roles.some((role) => req.user?.roles.includes(role));
      if (!hasRole) {
        return next(ApiError.forbidden('Insufficient role privileges', 'INSUFFICIENT_ROLE'));
      }
    }

    if (options.permissions && options.permissions.length > 0) {
      const hasPermissions = options.permissions.every((perm) =>
        req.user?.permissions.includes(perm),
      );
      if (!hasPermissions) {
        return next(
          ApiError.forbidden('Insufficient permissions', 'INSUFFICIENT_PERMISSIONS'),
        );
      }
    }

    next();
  };
};
