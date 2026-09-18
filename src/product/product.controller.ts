import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Auth } from '@/auth/decorators/auth.decorator';
import { Role } from '@/common/enums/rol.enum';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ActiveUser } from '@/common/decorators/active-user.decorator';
import { UserActiveInterface } from '@/common/interfaces/user-active.interface';
import { FilterProductDto } from './dto/filterProduct.dto';

@Auth([Role.ADMIN, Role.EMPLEADO])
@ApiTags('Product')
@ApiBearerAuth('jwt')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.productService.create(createProductDto, user);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'id_category', required: false, type: Number })
  @ApiQuery({ name: 'code', required: false, type: String })
  findAll(
    @ActiveUser() user: UserActiveInterface,
    @Query() filterProductDto: FilterProductDto,
  ) {
    return this.productService.findAll(filterProductDto, user);
  }

  @Get(':id')
  findOne(@Param('id') id: number, @ActiveUser() user: UserActiveInterface) {
    return this.productService.findOne(+id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updateProductDto: UpdateProductDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.productService.update(+id, updateProductDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: number, @ActiveUser() user: UserActiveInterface) {
    return this.productService.remove(+id, user);
  }
}
