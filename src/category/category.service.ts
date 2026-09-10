import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Empresa } from '@/empresa/entities/empresa.entity';
import { UserActiveInterface } from '@/common/interfaces/user-active.interface';
import { FilterCategoryDto } from './dto/filterCategory.dto';

@Injectable()
export class CategoryService {

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, user: UserActiveInterface) {
    const empresa = await this.empresaRepository.findOne({
      where: {
        id_empresa: user.id_empresa,
      },
    });
    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }
    //validar que el nombre no se repita
    const name = await this.categoryRepository.findOne({
      where: {
        name: createCategoryDto.name,
        empresa: {
          id_empresa: user.id_empresa,
        },
      },
    });
    if (name) {
      throw new BadRequestException('Nombre de categoría ya existe');
    }
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      empresa,
      creatorName: user.name,
      creatorUser: user.email,
    });
    return await this.categoryRepository.save(category);
  }

  async findAll(filterCategoryDto: FilterCategoryDto, user: UserActiveInterface) {
    const {page, limit, name} = filterCategoryDto;
    const query = this.categoryRepository
    .createQueryBuilder('category')
    .leftJoinAndSelect('category.empresa', 'empresa')
    .where('empresa.id_empresa = :id_empresa', { id_empresa: user.id_empresa });


     if (name) {
    query.andWhere('category.name ILIKE :name', {
      name: `%${name}%`,
    });
  }

    const shouldPaginate = !!page && !!limit;

    if (shouldPaginate) {
      query.skip((page - 1) * limit).take(limit);
    }

    const [data, total] = await query.getManyAndCount();

    return{
      data,
      meta: {
        total,
        page: page ?? null,
        limit: limit ?? null,
        totalPages: shouldPaginate ? Math.ceil(total / limit) : null,
      }
    }

  }

  async findOne(id: number, user: UserActiveInterface) {
    const category = await this.categoryRepository.findOne({
      where: {
        id_category: id,
        empresa: {
          id_empresa: user.id_empresa,
        },
      },
    });
    if (!category) {
      throw new BadRequestException('Category no encontrada');
    }
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto, user: UserActiveInterface) {
    const category = await this.findOne(id, user);
    if (!category) {
      throw new BadRequestException('Category no encontrada');
    }
    //validar que el nombre no se repita
    const name = await this.categoryRepository.findOne({
      where: {
        name: updateCategoryDto.name,
        empresa: {
          id_empresa: user.id_empresa,
        },
      },
    });
    if (name && name.id_category !== id) {
      throw new BadRequestException('Nombre de categoría ya existe');
    }
    return await this.categoryRepository.save({
      ...category,
      ...updateCategoryDto,
    });
  }

  async remove(id: number, user: UserActiveInterface) {
    const category = await this.findOne(id, user);
    if (!category) {
      throw new BadRequestException('Category no encontrada');
    }
    return await this.categoryRepository.remove(category);
  }
}
