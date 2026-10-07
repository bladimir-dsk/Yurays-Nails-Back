import { Category } from '@/category/entities/category.entity';
import { Empresa } from '@/empresa/entities/empresa.entity';
import { SaleDetail } from '@/sale-detail/entities/sale-detail.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id_product: number;

  @Column()
  name: string;

  @Column({ nullable: true, unique: true })
  code: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 1, nullable: true })
  stock: number;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'id_category' })
  category: Category;

  @ManyToOne(() => Empresa, (empresa) => empresa.products)
  @JoinColumn({ name: 'id_empresa' })
  empresa: Empresa;

  @Column({ nullable: true })
  creatorUser: string;

  @Column({ nullable: true })
  creatorName: string;

  @OneToMany(() => SaleDetail, (detail) => detail.product)
  saleDetails: SaleDetail[];
}
