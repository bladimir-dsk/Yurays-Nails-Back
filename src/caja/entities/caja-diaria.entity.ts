import { Empresa } from '@/empresa/entities/empresa.entity';
import { MovimientoCaja } from '@/caja/entities/movimiento-caja.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

@Entity('caja_diaria')
export class CajaDiaria {
  @PrimaryGeneratedColumn()
  id_caja: number;

  @Column({ type: 'timestamp' })
  fecha: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  saldo_inicial: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_entradas: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_salidas: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  saldo_final: number;

  @Column({ default: 'abierta' })
  estado: string;

  @ManyToOne(() => Empresa, (empresa) => empresa.cajas)
  @JoinColumn({ name: 'id_empresa' })
  empresa: Empresa;

  @OneToMany(() => MovimientoCaja, (movimiento) => movimiento.caja, {
    cascade: true,
  })
  movimientos: MovimientoCaja[];

  @Column({ nullable: true })
  creatorUser: string;

  @Column({ nullable: true })
  creatorName: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;
}
