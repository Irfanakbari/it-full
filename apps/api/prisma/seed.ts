import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const SYSTEM = 'System';

const permissions = [
  'ITAM.DASHBOARD_READ',
  'ITAM.MASTER_READ', 'ITAM.MASTER_MANAGE',
  'ITAM.ASSET_READ', 'ITAM.ASSET_CREATE', 'ITAM.ASSET_UPDATE',
  'ITAM.ASSET_ARCHIVE', 'ITAM.ASSET_DISPOSE', 'ITAM.ASSET_ASSIGN',
  'ITAM.MAINTENANCE_READ', 'ITAM.MAINTENANCE_MANAGE',
  'ITAM.LICENSE_READ', 'ITAM.LICENSE_MANAGE', 'ITAM.LICENSE_SECRET_READ',
  'ITAM.STOCK_OPNAME_READ', 'ITAM.STOCK_OPNAME_CREATE',
  'ITAM.STOCK_OPNAME_SCAN', 'ITAM.STOCK_OPNAME_VERIFY',
  'ITAM.STOCK_OPNAME_APPROVE', 'ITAM.STOCK_OPNAME_CLOSE',
  'ITAM.STOCK_OPNAME_CANCEL', 'ITAM.USER_MANAGEMENT',
  'ITAM.SYSTEM_LOG_READ',
] as const;

const rolePermissions: Record<string, readonly string[]> = {
  ADMIN_IT: permissions,
  STAFF_IT: permissions.filter((permission) => ![
    'ITAM.MASTER_MANAGE', 'ITAM.ASSET_ARCHIVE', 'ITAM.ASSET_DISPOSE',
    'ITAM.LICENSE_MANAGE', 'ITAM.LICENSE_SECRET_READ',
    'ITAM.STOCK_OPNAME_CREATE',
    'ITAM.STOCK_OPNAME_VERIFY', 'ITAM.STOCK_OPNAME_APPROVE',
    'ITAM.STOCK_OPNAME_CLOSE', 'ITAM.STOCK_OPNAME_CANCEL',
    'ITAM.USER_MANAGEMENT', 'ITAM.SYSTEM_LOG_READ',
  ].includes(permission)),
  AUDITOR: permissions.filter((permission) => permission.endsWith('_READ')),
  VIEWER: permissions.filter((permission) => permission.endsWith('_READ')),
};

const developmentCategories = [
  { Code: 'PR', Name: 'Printer', Description: 'Printers, scanners, and multifunction devices' },
  { Code: 'PC', Name: 'PC', Description: 'Desktop personal computers and workstations' },
  { Code: 'LP', Name: 'Laptop', Description: 'Portable computers assigned to employees' },
  { Code: 'SV', Name: 'Server', Description: 'Physical servers and infrastructure appliances' },
  { Code: 'PD', Name: 'PDA', Description: 'Portable data assistant devices' },
  { Code: 'TB', Name: 'Tablet', Description: 'Company tablet devices' },
  { Code: 'DP', Name: 'Display', Description: 'Displays, monitors, and presentation screens' },
  { Code: 'AC', Name: 'Aksesoris', Description: 'IT accessories and peripheral equipment' },
] as const;

const developmentLocations = [
  { Code: 'KRW', Name: 'Karawang', Address: 'Karawang', Floor: null, Room: null },
  { Code: 'BKS', Name: 'Bekasi', Address: 'Bekasi', Floor: null, Room: null },
  { Code: 'CKR', Name: 'Cikarang', Address: 'Cikarang', Floor: null, Room: null },
] as const;

const developmentAttributes = [
  { Key: 'Processor', Description: 'Processor model and generation' },
  { Key: 'Memory', Description: 'Installed memory capacity' },
  { Key: 'Storage', Description: 'Storage type and capacity' },
  { Key: 'OperatingSystem', Description: 'Installed operating system' },
  { Key: 'IPAddress', Description: 'Assigned network IP address' },
  { Key: 'MACAddress', Description: 'Primary network interface MAC address' },
  { Key: 'PurchaseOrderNumber', Description: 'Related purchase order number' },
] as const;

async function seedDevelopmentMasterData() {
  const archivedAt = new Date();
  await prisma.category.updateMany({
    where: { Name: { in: ['Desktop', 'Monitor', 'Network Device', 'Mobile Device', 'Peripheral'] }, DeletedAt: null },
    data: { IsActive: false, DeletedAt: archivedAt, UpdatedBy: SYSTEM },
  });
  await prisma.location.updateMany({
    where: { Name: { in: ['IT Office', 'Server Room', 'Main Office', 'Production Area', 'Warehouse', 'Meeting Room'] }, DeletedAt: null },
    data: { IsActive: false, DeletedAt: archivedAt, UpdatedBy: SYSTEM },
  });
  for (const item of developmentCategories) {
    const [byName, byCode] = await Promise.all([
      prisma.category.findUnique({ where: { Name: item.Name } }),
      prisma.category.findUnique({ where: { Code: item.Code } }),
    ]);
    if (byName && byCode && byName.Id !== byCode.Id) {
      throw new Error(`Category seed conflict: name ${item.Name} and code ${item.Code} belong to different records`);
    }
    const existing = byName ?? byCode;
    if (existing) {
      await prisma.category.update({
        where: { Id: existing.Id },
        data: { Code: item.Code, Name: item.Name, Description: item.Description, IsActive: true, DeletedAt: null, UpdatedBy: SYSTEM },
      });
    } else {
      await prisma.category.create({ data: { ...item, IsActive: true, CreatedBy: SYSTEM, UpdatedBy: SYSTEM } });
    }
  }
  for (const item of developmentLocations) {
    const [byName, byCode] = await Promise.all([
      prisma.location.findFirst({ where: { Name: item.Name, Floor: item.Floor, Room: item.Room } }),
      prisma.location.findUnique({ where: { Code: item.Code } }),
    ]);
    if (byName && byCode && byName.Id !== byCode.Id) {
      throw new Error(`Location seed conflict: name ${item.Name} and code ${item.Code} belong to different records`);
    }
    const existing = byName ?? byCode;
    if (existing) {
      await prisma.location.update({
        where: { Id: existing.Id },
        data: { Code: item.Code, Name: item.Name, Address: item.Address, Floor: item.Floor, Room: item.Room, IsActive: true, DeletedAt: null, UpdatedBy: SYSTEM },
      });
    } else {
      await prisma.location.create({ data: { ...item, IsActive: true, CreatedBy: SYSTEM, UpdatedBy: SYSTEM } });
    }
  }
  await prisma.attributeDefinition.createMany({
    data: developmentAttributes.map((item) => ({
      ...item,
      IsActive: true,
      CreatedBy: SYSTEM,
      UpdatedBy: SYSTEM,
    })),
    skipDuplicates: true,
  });
}

async function main() {
  for (const action of permissions) {
    await prisma.permission.upsert({
      where: { Action: action },
      update: { UpdatedBy: SYSTEM },
      create: { Action: action, Description: action, CreatedBy: SYSTEM, UpdatedBy: SYSTEM },
    });
  }

  for (const [roleName, actions] of Object.entries(rolePermissions)) {
    const permissionRows = await prisma.permission.findMany({ where: { Action: { in: [...actions] } } });
    await prisma.role.upsert({
      where: { RoleName: roleName },
      update: {
        IsActive: true,
        UpdatedBy: SYSTEM,
        Permissions: { set: permissionRows.map(({ Id }) => ({ Id })) },
      },
      create: {
        RoleName: roleName,
        Description: `${roleName} application role`,
        CreatedBy: SYSTEM,
        UpdatedBy: SYSTEM,
        Permissions: { connect: permissionRows.map(({ Id }) => ({ Id })) },
      },
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    await seedDevelopmentMasterData();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
