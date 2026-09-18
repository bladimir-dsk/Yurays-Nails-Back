import { Empresa } from '@/empresa/entities/empresa.entity';
import { Product } from '@/product/entities/product.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id_category: number;

  @Column()
  name: string;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  @ManyToOne(() => Empresa, (empresa) => empresa.categories)
  @JoinColumn({ name: 'id_empresa' })
  empresa: Empresa;

  @Column({ nullable: true })
  creatorUser: string;

  @Column({ nullable: true })
  creatorName: string;
}
