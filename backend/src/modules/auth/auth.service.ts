import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { authRepository } from './auth.repository.js';
import { ApiError } from '../../utils/errors.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateSecureRandomString,
} from '../../utils/token.js';
import { recordAuditLog } from '../../utils/audit.js';
import { env } from '../../config/env.js';
import {
  type AuthSuccessResponse,
  type TokenPair,
} from './auth.types.js';
import { type SystemRole, type SystemPermission } from '../role/role.types.js';

export interface ClientContext {
  ipAddress?: string;
  userAgent?: string;
}

export class AuthService {
  async register(
    data: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    },
    client: ClientContext,
  ): Promise<{ user: { id: string; email: string }; verificationToken: string }> {
    // 1. Check duplicate email
    const existingByEmail = await authRepository.findByEmail(data.email);
    if (existingByEmail) {
      throw ApiError.conflict('An account with this email address already exists', 'EMAIL_ALREADY_EXISTS');
    }

    // 2. Check duplicate phone
    if (data.phone) {
      const existingByPhone = await authRepository.findByPhone(data.phone);
      if (existingByPhone) {
        throw ApiError.conflict('An account with this phone number already exists', 'PHONE_ALREADY_EXISTS');
      }
    }

    // 3. Hash password with bcrypt salt 12
    const passwordHash = await bcrypt.hash(data.password, 12);

    // 4. Create user + wallet + assign USER role
    const user = await authRepository.createUserWithWallet({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    });

    // 5. Generate email verification token (valid 24h)
    const rawVerificationToken = generateSecureRandomString(32);
    const tokenHash = hashToken(rawVerificationToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await authRepository.createEmailVerificationToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // 6. Audit log registration
    await recordAuditLog({
      userId: user.id,
      actor: user.email,
      action: 'REGISTER',
      resource: 'User',
      resourceId: user.id,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      metadata: { email: user.email },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      verificationToken: rawVerificationToken,
    };
  }

  async verifyEmail(token: string, client: ClientContext): Promise<{ success: boolean; message: string }> {
    const tokenHash = hashToken(token);
    const storedToken = await authRepository.findEmailVerificationToken(tokenHash);

    if (!storedToken || storedToken.isUsed) {
      throw ApiError.badRequest('Invalid or expired verification token', 'INVALID_VERIFICATION_TOKEN');
    }

    if (new Date() > storedToken.expiresAt) {
      throw ApiError.badRequest('Verification token has expired', 'VERIFICATION_TOKEN_EXPIRED');
    }

    await authRepository.markEmailVerified(storedToken.userId, storedToken.id);

    await recordAuditLog({
      userId: storedToken.userId,
      actor: storedToken.userId,
      action: 'EMAIL_VERIFIED',
      resource: 'User',
      resourceId: storedToken.userId,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
    });

    return { success: true, message: 'Email verified successfully' };
  }

  async resendVerification(email: string, _client: ClientContext): Promise<{ message: string; verificationToken: string }> {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      // Return generic message to prevent email enumeration
      return {
        message: 'If the email exists, a verification link has been resent',
        verificationToken: '',
      };
    }

    if (user.emailVerified) {
      throw ApiError.badRequest('Email is already verified', 'EMAIL_ALREADY_VERIFIED');
    }

    const rawVerificationToken = generateSecureRandomString(32);
    const tokenHash = hashToken(rawVerificationToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await authRepository.createEmailVerificationToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return {
      message: 'Verification token generated successfully',
      verificationToken: rawVerificationToken,
    };
  }

  async login(
    credentials: { email: string; password: string },
    client: ClientContext,
  ): Promise<AuthSuccessResponse> {
    const userWithRoles = await authRepository.findByEmail(credentials.email);

    if (!userWithRoles) {
      await recordAuditLog({
        actor: credentials.email,
        action: 'LOGIN_FAILED',
        resource: 'User',
        ipAddress: client.ipAddress,
        userAgent: client.userAgent,
        metadata: { reason: 'User not found' },
      });
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const fullUser = await authRepository.findByIdWithRoles(userWithRoles.id);
    if (!fullUser) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Check account status
    if (fullUser.status === 'BLOCKED' || fullUser.status === 'SUSPENDED') {
      await recordAuditLog({
        userId: fullUser.id,
        actor: fullUser.email,
        action: 'LOGIN_FAILED',
        resource: 'User',
        resourceId: fullUser.id,
        ipAddress: client.ipAddress,
        userAgent: client.userAgent,
        metadata: { reason: `Account is ${fullUser.status}` },
      });
      throw ApiError.forbidden(`Your account has been ${fullUser.status.toLowerCase()}`, 'ACCOUNT_DISABLED');
    }

    const isMatch = await bcrypt.compare(credentials.password, fullUser.passwordHash);
    if (!isMatch) {
      await recordAuditLog({
        userId: fullUser.id,
        actor: fullUser.email,
        action: 'LOGIN_FAILED',
        resource: 'User',
        resourceId: fullUser.id,
        ipAddress: client.ipAddress,
        userAgent: client.userAgent,
        metadata: { reason: 'Incorrect password' },
      });
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Issue token pair with refresh token rotation family
    const tokenFamily = crypto.randomUUID();
    const tokens = await this.generateTokenPair(fullUser.id, fullUser.email, fullUser.roles, fullUser.permissions, tokenFamily);

    await recordAuditLog({
      userId: fullUser.id,
      actor: fullUser.email,
      action: 'LOGIN',
      resource: 'User',
      resourceId: fullUser.id,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
    });

    return {
      user: {
        id: fullUser.id,
        email: fullUser.email,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        status: fullUser.status,
        roles: fullUser.roles,
        permissions: fullUser.permissions,
      },
      tokens,
    };
  }

  async refreshToken(rawRefreshToken: string, client: ClientContext): Promise<TokenPair> {
    let payload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token', 'REFRESH_TOKEN_INVALID');
    }

    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await authRepository.findRefreshTokenByHash(tokenHash);

    if (!storedToken) {
      throw ApiError.unauthorized('Refresh token not found or revoked', 'REFRESH_TOKEN_NOT_FOUND');
    }

    // REUSE DETECTION: If token is already revoked, revoke the ENTIRE token family!
    if (storedToken.isRevoked) {
      await authRepository.revokeTokenFamily(storedToken.family);
      await recordAuditLog({
        userId: storedToken.userId,
        actor: storedToken.userId,
        action: 'SECURITY_EVENT',
        resource: 'RefreshToken',
        resourceId: storedToken.id,
        ipAddress: client.ipAddress,
        userAgent: client.userAgent,
        metadata: { alert: 'Token reuse detected, entire family revoked', family: storedToken.family },
      });
      throw ApiError.unauthorized('Token reuse detected. All sessions revoked for security.', 'TOKEN_REUSE_DETECTED');
    }

    if (new Date() > storedToken.expiresAt) {
      throw ApiError.unauthorized('Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
    }

    const user = await authRepository.findByIdWithRoles(payload.userId);
    if (!user || user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
      throw ApiError.forbidden('User account is inactive or suspended', 'ACCOUNT_INACTIVE');
    }

    // Revoke the old token (mark replaced) and create a new one in the same family
    const nextTokens = await this.generateTokenPair(
      user.id,
      user.email,
      user.roles,
      user.permissions,
      storedToken.family,
    );

    await authRepository.revokeRefreshToken(storedToken.id, hashToken(nextTokens.refreshToken));

    return nextTokens;
  }

  async logout(rawRefreshToken: string, client: ClientContext): Promise<{ success: boolean }> {
    try {
      const tokenHash = hashToken(rawRefreshToken);
      const storedToken = await authRepository.findRefreshTokenByHash(tokenHash);
      if (storedToken) {
        await authRepository.revokeRefreshToken(storedToken.id);
        await recordAuditLog({
          userId: storedToken.userId,
          actor: storedToken.userId,
          action: 'LOGOUT',
          resource: 'Session',
          resourceId: storedToken.id,
          ipAddress: client.ipAddress,
          userAgent: client.userAgent,
        });
      }
    } catch {
      // Silent error on logout
    }

    return { success: true };
  }

  async forgotPassword(email: string, client: ClientContext): Promise<{ message: string; resetToken?: string }> {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      // Prevent user enumeration
      return { message: 'If an account matches that email, a password reset link has been dispatched' };
    }

    const rawToken = generateSecureRandomString(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await authRepository.createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await recordAuditLog({
      userId: user.id,
      actor: user.email,
      action: 'SECURITY_EVENT',
      resource: 'PasswordResetToken',
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      metadata: { action: 'FORGOT_PASSWORD_REQUESTED' },
    });

    return {
      message: 'Password reset token generated successfully',
      resetToken: rawToken,
    };
  }

  async resetPassword(data: { token: string; newPassword: string }, client: ClientContext): Promise<{ success: boolean }> {
    const tokenHash = hashToken(data.token);
    const storedToken = await authRepository.findPasswordResetToken(tokenHash);

    if (!storedToken || storedToken.isUsed) {
      throw ApiError.badRequest('Invalid or used password reset token', 'INVALID_RESET_TOKEN');
    }

    if (new Date() > storedToken.expiresAt) {
      throw ApiError.badRequest('Password reset token has expired', 'RESET_TOKEN_EXPIRED');
    }

    const newPasswordHash = await bcrypt.hash(data.newPassword, 12);
    await authRepository.resetPassword(storedToken.userId, storedToken.id, newPasswordHash);

    await recordAuditLog({
      userId: storedToken.userId,
      actor: storedToken.userId,
      action: 'PASSWORD_RESET',
      resource: 'User',
      resourceId: storedToken.userId,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
    });

    return { success: true };
  }

  public async generateTokenPair(
    userId: string,
    email: string,
    roles: SystemRole[],
    permissions: SystemPermission[],
    tokenFamily: string,
  ): Promise<TokenPair> {
    const accessToken = signAccessToken({
      userId,
      email,
      roles,
      permissions,
    });

    const rawRefreshToken = signRefreshToken({
      userId,
      tokenFamily,
    });
    const refreshTokenHash = hashToken(rawRefreshToken);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await authRepository.createRefreshToken({
      userId,
      tokenHash: refreshTokenHash,
      family: tokenFamily,
      expiresAt: refreshExpiresAt,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    };
  }
}

export const authService = new AuthService();
