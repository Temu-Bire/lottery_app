import { prisma } from '../../config/database.js';
import { type User, type RefreshToken, type PasswordResetToken, type EmailVerificationToken } from '@prisma/client';
import { SystemRoles, type SystemRole, type SystemPermission } from '../role/role.types.js';

export interface UserWithRolesAndPermissions extends User {
  roles: SystemRole[];
  permissions: SystemPermission[];
}

export class AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { phone },
    });
  }

  async findByIdWithRoles(userId: string): Promise<UserWithRolesAndPermissions | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    const roles: SystemRole[] = user.userRoles.map((ur) => ur.role.name as SystemRole);
    const permissionSet = new Set<SystemPermission>();

    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissionSet.add(rp.permission.name as SystemPermission);
      }
    }

    return {
      ...user,
      roles,
      permissions: Array.from(permissionSet),
    };
  }

  async createUserWithWallet(data: {
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<User> {
    return prisma.$transaction(async (tx) => {
      // Find or create default USER role
      let userRole = await tx.role.findUnique({
        where: { name: SystemRoles.USER },
      });

      if (!userRole) {
        userRole = await tx.role.create({
          data: {
            name: SystemRoles.USER,
            description: 'Standard platform player',
          },
        });
      }

      // Create user and ledger wallet in transaction
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          status: 'ACTIVE',
          wallet: {
            create: {
              balance: 0.0,
              lockedBalance: 0.0,
              currency: 'USD',
            },
          },
          userRoles: {
            create: {
              roleId: userRole.id,
            },
          },
        },
      });

      return user;
    });
  }

  async createEmailVerificationToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<EmailVerificationToken> {
    return prisma.emailVerificationToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findEmailVerificationToken(tokenHash: string): Promise<EmailVerificationToken | null> {
    return prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });
  }

  async markEmailVerified(userId: string, tokenId: string): Promise<void> {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      }),
      prisma.emailVerificationToken.update({
        where: { id: tokenId },
        data: { isUsed: true },
      }),
    ]);
  }

  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    family: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data,
    });
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  }

  async revokeRefreshToken(tokenId: string, replacedBy?: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { id: tokenId },
      data: { isRevoked: true, replacedBy },
    });
  }

  async revokeTokenFamily(family: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { family },
      data: { isRevoked: true },
    });
  }

  async createPasswordResetToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({
      data,
    });
  }

  async findPasswordResetToken(tokenHash: string): Promise<PasswordResetToken | null> {
    return prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
  }

  async resetPassword(userId: string, tokenId: string, newPasswordHash: string): Promise<void> {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: tokenId },
        data: { isUsed: true },
      }),
      // Invalidate all active refresh tokens on password change
      prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      }),
    ]);
  }
}

export const authRepository = new AuthRepository();
