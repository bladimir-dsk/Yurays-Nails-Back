import { Module } from '@nestjs/common';
import { SaleDetailService } from './sale-detail.service';
import { SaleDetailController } from './sale-detail.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleDetail } from './entities/sale-detail.entity';
import { Sale } from '@/sale/entities/sale.entity';
import { Product } from '@/product/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SaleDetail, Sale, Product])],
  controllers: [SaleDetailController],
  providers: [SaleDetailService],
  exports: [SaleDetailService],
})
export class SaleDetailModule {}
