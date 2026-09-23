import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { Sale } from './entities/sale.entity';
import { SaleDetail } from '@/sale-detail/entities/sale-detail.entity';
import { Product } from '@/product/entities/product.entity';
import { Empresa } from '@/empresa/entities/empresa.entity';
import { UserActiveInterface } from '@/common/interfaces/user-active.interface';
import { FilterSaleDto } from './dto/filterSale.dto';

@Injectable()
export class SaleService {
  constructor(
    @InjectRepository(Sale) private saleRepository: Repository<Sale>,
    @InjectRepository(Empresa) private empresaRepository: Repository<Empresa>,
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(SaleDetail)
    private saleDetailRepository: Repository<SaleDetail>,
    private dataSource: DataSource,
  ) {}

  async create(createSaleDto: CreateSaleDto, user: UserActiveInterface) {
    const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: user.id_empresa },
    });
    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Folio consecutivo (por empresa, si quieres foliar por empresa)
      const lastSale = await manager
        .createQueryBuilder(Sale, 'sale')
        .where('sale.id_empresa = :id_empresa', {
          id_empresa: empresa.id_empresa,
        })
        .orderBy('sale.id_sale', 'DESC')
        .getOne();

      const nextNumber = (lastSale?.id_sale ?? 0) + 1;
      const sale_number = `V-${nextNumber.toString().padStart(6, '0')}`;

      // 2. Crear la venta (total en 0 por ahora)
      const sale = manager.create(Sale, {
        sale_number,
        empresa,
        creatorUser: user.email ?? user.id.toString(),
        creatorName: user.name ?? undefined,
        total: 0,
      });
      await manager.save(sale);

      let total = 0;
      const details: SaleDetail[] = [];

      // 3. Recorrer los productos del carrito
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

        const detail = manager.create(SaleDetail, {
          sale,
          product,
          quantity: item.quantity,
          unit_price: product.price,
          subtotal,
        });
        details.push(detail);

        // 4. Descontar stock
        product.stock -= item.quantity;
        await manager.save(product);
      }

      await manager.save(details);

      // 5. Actualizar total de la venta
      sale.total = total;
      await manager.save(sale);

      // 6. Devolver la venta completa con relaciones
      return manager.findOne(Sale, {
        where: { id_sale: sale.id_sale },
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
    // Ojo: actualizar una venta (agregar/quitar productos) implica
    // recalcular stock y total. Normalmente en un POS no se "edita"
    // una venta, se cancela y se crea una nueva. Ver nota abajo.
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

      // Regresar el stock al cancelar/eliminar la venta
      for (const detail of sale.details) {
        detail.product.stock += detail.quantity;
        await manager.save(detail.product);
      }

      await manager.remove(sale);
      return { message: `Venta #${id} eliminada y stock restaurado` };
    });
  }
}
