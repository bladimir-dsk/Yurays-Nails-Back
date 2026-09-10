import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Empresa } from '@/empresa/entities/empresa.entity';
import { UserActiveInterface } from '@/common/interfaces/user-active.interface';
import { Role } from '@/common/enums/rol.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}

  create(createUserDto: CreateUserDto) {
    return this.usersRepository.save(createUserDto);
  }

  //creamos un metodo para que me busque el usuario en la base de datos
  findOneByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
    });
  }
  //buscar por email con password
  //metodo que busca el email para que me traiga los daemas datos del usuario
  finByEmailWithPassword(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'password', 'role'],
      relations: ['empresa'],
    });
  }

  findAll() {
    return this.usersRepository.find({ relations: ['empresa', 'School'] });
  }

  findUsuariosEmpresa() {
    return this.usersRepository.find({
      where: {
        role: Role.ADMIN,
      },
      relations: ['empresa'],
    });
  }

  findUsuariosEmpleado() {
    return this.usersRepository.find({
      where: {
        role: Role.EMPLEADO,
      },
      relations: ['empresa'],
    });
  }

  findOne(id: number) {
    return this.usersRepository.findOneBy({ id });
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
  async miUsuario(user: UserActiveInterface) {
    return await this.usersRepository.findOne({
      where: { email: user.email },
      relations: ['empresa'], // Asegurar que empresa.pago está en las relaciones
    });
  }
}
