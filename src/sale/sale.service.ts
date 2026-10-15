import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, Repository } from 'typeorm';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { Sale } from './entities/sale.entity';
import { SaleDetail } from '@/sale-detail/entities/sale-detail.entity';
import { Product } from '@/product/entities/product.entity';
import { Empresa } from '@/empresa/entities/empresa.entity';
import { UserActiveInterface } from '@/common/interfaces/user-active.interface';
import { FilterSaleDto } from './dto/filterSale.dto';
import { CajaService } from '@/caja/caja.service';

@Injectable()
export class SaleService {
  constructor(
    @InjectRepository(Sale) private saleRepository: Repository<Sale>,
    @InjectRepository(Empresa) private empresaRepository: Repository<Empresa>,
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(SaleDetail)
    private saleDetailRepository: Repository<SaleDetail>,
    private dataSource: DataSource,
    private cajaService: CajaService,
  ) {}

  async create(createSaleDto: CreateSaleDto, user: UserActiveInterface) {
    const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: user.id_empresa },
    });
    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }

    const caja = await this.cajaService.getCajaDelDia(user);
    if (caja.estado === 'cerrada') {
      throw new BadRequestException(
        'La caja del día está cerrada. Debe abrirla antes de realizar ventas.',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const lastSale = await manager
        .createQueryBuilder(Sale, 'sale')
        .where('sale.id_empresa = :id_empresa', {
          id_empresa: empresa.id_empresa,
        })
        .orderBy('sale.id_sale', 'DESC')
        .getOne();

      const nextNumber = (lastSale?.id_sale ?? 0) + 1;
      const saleNumber = `V-${nextNumber.toString().padStart(6, '0')}`;

      const newSale = manager.create(Sale, {
        sale_number: saleNumber,
        empresa,
        creatorUser: user.email ?? user.id.toString(),
        creatorName: user.name ?? undefined,
        total: 0,
      });
      await manager.save(newSale);

      let total = 0;
      const details: SaleDetail[] = [];

      for (const item of createSaleDto.items) {
        const product = await manager.findOne(Product, {
          where: {
            id_product: item.id_product,
            empresa: { id_empresa: empresa.id_empresa },
          },
        });

        if (!product) {
          throw new NotFoundException(
            `El producto con id ${item.id_product} no existe`,
          );
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para "${product.name}". Disponible: ${product.stock}`,
          );
        }

        const subtotal = Number(product.price) * item.quantity;
        total += subtotal;

        details.push(
          manager.create(SaleDetail, {
            sale: newSale,
            product,
            quantity: item.quantity,
            unit_price: product.price,
            subtotal,
          }),
        );

        product.stock -= item.quantity;
        await manager.save(product);
      }

      await manager.save(details);

      newSale.total = total;
      await manager.save(newSale);

      await this.cajaService.registrarVenta(
        total,
        newSale.id_sale,
        saleNumber,
        user,
        manager,
      );

      return manager.findOne(Sale, {
        where: { id_sale: newSale.id_sale },
        relations: ['details', 'details.product', 'empresa'],
      });
    });
  }

  async findAll(user: UserActiveInterface, filterSaleDto: FilterSaleDto) {
    const { page, limit, sale_number } = filterSaleDto;
    const query = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.empresa', 'empresa')
      .leftJoinAndSelect('sale.details', 'details')
      .leftJoinAndSelect('details.product', 'product')
      .orderBy('sale.createdAt', 'DESC')
      .where('empresa.id_empresa = :id_empresa', {
        id_empresa: user.id_empresa,
      });

    if (sale_number) {
      query.andWhere('sale.sale_number ILIKE :sale_number', {
        sale_number: `%${sale_number}%`,
      });
    }

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
    const sale = await this.saleRepository.findOne({
      where: { id_sale: id, empresa: { id_empresa: user.id_empresa } },
      relations: ['details', 'details.product', 'empresa'],
    });

    if (!sale) {
      throw new NotFoundException(`Venta #${id} no encontrada`);
    }

    return sale;
  }

  update(id: number, updateSaleDto: UpdateSaleDto) {
    return `This action updates a #${id} sale`;
  }

  async remove(id: number, user: UserActiveInterface) {
    return this.dataSource.transaction(async (manager) => {
      const sale = await manager.findOne(Sale, {
        where: { id_sale: id, empresa: { id_empresa: user.id_empresa } },
        relations: ['details', 'details.product'],
      });

      if (!sale) {
        throw new NotFoundException(`Venta #${id} no encontrada`);
      }

      const saleTotal = Number(sale.total);
      const saleNumber = sale.sale_number;

      for (const detail of sale.details) {
        detail.product.stock += detail.quantity;
        await manager.save(detail.product);
      }

      await manager.remove(sale);

      await this.cajaService.addMovimiento(
        null,
        {
          monto: saleTotal,
          tipo: 'salida',
          descripcion: 'Venta eliminada/cancelada',
          referencia: saleNumber,
        },
        user,
        manager,
      );

      return { message: `Venta #${id} eliminada y stock restaurado` };
    });
  }

  // GET /sale/stats/daily
  async getDailyStats(user: UserActiveInterface, from?: string, to?: string) {
    const end = to ? new Date(`${to}T23:59:59.999`) : new Date();
    const start = from ? new Date(`${from}T00:00:00`) : new Date(end);
    if (!from) {
      start.setDate(end.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    }

    const rows = await this.saleRepository
      .createQueryBuilder('sale')
      .innerJoin('sale.empresa', 'empresa')
      .select("TO_CHAR(DATE(sale.createdAt), 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(sale.id_sale)', 'total_sales')
      .addSelect('COALESCE(SUM(sale.total), 0)', 'total_amount')
      .where('empresa.id_empresa = :id_empresa', {
        id_empresa: user.id_empresa,
      })
      .andWhere('sale.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('DATE(sale.createdAt)')
      .orderBy('DATE(sale.createdAt)', 'ASC')
      .getRawMany();

    const data = rows.map((r) => ({
      date: r.date,
      total_sales: Number(r.total_sales),
      total_amount: Number(r.total_amount),
    }));

    return {
      data,
      summary: {
        total_sales: data.reduce((acc, d) => acc + d.total_sales, 0),
        total_amount: data.reduce((acc, d) => acc + d.total_amount, 0),
      },
    };
  }

  // GET /sale/stats/weekly
  async getWeeklySales(user: UserActiveInterface, date?: string) {
    const ref = date ? new Date(`${date}T00:00:00`) : new Date();

    // Lunes de la semana
    const dayOfWeek = ref.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const start = new Date(ref);
    start.setDate(ref.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const sales = await this.saleRepository.find({
      where: {
        empresa: { id_empresa: user.id_empresa },
        createdAt: Between(start, end),
      },
      select: {
        id_sale: true,
        sale_number: true,
        createdAt: true,
        total: true,
      },
      order: { createdAt: 'ASC' },
    });

    const dias = [
      'domingo',
      'lunes',
      'martes',
      'miércoles',
      'jueves',
      'viernes',
      'sábado',
    ];

    return {
      week: { start, end },
      data: sales.map((s) => ({
        id_sale: s.id_sale,
        sale_number: s.sale_number,
        createdAt: s.createdAt,
        day: dias[new Date(s.createdAt).getDay()],
        total: Number(s.total),
      })),
    };
  }
}
