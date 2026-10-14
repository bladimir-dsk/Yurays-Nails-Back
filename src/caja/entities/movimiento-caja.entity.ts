import { CajaDiaria } from './caja-diaria.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';

@Entity('movimiento_caja')
export class MovimientoCaja {
  @PrimaryGeneratedColumn()
  id_movimiento: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column()
  tipo: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  referencia: string;

  @ManyToOne(() => CajaDiaria, (caja) => caja.movimientos)
  @JoinColumn({ name: 'id_caja' })
  caja: CajaDiaria;

  @Column({ nullable: true })
  creatorUser: string;

  @Column({ nullable: true })
  creatorName: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
