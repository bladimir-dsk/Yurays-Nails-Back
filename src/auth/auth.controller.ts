import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Patch,
  Param,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Request } from 'express';

import { Role } from '@/common/enums/rol.enum';
import { Auth } from './decorators/auth.decorator';
import { ActiveUser } from '@/common/decorators/active-user.decorator';
import { UserActiveInterface } from '@/common/interfaces/user-active.interface';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

//creamos una interfaz para poner el reques del profile y extender el reques
interface RequestWithUser extends Request {
  user: {
    email: string;
    role: string;
  };
}
@ApiBearerAuth('jwt')
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register') //registramos un usuario
  register(
    @Body()
    registerDto: RegisterDto,
  ) {
    return this.authService.register(registerDto);
  }
  @Post('login') //generamos el token de acceso del usuario
  login(
    @Body()
    loginDto: LoginDto,
  ) {
    return this.authService.login(loginDto);
  }

  // @Get('profile')// ruta que nos da acceso dependiendo del rol
  // @Roles(Role.ADMIN)//Role viene del enum
  // @UseGuards(AuthGuard, RolesGuard)
  // profile(@Req() req: RequestWithUser) {
  // return this.authService.profile(req.user)
  // }

  @Get('profile') // ruta que nos da acceso dependiendo del rol
  @Auth([Role.ADMIN, Role.EMPLEADO, Role.CLIENTE]) //auth es un decorador que une los guards y los roles
  profile(@ActiveUser() user: UserActiveInterface) {
    return this.authService.profile(user);
  }

  @Auth(Role.ADMIN)
  @Get('usuarios')
  usuarios(@ActiveUser() user: UserActiveInterface) {
    return this.authService.usuarios(user);
  }

  @Auth(Role.ADMIN)
  @Get('usuarios-empresa')
  usuariosEmpresa(@ActiveUser() user: UserActiveInterface) {
    return this.authService.usuariosEmpresa(user);
  }

  @Auth(Role.ADMIN)
  @Get('usuarios-empleado')
  usuariosEmpleado(@ActiveUser() user: UserActiveInterface) {
    return this.authService.usuariosEmpleado(user);
  }

  @Auth([Role.ADMIN, Role.EMPLEADO, Role.CLIENTE])
  @Get('yo')
  me(@ActiveUser() user: UserActiveInterface) {
    return this.authService.me(user);
  }
}
