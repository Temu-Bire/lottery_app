import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { type AuthUserPayload } from '../modules/auth/auth.types.js';

export const signAccessToken = (payload: AuthUserPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const signRefreshToken = (payload: { userId: string; tokenFamily: string }): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const verifyAccessToken = (token: string): AuthUserPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUserPayload;
};

export const verifyRefreshToken = (token: string): { userId: string; tokenFamily: string } => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string; tokenFamily: string };
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateSecureRandomString = (bytes: number = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};
