// src/sale-detail/entities/sale-detail.entity.ts
import { Product } from '@/product/entities/product.entity';
import { Sale } from '@/sale/entities/sale.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';

@Entity('sale_details')
export class SaleDetail {
  @PrimaryGeneratedColumn()
  id_sale_detail: number;

  @ManyToOne(() => Sale, (sale) => sale.details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_sale' })
  sale: Sale;

  @ManyToOne(() => Product, (product) => product.saleDetails)
  @JoinColumn({ name: 'id_product' })
  product: Product;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;
}
