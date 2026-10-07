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
import { SaleService } from './sale.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { Role } from '@/common/enums/rol.enum';
import { Auth } from '@/auth/decorators/auth.decorator';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ActiveUser } from '@/common/decorators/active-user.decorator';
import { UserActiveInterface } from '@/common/interfaces/user-active.interface';
import { FilterSaleDto } from './dto/filterSale.dto';

@Auth([Role.ADMIN, Role.EMPLEADO])
@ApiTags('Sales')
@ApiBearerAuth('jwt')
@Controller('sale')
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  @Post()
  create(
    @Body() createSaleDto: CreateSaleDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.saleService.create(createSaleDto, user);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sale_number', required: false, type: String })
  findAll(
    @ActiveUser() user: UserActiveInterface,
    @Query() filterSaleDto: FilterSaleDto,
  ) {
    return this.saleService.findAll(user, filterSaleDto);
  }

  @Get('stats/daily')
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    example: '2026-09-01',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    example: '2026-09-24',
  })
  getDailyStats(
    @ActiveUser() user: UserActiveInterface,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.saleService.getDailyStats(user, from, to);
  }

  @Get('stats/weekly')
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    example: '2026-09-24',
  })
  getWeeklySales(
    @ActiveUser() user: UserActiveInterface,
    @Query('date') date?: string,
  ) {
    return this.saleService.getWeeklySales(user, date);
  }

  @Get(':id')
  findOne(@Param('id') id: number, @ActiveUser() user: UserActiveInterface) {
    return this.saleService.findOne(+id, user);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateSaleDto: UpdateSaleDto) {
    return this.saleService.update(+id, updateSaleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number, @ActiveUser() user: UserActiveInterface) {
    return this.saleService.remove(+id, user);
  }
}
