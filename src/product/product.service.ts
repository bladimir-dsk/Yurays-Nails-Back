import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { Empresa } from '@/empresa/entities/empresa.entity';
import { Category } from '@/category/entities/category.entity';
import { UserActiveInterface } from '@/common/interfaces/user-active.interface';
import { FilterProductDto } from './dto/filterProduct.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createProductDto: CreateProductDto, user: UserActiveInterface) {
    const empresa = await this.empresaRepository.findOne({
      where: {
        id_empresa: user.id_empresa,
      },
    });
    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }
    const category = await this.categoryRepository.findOne({
      where: {
        id_category: createProductDto.id_category,
      },
    });
    if (!category) {
      throw new BadRequestException('Categoría no encontrada');
    }

    //codigo ya existe
    const code = await this.productRepository.findOne({
      where: {
        code: createProductDto.code,
        empresa: {
          id_empresa: user.id_empresa,
        },
      },
    });

    if (code) {
      throw new BadRequestException('El codigo ya existe en otro producto');
    }

    const product = this.productRepository.create({
      ...createProductDto,
      empresa,
      category,
      creatorName: user.name,
      creatorUser: user.email,
    });
    return await this.productRepository.save(product);
  }

  async findAll(filterProductDto: FilterProductDto, user: UserActiveInterface) {
    const { page, limit, name, id_category, code } = filterProductDto;
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.empresa', 'empresa')
      .leftJoinAndSelect('product.category', 'category')
      .where('empresa.id_empresa = :id_empresa', {
        id_empresa: user.id_empresa,
      });

    if (name) {
      query.andWhere('product.name ILIKE :name', {
        name: `%${name}%`,
      });
    }

    if (code) {
      query.andWhere('product.code ILIKE :code', {
        code: `%${code}%`,
      });
    }

    if (id_category) {
      query.andWhere('product.id_category = :id_category', {
        id_category,
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
    const product = await this.productRepository.findOne({
      where: {
        id_product: id,
        empresa: {
          id_empresa: user.id_empresa,
        },
      },
      relations: ['category'],
    });
    if (!product) {
      throw new BadRequestException('Producto no encontrado');
    }
    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    user: UserActiveInterface,
  ) {
    const product = await this.productRepository.findOne({
      where: {
        id_product: id,
        empresa: {
          id_empresa: user.id_empresa,
        },
      },
      relations: ['category'],
    });
    if (!product) {
      throw new BadRequestException('Producto no encontrado');
    }

    ///validar codigo
    const code = await this.productRepository.findOne({
      where: {
        code: updateProductDto.code,
        empresa: {
          id_empresa: user.id_empresa,
        },
      },
    });
    if (code && code.id_product !== id) {
      throw new BadRequestException('El codigo ya existe');
    }

    return await this.productRepository.save({
      ...product,
      ...updateProductDto,
    });
  }

  async remove(id: number, user: UserActiveInterface) {
    const product = await this.productRepository.findOne({
      where: {
        id_product: id,
        empresa: {
          id_empresa: user.id_empresa,
        },
      },
    });
    if (!product) {
      throw new BadRequestException('Producto no encontrado');
    }
    return await this.productRepository.remove(product);
  }

  async findByCode(code: string, user: UserActiveInterface): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: {
        code,
        empresa: { id_empresa: user.id_empresa },
      },
      relations: ['category'],
    });

    if (!product) {
      throw new BadRequestException(
        `No existe un producto con el código "${code}"`,
      );
    }

    return product;
  }
}
