import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { CajaService } from './caja.service';
import { CreateCajaDto } from './dto/create-caja.dto';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { Role } from '@/common/enums/rol.enum';
import { Auth } from '@/auth/decorators/auth.decorator';
import { ApiBearerAuth, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ActiveUser } from '@/common/decorators/active-user.decorator';
import { UserActiveInterface } from '@/common/interfaces/user-active.interface';
import { FilterBoxDto } from './dto/filterBox.dto';

@Auth([Role.ADMIN, Role.EMPLEADO])
@ApiTags('Caja')
@ApiBearerAuth('jwt')
@Controller('caja')
export class CajaController {
  constructor(private readonly cajaService: CajaService) {}

  @Post()
  create(
    @Body() createCajaDto: CreateCajaDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.cajaService.create(createCajaDto, user);
  }

  @Get()
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
  })
  findAll(
    @ActiveUser() user: UserActiveInterface,
    @Query() filterBoxDto: FilterBoxDto,
  ) {
    return this.cajaService.findAll(user, filterBoxDto);
  }

  @Get('hoy')
  getCajaDelDia(@ActiveUser() user: UserActiveInterface) {
    return this.cajaService.getCajaDelDia(user);
  }

  @Get('fecha/:fecha')
  @ApiQuery({
    name: 'fecha',
    required: true,
    type: String,
    example: '2026-10-13',
  })
  getCajaByFecha(
    @Param('fecha') fecha: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.cajaService.getCajaByFecha(fecha, user);
  }

  @Get(':id')
  findOne(@Param('id') id: number, @ActiveUser() user: UserActiveInterface) {
    return this.cajaService.findOne(+id, user);
  }

  @Post(':id/movimiento')
  addMovimiento(
    @Param('id') id: number,
    @Body() createMovimientoDto: CreateMovimientoDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.cajaService.addMovimiento(id, createMovimientoDto, user);
  }

  @Post('movimiento/hoy')
  addMovimientoHoy(
    @Body() createMovimientoDto: CreateMovimientoDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.cajaService.addMovimiento(null, createMovimientoDto, user);
  }

  @Post(':id/cerrar')
  cerrarCaja(@Param('id') id: number, @ActiveUser() user: UserActiveInterface) {
    return this.cajaService.cerrarCaja(id, user);
  }
}
