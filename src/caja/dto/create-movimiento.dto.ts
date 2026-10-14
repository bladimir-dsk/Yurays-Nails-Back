import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsIn } from 'class-validator';

export class CreateMovimientoDto {
  @ApiProperty({
    description: 'Monto del movimiento',
    example: 50,
  })
  @IsNumber()
  monto: number;

  @ApiProperty({
    description: 'Tipo de movimiento: entrada o salida',
    enum: ['entrada', 'salida'],
    example: 'salida',
  })
  @IsString()
  @IsIn(['entrada', 'salida'])
  tipo: string;

  @ApiProperty({
    description: 'Descripción del movimiento (ej: compra de insumos, retiro, etc)',
    required: false,
    example: 'Compra de bolsas',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({
    description: 'Referencia opcional (ej: número de factura, ticket, etc)',
    required: false,
    example: 'FAC-001',
  })
  @IsOptional()
  @IsString()
  referencia?: string;
}
