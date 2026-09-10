import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcryptjs from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { UserActiveInterface } from '@/common/interfaces/user-active.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  //en el register resivimos el registerDto que se comporta como RegisterDto
  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;

    // Verificar si el usuario ya existe
    const userExists = await this.usersService.findOneByEmail(email);
    if (userExists) {
      throw new BadRequestException('El email ya está registrado');
    }

    // Hashear la contraseña
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Crear el usuario sin empresa (por ahora)
    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    const newUser = await this.usersService.create(userData);

    return {
      message: 'Registro exitoso',
      user: newUser,
    };
  }
  async login({ email, password }: LoginDto) {
    const user = await this.usersService.finByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException(
        'El correo no existe en la base de datos',
      );
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña no es correcta');
    }

    const payload = {
      email: user.email,
      role: user.role,
      name: user.name,
      id: user.id,
      id_empresa: user.empresa ? user.empresa.id_empresa : null, // Asegúrate de que aquí no sea undefined
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      email,
      id_empresa: user.empresa ? user.empresa.id_empresa : null,
      role: user.role,
      id: user.id,
      name: user.name,
    };
  }

  async profile({ email, role }: { email: string; role: string }) {
    //VALIDAMOS QUE EL USUARIO CUMPLA CON EL ROL DE ADMIN PARA DEJARLO INGRESAR
    //if(role !== 'admin'){
    //    throw new UnauthorizedException('NO ESTAS AUTORIZADO PARA INGRESAR, DEBES DE SER ADMIN')
    // }

    return await this.usersService.findOneByEmail(email);
  }
  async usuarios(user: UserActiveInterface) {
    const users = await this.usersService.findAll();
    return users;
  }

  async usuariosEmpresa(user: UserActiveInterface) {
    const users = await this.usersService.findUsuariosEmpresa();
    return users;
  }

  async usuariosEmpleado(user: UserActiveInterface) {
    const users = await this.usersService.findUsuariosEmpleado();
    return users;
  }

  async me(user: UserActiveInterface) {
    const me = await this.usersService.miUsuario(user);
    return me;
  }
}
