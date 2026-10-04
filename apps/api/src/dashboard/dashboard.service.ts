import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const now = new Date();
    const inThirtyDays = new Date(now);
    inThirtyDays.setDate(inThirtyDays.getDate() + 30);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [
      activeAssets, inactiveAssets, disposedAssets, expiredWarranty, expiringWarranty,
      unassignedAssets, openMaintenance, expiredLicenses, expiringLicenses, activeStock,
      categoryDistribution, locationDistribution, recentAssets, recentMaintenance,
      departmentDistribution, upcomingLicenses, assetTrend, maintenanceTrend,
    ] = await Promise.all([
      this.prisma.asset.count({ where: { DeletedAt: null, IsActive: true, IsDisposed: false } }),
      this.prisma.asset.count({ where: { DeletedAt: null, IsActive: false, IsDisposed: false } }),
      this.prisma.asset.count({ where: { DeletedAt: null, IsDisposed: true } }),
      this.prisma.asset.count({ where: { DeletedAt: null, WarrantyEnd: { lt: now } } }),
      this.prisma.asset.count({ where: { DeletedAt: null, WarrantyEnd: { gte: now, lte: inThirtyDays } } }),
      this.prisma.asset.count({ where: { DeletedAt: null, IsActive: true, IsDisposed: false, CurrentEmployeeNo: null } }),
      this.prisma.maintenance.count({ where: { DeletedAt: null, IsClosed: false } }),
      this.prisma.license.count({ where: { DeletedAt: null, IsActive: true, EndDate: { lt: now } } }),
      this.prisma.license.count({ where: { DeletedAt: null, IsActive: true, EndDate: { gte: now, lte: inThirtyDays } } }),
      this.prisma.stockOpname.findFirst({ where: { Status: { in: ["OPEN", "IN_PROGRESS", "VERIFIED", "APPROVED"] } }, include: { _count: { select: { Details: true } } }, orderBy: { CreatedAt: "desc" } }),
      this.prisma.asset.groupBy({ by: ["CategoryId"], where: { DeletedAt: null, IsDisposed: false }, _count: { _all: true } }),
      this.prisma.asset.groupBy({ by: ["LocationId"], where: { DeletedAt: null, IsDisposed: false }, _count: { _all: true } }),
      this.prisma.asset.findMany({ where: { DeletedAt: null }, include: { Category: true, Location: true }, take: 8, orderBy: { CreatedAt: "desc" } }),
      this.prisma.maintenance.findMany({ where: { DeletedAt: null }, include: { Asset: true }, take: 8, orderBy: { MaintenanceDate: "desc" } }),
      this.prisma.asset.groupBy({ by: ["DepartmentCode"], where: { DeletedAt: null, IsDisposed: false }, _count: { _all: true } }),
      this.prisma.license.findMany({
        where: { DeletedAt: null, IsActive: true, EndDate: { gte: now } },
        select: { Id: true, LicenseName: true, LicenseType: true, EndDate: true, Asset: { select: { AssetTag: true, Name: true } } },
        take: 8,
        orderBy: { EndDate: "asc" },
      }),
      this.prisma.$queryRaw<Array<{ Month: Date; Total: bigint }>>`SELECT date_trunc('month', "CreatedAt") AS "Month", COUNT(*) AS "Total" FROM "Asset" WHERE "CreatedAt" >= ${yearStart} AND "DeletedAt" IS NULL GROUP BY 1 ORDER BY 1`,
      this.prisma.$queryRaw<Array<{ Month: Date; Total: bigint }>>`SELECT date_trunc('month', "MaintenanceDate") AS "Month", COUNT(*) AS "Total" FROM "Maintenance" WHERE "MaintenanceDate" >= ${yearStart} AND "DeletedAt" IS NULL GROUP BY 1 ORDER BY 1`,
    ]);

    const categoryIds = categoryDistribution.map((row) => row.CategoryId).filter((id): id is number => id !== null);
    const locationIds = locationDistribution.map((row) => row.LocationId).filter((id): id is number => id !== null);
    const departmentCodes = departmentDistribution.map((row) => row.DepartmentCode).filter((code): code is string => Boolean(code));
    const [categories, locations, departmentNames, conditions] = await Promise.all([
      this.prisma.category.findMany({ where: { Id: { in: categoryIds } }, select: { Id: true, Name: true } }),
      this.prisma.location.findMany({ where: { Id: { in: locationIds } }, select: { Id: true, Name: true } }),
      this.prisma.assetDepartmentAssignment.findMany({
        where: { DepartmentCode: { in: departmentCodes }, DepartmentName: { not: null } },
        select: { DepartmentCode: true, DepartmentName: true },
        orderBy: { CreatedAt: "desc" },
      }),
      this.prisma.stockOpnameDetail.groupBy({ by: ["Condition"], where: { Condition: { in: ["DAMAGED", "LOST"] }, StockOpname: { Status: { in: ["VERIFIED", "APPROVED", "CLOSED"] } } }, _count: { _all: true } }),
    ]);
    const categoryNames = new Map(categories.map((item) => [item.Id, item.Name]));
    const locationNames = new Map(locations.map((item) => [item.Id, item.Name]));
    const departmentNameMap = new Map<string, string>();
    departmentNames.forEach((item) => {
      if (item.DepartmentName && !departmentNameMap.has(item.DepartmentCode)) departmentNameMap.set(item.DepartmentCode, item.DepartmentName);
    });
    return {
      data: {
        Kpi: { ActiveAssets: activeAssets, InactiveAssets: inactiveAssets, DisposedAssets: disposedAssets, ExpiredWarranty: expiredWarranty, ExpiringWarranty: expiringWarranty, UnassignedAssets: unassignedAssets, OpenMaintenance: openMaintenance, ExpiredLicenses: expiredLicenses, ExpiringLicenses: expiringLicenses },
        Condition: Object.fromEntries(conditions.map((item) => [item.Condition ?? "UNKNOWN", item._count._all])),
        CategoryDistribution: categoryDistribution.map((item) => ({ Name: item.CategoryId ? categoryNames.get(item.CategoryId) ?? "Uncategorized" : "Uncategorized", Total: item._count._all })),
        LocationDistribution: locationDistribution.map((item) => ({ Name: item.LocationId ? locationNames.get(item.LocationId) ?? "Unassigned" : "Unassigned", Total: item._count._all })),
        DepartmentDistribution: departmentDistribution.map((item) => ({ Name: item.DepartmentCode ? departmentNameMap.get(item.DepartmentCode) ?? item.DepartmentCode : "Unassigned", Code: item.DepartmentCode, Total: item._count._all })),
        RecentAssets: recentAssets,
        RecentMaintenance: recentMaintenance,
        UpcomingLicenses: upcomingLicenses,
        ActiveStockOpname: activeStock,
        AssetTrend: assetTrend.map((item) => ({ Month: item.Month, Total: Number(item.Total) })),
        MaintenanceTrend: maintenanceTrend.map((item) => ({ Month: item.Month, Total: Number(item.Total) })),
      },
    };
  }

  async notifications() {
    const now = new Date();
    const until = new Date(now);
    until.setDate(until.getDate() + 30);
    const [warranties, licenses, maintenance] = await Promise.all([
      this.prisma.asset.findMany({ where: { DeletedAt: null, WarrantyEnd: { gte: now, lte: until } }, select: { Id: true, AssetTag: true, Name: true, WarrantyEnd: true }, take: 20, orderBy: { WarrantyEnd: "asc" } }),
      this.prisma.license.findMany({ where: { DeletedAt: null, IsActive: true, EndDate: { gte: now, lte: until } }, select: { Id: true, LicenseName: true, EndDate: true }, take: 20, orderBy: { EndDate: "asc" } }),
      this.prisma.maintenance.findMany({ where: { DeletedAt: null, IsClosed: false }, include: { Asset: { select: { AssetTag: true, Name: true } } }, take: 20, orderBy: { MaintenanceDate: "asc" } }),
    ]);
    return { data: { Warranties: warranties, Licenses: licenses, Maintenance: maintenance } };
  }
}
