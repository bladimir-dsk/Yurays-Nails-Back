//no usemos el src/../commo.....-- usaremos de manejar puras rutas relativas usando el ../../coommon
import { Empresa } from '@/empresa/entities/empresa.entity';
import { Role } from '@/common/enums/rol.enum';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Estatus } from '@/common/enums/estatus.enum';


@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  //el unique en el amail tiene que ser unico
  // el nullable quiere decir que ese campo no puede estar vacio
  @Column({ unique: true, nullable: false })
  email: string;

  //select: false es para que no se muestre en la respuesta de la peticion, en este caso no devuelve el resultado del password
  @Column({ nullable: false, select: false })
  password: string;

  //es de tipo enum
  //el rol por defecto lo va a guardar como user
  @Column({ type: 'enum', default: Role.CLIENTE, enum: Role }) //tipamos enum para que solo pueda resivir los tipos de roles del enum
  role: Role;

  //el estatus por defecto lo va a guardar como activo
  @Column({ type: 'enum', default: Estatus.ACTIVO, enum: Estatus })
  estatus: Estatus;

  //deletedatecolumn es para hacer eliminaciones logicas y no fisicas en la base de datos
  @DeleteDateColumn()
  deletedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ name: 'id_empresa', nullable: true })
  id_empresa: number;

  @ManyToOne(() => Empresa, (empresa) => empresa.users, {
    cascade: true, // Permite que al guardar un empleado también se guarde el contacto automáticamente
  })
  @JoinColumn({ name: 'id_empresa' })
  empresa: Empresa;

  // @OneToMany(() => Student, (student) => student.user)
  // students: Student[];
}
