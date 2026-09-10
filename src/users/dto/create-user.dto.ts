import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

class EmpresaDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  rfc?: string;
}

export class CreateUserDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  password: string;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  @IsOptional() // Marca la propiedad como opcional
  @ValidateNested() // Valida el objeto anidado
  @Type(() => EmpresaDto) // Transforma el objeto anidado
  empresa?: EmpresaDto;
}
