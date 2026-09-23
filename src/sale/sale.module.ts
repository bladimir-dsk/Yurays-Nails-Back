import { Module } from '@nestjs/common';
import { SaleService } from './sale.service';
import { SaleController } from './sale.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './entities/sale.entity';
import { Empresa } from '@/empresa/entities/empresa.entity';
import { Product } from '@/product/entities/product.entity';
import { SaleDetail } from '@/sale-detail/entities/sale-detail.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, Empresa, Product, SaleDetail])],
  controllers: [SaleController],
  providers: [SaleService],
  exports: [SaleService],
})
export class SaleModule {}
