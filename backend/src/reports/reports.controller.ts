import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import {
  BatchReportQueryDto,
  ExpiryReportQueryDto,
  LowStockReportQueryDto,
  ProductReportQueryDto,
  StockMovementReportQueryDto,
} from './dto/report-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('stock-movement')
  getStockMovement(@Query() query: StockMovementReportQueryDto) {
    return this.reportsService.getStockMovementReport(query);
  }

  @Get('low-stock')
  getLowStock(@Query() query: LowStockReportQueryDto) {
    return this.reportsService.getLowStockReport(query);
  }

  @Get('expiry')
  getExpiry(@Query() query: ExpiryReportQueryDto) {
    return this.reportsService.getExpiryReport(query);
  }

  @Get('batches')
  getBatches(@Query() query: BatchReportQueryDto) {
    return this.reportsService.getBatchReport(query);
  }

  @Get('products')
  getProducts(@Query() query: ProductReportQueryDto) {
    return this.reportsService.getProductReport(query);
  }

  @Get('dashboard')
  getDashboard() {
    return this.reportsService.getDashboardSummary();
  }
}
