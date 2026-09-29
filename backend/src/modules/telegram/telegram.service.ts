import crypto from 'node:crypto';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/errors.js';
import { authService, type ClientContext } from '../auth/auth.service.js';
import { authRepository } from '../auth/auth.repository.js';
import { recordAuditLog } from '../../utils/audit.js';
import { SystemRoles } from '../role/role.types.js';
import { type AuthSuccessResponse } from '../auth/auth.types.js';

export interface TelegramUserData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export class TelegramService {
  /**
   * Cryptographically validates Telegram Mini App initData signature using HMAC-SHA256
   * according to Telegram official documentation.
   */
  validateInitData(initDataString: string): { user: TelegramUserData; authDate: Date } {
    if (!env.TELEGRAM_BOT_TOKEN) {
      throw ApiError.internal('Telegram bot token is not configured on the server');
    }

    const searchParams = new URLSearchParams(initDataString);
    const hash = searchParams.get('hash');

    if (!hash) {
      throw ApiError.unauthorized('Missing Telegram signature hash', 'TELEGRAM_HASH_MISSING');
    }

    // 1. Collect all key-value pairs except 'hash', sorted alphabetically
    const keys: string[] = [];
    searchParams.forEach((_value, key) => {
      if (key !== 'hash') {
        keys.push(key);
      }
    });
    keys.sort();

    const dataCheckString = keys
      .map((key) => `${key}=${searchParams.get(key)}`)
      .join('\n');

    // 2. Secret key = HMAC_SHA256("WebAppData", bot_token)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(env.TELEGRAM_BOT_TOKEN)
      .digest();

    // 3. Calculated hash = HMAC_SHA256(secret_key, data_check_string)
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // 4. Constant-time comparison to prevent timing attacks
    const calculatedHashBuffer = Buffer.from(calculatedHash, 'hex');
    const incomingHashBuffer = Buffer.from(hash, 'hex');

    if (
      calculatedHashBuffer.length !== incomingHashBuffer.length ||
      !crypto.timingSafeEqual(calculatedHashBuffer, incomingHashBuffer)
    ) {
      throw ApiError.unauthorized('Invalid Telegram signature proof', 'TELEGRAM_SIGNATURE_INVALID');
    }

    // 5. Validate auth_date expiration (valid for 24 hours)
    const authDateUnix = searchParams.get('auth_date');
    if (!authDateUnix) {
      throw ApiError.unauthorized('Missing auth_date in Telegram payload', 'TELEGRAM_DATE_MISSING');
    }

    const authDate = new Date(parseInt(authDateUnix, 10) * 1000);
    const maxAgeMs = 24 * 60 * 60 * 1000;
    if (Date.now() - authDate.getTime() > maxAgeMs) {
      throw ApiError.unauthorized('Telegram initData session expired', 'TELEGRAM_DATA_EXPIRED');
    }

    // 6. Extract user payload
    const userJson = searchParams.get('user');
    if (!userJson) {
      throw ApiError.badRequest('Missing user information in Telegram initData', 'TELEGRAM_USER_MISSING');
    }

    let user: TelegramUserData;
    try {
      user = JSON.parse(userJson);
    } catch {
      throw ApiError.badRequest('Invalid user JSON format in Telegram initData', 'TELEGRAM_USER_INVALID');
    }

    return { user, authDate };
  }

  async authenticateWithTelegram(
    initDataString: string,
    client: ClientContext,
    currentUserId?: string,
  ): Promise<AuthSuccessResponse> {
    const { user: tgUser, authDate } = this.validateInitData(initDataString);
    const telegramIdStr = tgUser.id.toString();

    // 1. Check if Telegram account already exists
    const existingTgAccount = await prisma.telegramAccount.findUnique({
      where: { telegramId: telegramIdStr },
      include: { user: true },
    });

    let userId: string;

    if (existingTgAccount) {
      // Existing Telegram user
      userId = existingTgAccount.userId;

      // Update Telegram profile information
      await prisma.telegramAccount.update({
        where: { id: existingTgAccount.id },
        data: {
          username: tgUser.username,
          firstName: tgUser.first_name,
          lastName: tgUser.last_name,
          photoUrl: tgUser.photo_url,
          authDate,
        },
      });
    } else if (currentUserId) {
      // Link to currently authenticated account
      userId = currentUserId;
      await prisma.telegramAccount.create({
        data: {
          userId: currentUserId,
          telegramId: telegramIdStr,
          username: tgUser.username,
          firstName: tgUser.first_name,
          lastName: tgUser.last_name,
          photoUrl: tgUser.photo_url,
          authDate,
        },
      });
    } else {
      // New user registration via Telegram
      const syntheticEmail = `tg_${telegramIdStr}@telegram.user`;
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = crypto.createHash('sha256').update(randomPassword).digest('hex');

      const newUser = await prisma.$transaction(async (tx) => {
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

        const user = await tx.user.create({
          data: {
            email: syntheticEmail,
            passwordHash,
            firstName: tgUser.first_name || 'TelegramUser',
            lastName: tgUser.last_name,
            status: 'ACTIVE',
            emailVerified: true,
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
            telegramAccounts: {
              create: {
                telegramId: telegramIdStr,
                username: tgUser.username,
                firstName: tgUser.first_name,
                lastName: tgUser.last_name,
                photoUrl: tgUser.photo_url,
                authDate,
              },
            },
          },
        });

        return user;
      });

      userId = newUser.id;

      await recordAuditLog({
        userId,
        actor: `telegram:${telegramIdStr}`,
        action: 'REGISTER',
        resource: 'TelegramAccount',
        resourceId: telegramIdStr,
        ipAddress: client.ipAddress,
        userAgent: client.userAgent,
        metadata: { telegramId: telegramIdStr, username: tgUser.username },
      });
    }

    // Retrieve user with permissions & generate session tokens
    const fullUser = await authRepository.findByIdWithRoles(userId);
    if (!fullUser) {
      throw ApiError.internal('Unable to retrieve user record');
    }

    if (fullUser.status === 'BLOCKED' || fullUser.status === 'SUSPENDED') {
      throw ApiError.forbidden(`Account is ${fullUser.status.toLowerCase()}`, 'ACCOUNT_INACTIVE');
    }

    // Generate token pair
    const tokenFamily = crypto.randomUUID();
    const tokens = await authService.generateTokenPair(
      fullUser.id,
      fullUser.email,
      fullUser.roles,
      fullUser.permissions,
      tokenFamily,
    );

    await recordAuditLog({
      userId: fullUser.id,
      actor: `telegram:${telegramIdStr}`,
      action: 'LOGIN',
      resource: 'TelegramAccount',
      resourceId: telegramIdStr,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      metadata: { telegramId: telegramIdStr },
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
}

export const telegramService = new TelegramService();
