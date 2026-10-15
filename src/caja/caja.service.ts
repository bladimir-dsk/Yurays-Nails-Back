import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository, Between } from 'typeorm';
import { CreateCajaDto } from './dto/create-caja.dto';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { CajaDiaria } from './entities/caja-diaria.entity';
import { MovimientoCaja } from './entities/movimiento-caja.entity';
import { Empresa } from '@/empresa/entities/empresa.entity';
import { UserActiveInterface } from '@/common/interfaces/user-active.interface';
import dayjs from 'dayjs';
import { FilterBoxDto } from './dto/filterBox.dto';

@Injectable()
export class CajaService {
  constructor(
    @InjectRepository(CajaDiaria)
    private cajaRepository: Repository<CajaDiaria>,
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
    @InjectRepository(MovimientoCaja)
    private movimientoRepository: Repository<MovimientoCaja>,
    private dataSource: DataSource,
  ) {}

  async create(createCajaDto: CreateCajaDto, user: UserActiveInterface) {
    const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: user.id_empresa },
    });
    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }

    let fecha: Date;
    if (createCajaDto.fecha) {
      fecha = dayjs(createCajaDto.fecha).startOf('day').toDate();
    } else {
      fecha = dayjs().startOf('day').toDate();
    }

    const existingCaja = await this.cajaRepository.findOne({
      where: {
        empresa: { id_empresa: empresa.id_empresa },
        fecha: fecha,
      },
    });

    if (existingCaja) {
      const fechaStr = dayjs(existingCaja.fecha).format('YYYY-MM-DD');
      throw new BadRequestException(
        `Ya existe una caja para la fecha ${fechaStr}`,
      );
    }

    const caja = this.cajaRepository.create({
      fecha: fecha,
      saldo_inicial: Number(createCajaDto.saldo_inicial),
      total_entradas: 0,
      total_salidas: 0,
      saldo_final: Number(createCajaDto.saldo_inicial),
      estado: 'abierta',
      empresa,
      creatorUser: user.email ?? user.id.toString(),
      creatorName: user.name ?? undefined,
    });

    return this.cajaRepository.save(caja);
  }

  async getCajaDelDia(user: UserActiveInterface) {
    const hoy = dayjs().startOf('day').toDate();

    const caja = await this.cajaRepository.findOne({
      where: {
        empresa: { id_empresa: user.id_empresa },
        fecha: hoy,
      },
      relations: ['movimientos'],
    });

    if (!caja) {
      throw new NotFoundException(
        'No hay caja abierta para el día de hoy. Crea una caja primero.',
      );
    }

    return caja;
  }

  async getCajaByFecha(fecha: string, user: UserActiveInterface) {
  const dia = dayjs(fecha, 'YYYY-MM-DD', true); // true = formato estricto
  if (!dia.isValid()) {
    throw new BadRequestException('Fecha inválida, usa el formato YYYY-MM-DD');
  }

  const caja = await this.cajaRepository.findOne({
    where: {
      empresa: { id_empresa: user.id_empresa },
      fecha: Between(dia.startOf('day').toDate(), dia.endOf('day').toDate()),
    },
    relations: ['movimientos'],
  });

  if (!caja) {
    throw new NotFoundException(`No hay caja para la fecha ${fecha}`);
  }

  return caja;
}

  async findAll(user: UserActiveInterface, filterBoxDto: FilterBoxDto) {
    const { page, limit } = filterBoxDto;
    const query = this.cajaRepository
      .createQueryBuilder('caja')
      .leftJoinAndSelect('caja.empresa', 'empresa')
      .orderBy('caja.fecha', 'DESC')
      .where('empresa.id_empresa = :id_empresa', {
        id_empresa: user.id_empresa,
      });

    const shouldPaginate = !!page && !!limit;

    if (shouldPaginate) {
      query.skip((page - 1) * limit).take(limit);
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page: page ?? null,
        limit: limit ?? null,
        totalPages: shouldPaginate ? Math.ceil(total / limit) : null,
      },
    };
  }

  async findOne(id: number, user: UserActiveInterface) {
    const caja = await this.cajaRepository.findOne({
      where: { id_caja: id, empresa: { id_empresa: user.id_empresa } },
      relations: ['movimientos'],
    });

    if (!caja) {
      throw new NotFoundException(`Caja #${id} no encontrada`);
    }

    return caja;
  }

  async addMovimiento(
    idCaja: number | null,
    createMovimientoDto: CreateMovimientoDto,
    user: UserActiveInterface,
    externalManager?: EntityManager,
  ) {
    const run = async (manager: EntityManager) => {
      let caja: CajaDiaria | null;

      if (idCaja) {
        caja = await manager.findOne(CajaDiaria, {
          where: {
            id_caja: idCaja,
            empresa: { id_empresa: user.id_empresa },
          },
        });

        if (!caja) {
          throw new NotFoundException(`Caja #${idCaja} no encontrada`);
        }
      } else {
        const hoy = dayjs().startOf('day').toDate();

        caja = await manager.findOne(CajaDiaria, {
          where: {
            empresa: { id_empresa: user.id_empresa },
            fecha: hoy,
          },
        });

        if (!caja) {
          throw new NotFoundException('No hay caja abierta para el día de hoy');
        }
      }

      if (caja.estado === 'cerrada') {
        throw new BadRequestException(
          'No se pueden agregar movimientos a una caja cerrada',
        );
      }

      // Solo se permiten movimientos en la caja del día actual
      if (!dayjs(caja.fecha).isSame(dayjs(), 'day')) {
        throw new BadRequestException(
          'Solo se pueden agregar movimientos a la caja del día actual',
        );
      }

      const movimiento = manager.create(MovimientoCaja, {
        monto: createMovimientoDto.monto,
        tipo: createMovimientoDto.tipo,
        descripcion: createMovimientoDto.descripcion,
        referencia: createMovimientoDto.referencia,
        caja,
        creatorUser: user.email ?? user.id.toString(),
        creatorName: user.name ?? undefined,
      });

      await manager.save(movimiento);

      if (createMovimientoDto.tipo === 'entrada') {
        caja.total_entradas =
          Number(caja.total_entradas) + createMovimientoDto.monto;
      } else {
        caja.total_salidas =
          Number(caja.total_salidas) + createMovimientoDto.monto;
      }

      caja.saldo_final =
        Number(caja.saldo_inicial) +
        Number(caja.total_entradas) -
        Number(caja.total_salidas);

      await manager.save(caja);

      return manager.findOne(CajaDiaria, {
        where: { id_caja: caja.id_caja },
        relations: ['movimientos'],
      });
    };

    // Si ya viene dentro de una transacción, la reutiliza
    return externalManager
      ? run(externalManager)
      : this.dataSource.transaction(run);
  }

  async cerrarCaja(id: number, user: UserActiveInterface) {
    const caja = await this.cajaRepository.findOne({
      where: { id_caja: id, empresa: { id_empresa: user.id_empresa } },
    });

    if (!caja) {
      throw new NotFoundException(`Caja #${id} no encontrada`);
    }

    if (caja.estado === 'cerrada') {
      throw new BadRequestException('La caja ya está cerrada');
    }

    caja.estado = 'cerrada';
    caja.closedAt = new Date();

    return this.cajaRepository.save(caja);
  }

  async registrarVenta(
    monto: number,
    ventaId: number,
    ventaNumero: string,
    user: UserActiveInterface,
    externalManager?: EntityManager,
  ) {
    const run = async (manager: EntityManager) => {
      const hoy = dayjs().startOf('day').toDate();

      const caja = await manager.findOne(CajaDiaria, {
        where: {
          empresa: { id_empresa: user.id_empresa },
          fecha: hoy,
        },
      });

      if (!caja) {
        throw new BadRequestException(
          'No hay caja abierta para el día de hoy. Debe abrir una caja antes de realizar ventas.',
        );
      }

      if (caja.estado === 'cerrada') {
        throw new BadRequestException(
          'La caja del día está cerrada. Debe abrirla antes de realizar ventas.',
        );
      }

      const movimiento = manager.create(MovimientoCaja, {
        monto,
        tipo: 'entrada',
        descripcion: 'Venta registrada',
        referencia: ventaNumero,
        caja,
        creatorUser: user.email ?? user.id.toString(),
        creatorName: user.name ?? undefined,
      });

      await manager.save(movimiento);

      caja.total_entradas = Number(caja.total_entradas) + monto;
      caja.saldo_final =
        Number(caja.saldo_inicial) +
        Number(caja.total_entradas) -
        Number(caja.total_salidas);

      await manager.save(caja);

      return caja;
    };

    return externalManager
      ? run(externalManager)
      : this.dataSource.transaction(run);
  }
}
