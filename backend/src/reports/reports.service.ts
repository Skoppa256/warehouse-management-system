import { Injectable } from '@nestjs/common';
import { MovementType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  BatchReportQueryDto,
  ExpiryReportQueryDto,
  LowStockReportQueryDto,
  ProductReportQueryDto,
  StockMovementReportQueryDto,
} from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStockMovementReport(query: StockMovementReportQueryDto) {
    const {
      startDate,
      endDate,
      productId,
      type,
      fromLocationId,
      toLocationId,
      createdById,
      page,
      pageSize,
    } = query;

    const where: Prisma.StockMovementWhereInput = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as any).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as any).lte = new Date(endDate);
      }
    }

    if (productId) where.productId = productId;
    if (type) where.type = type as MovementType;
    if (fromLocationId) where.fromLocationId = fromLocationId;
    if (toLocationId) where.toLocationId = toLocationId;
    if (createdById) where.userId = createdById;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.stockMovement.count({ where }),
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          product: true,
          batch: true,
          inventory: true,
          fromLocation: true,
          toLocation: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      data: rows,
      meta: {
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
      },
    };
  }

  async getLowStockReport(query: LowStockReportQueryDto) {
    const { search, category } = query;

    const products = await this.prisma.product.findMany({
      where: {
        isDeleted: false,
        ...(category && { category }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        inventory: {
          select: {
            quantity: true,
          },
        },
      },
    });

    const data = products
      .map((p) => {
        const totalStock = p.inventory.reduce(
          (sum, inv) => sum + inv.quantity,
          0,
        );

        return {
          productId: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category,
          brand: p.brand,
          uom: p.uom,
          totalStock,
          lowStockThreshold: p.lowStockThreshold,
          difference: totalStock - p.lowStockThreshold,
        };
      })
      .filter((row) => row.totalStock < row.lowStockThreshold)
      .sort((a, b) => a.difference - b.difference);

    return { data };
  }

  async getExpiryReport(query: ExpiryReportQueryDto) {
    const { beforeDate, afterDate, productId } = query;

    const where: Prisma.InventoryWhereInput = {
      quantity: { gt: 0 },
      batch: {
        isDeleted: false,
      },
    };

    if (productId) {
      where.productId = productId;
    }

    if (beforeDate || afterDate) {
      (where.batch as any).expiryDate = {};
      if (afterDate) {
        (where.batch as any).expiryDate.gte = new Date(afterDate);
      }
      if (beforeDate) {
        (where.batch as any).expiryDate.lte = new Date(beforeDate);
      }
    }

    const rows = await this.prisma.inventory.findMany({
      where,
      include: {
        product: true,
        batch: true,
        location: true,
      },
      orderBy: {
        batch: {
          expiryDate: 'asc',
        },
      },
    });

    const data = rows.map((row) => ({
      inventoryId: row.id,
      productId: row.productId,
      productName: row.product.name,
      sku: row.product.sku,
      batchId: row.batchId,
      batchNumber: row.batch.batchNumber,
      expiryDate: row.batch.expiryDate,
      quantity: row.quantity,
      locationId: row.locationId,
      locationCode: row.location.code,
    }));

    return { data };
  }

  async getBatchReport(query: BatchReportQueryDto) {
    const { productId, search } = query;

    const where: Prisma.InventoryWhereInput = {};

    if (productId) {
      where.productId = productId;
    }

    if (search) {
      where.product = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const rows = await this.prisma.inventory.findMany({
      where,
      include: {
        product: true,
        batch: true,
        location: true,
      },
      orderBy: [
        { product: { name: 'asc' } },
        { batch: { batchNumber: 'asc' } },
        { location: { code: 'asc' } },
      ],
    });

    const data = rows.map((row) => ({
      inventoryId: row.id,
      productId: row.productId,
      productName: row.product.name,
      sku: row.product.sku,
      batchId: row.batchId,
      batchNumber: row.batch.batchNumber,
      expiryDate: row.batch.expiryDate,
      locationId: row.locationId,
      locationCode: row.location.code,
      quantity: row.quantity,
    }));

    return { data };
  }

  async getProductReport(query: ProductReportQueryDto) {
    const { search, category } = query;

    const products = await this.prisma.product.findMany({
      where: {
        isDeleted: false,
        ...(category && { category }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        inventory: true,
        batches: true,
      },
      orderBy: { name: 'asc' },
    });

    const data = products.map((p) => {
      const totalStock = p.inventory.reduce(
        (sum, inv) => sum + inv.quantity,
        0,
      );

      const activeBatches = p.batches.filter((b) => !b.isDeleted);
      const nearestExpiry = activeBatches
        .slice()
        .sort(
          (a, b) => a.expiryDate.getTime() - b.expiryDate.getTime(),
        )[0]?.expiryDate;

      return {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        brand: p.brand,
        uom: p.uom,
        lowStockThreshold: p.lowStockThreshold,
        totalStock,
        totalBatches: activeBatches.length,
        nearestExpiry,
      };
    });

    return { data };
  }

  async getDashboardSummary() {
    const [totalProducts, totalSuppliers, totalCustomers] =
      await this.prisma.$transaction([
        this.prisma.product.count({}),
        this.prisma.supplier.count({}),
        this.prisma.customer.count({}),
      ]);

    return {
      totalProducts,
      totalSuppliers,
      totalCustomers,
    };
  }
}
