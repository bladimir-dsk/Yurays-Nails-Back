import {
  Controller,
  Get,
  Body,
  Patch,
} from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { ActiveUser } from '@/common/decorators/active-user.decorator';
import { UserActiveInterface } from '@/common/interfaces/user-active.interface';
import { Auth } from '@/auth/decorators/auth.decorator';
import { Role } from '@/common/enums/rol.enum';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('jwt')
@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Get()
  @Auth(Role.ADMIN)
  async getEmpresa(@ActiveUser() user: UserActiveInterface) {
    return this.empresaService.getEmpresa(user);
  }

  @Patch()
  @Auth(Role.ADMIN)
  async updateEmpresa(
    // @Param('id') id: number,
    @Body() updateEmpresaDto: UpdateEmpresaDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.empresaService.updateEmpresa(updateEmpresaDto, user);
  }
}
