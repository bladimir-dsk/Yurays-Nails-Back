import { Module } from '@nestjs/common';
import { CajaService } from './caja.service';
import { CajaController } from './caja.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CajaDiaria } from './entities/caja-diaria.entity';
import { MovimientoCaja } from './entities/movimiento-caja.entity';
import { Empresa } from '@/empresa/entities/empresa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CajaDiaria, MovimientoCaja, Empresa])],
  controllers: [CajaController],
  providers: [CajaService],
  exports: [CajaService],
})
export class CajaModule {}
