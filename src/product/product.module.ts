import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Empresa } from '@/empresa/entities/empresa.entity';
import { Category } from '@/category/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Empresa, Category])],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
