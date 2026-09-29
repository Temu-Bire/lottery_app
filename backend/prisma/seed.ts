import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import {
  SystemRoles,
  SystemPermissions,
  DEFAULT_ROLE_PERMISSIONS,
  type SystemRole,
} from '../src/modules/role/role.types.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding system permissions and roles...');

  // 1. Seed Permissions
  for (const [permKey, permName] of Object.entries(SystemPermissions)) {
    const [moduleName] = permName.split(':');
    await prisma.permission.upsert({
      where: { name: permName },
      update: { module: moduleName || 'general' },
      create: {
        name: permName,
        module: moduleName || 'general',
        description: `Permission to ${permKey.toLowerCase().replace(/_/g, ' ')}`,
      },
    });
  }

  // 2. Seed Roles and map permissions
  for (const [roleKey, roleName] of Object.entries(SystemRoles)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `${roleKey} role for platform`,
      },
    });

    const permissions = DEFAULT_ROLE_PERMISSIONS[roleName as SystemRole] || [];
    for (const permName of permissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permName },
      });

      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }
  }

  // 3. Create default Super Admin user if not exists
  const superAdminEmail = 'superadmin@lottery.internal';
  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existingSuperAdmin) {
    const passwordHash = await bcrypt.hash('SuperAdminSecret123!', 12);
    const superAdminUser = await prisma.user.create({
      data: {
        email: superAdminEmail,
        passwordHash,
        firstName: 'System',
        lastName: 'SuperAdmin',
        status: 'ACTIVE',
        emailVerified: true,
        wallet: {
          create: {
            balance: 0,
            currency: 'USD',
          },
        },
      },
    });

    const superAdminRole = await prisma.role.findUnique({
      where: { name: SystemRoles.SUPER_ADMIN },
    });

    if (superAdminRole) {
      await prisma.userRole.create({
        data: {
          userId: superAdminUser.id,
          roleId: superAdminRole.id,
        },
      });
    }

    console.log(`Created default super admin: ${superAdminEmail}`);
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
