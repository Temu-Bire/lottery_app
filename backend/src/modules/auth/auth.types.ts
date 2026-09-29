import { type SystemRole, type SystemPermission } from '../role/role.types.js';

export interface AuthUserPayload {
  userId: string;
  email: string;
  roles: SystemRole[];
  permissions: SystemPermission[];
}

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthSuccessResponse {
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    status: string;
    roles: SystemRole[];
    permissions: SystemPermission[];
  };
  tokens: TokenPair;
}
