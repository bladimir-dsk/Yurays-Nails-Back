import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateCajaDto {
  @ApiProperty({
    description:
      'Fecha de la caja (YYYY-MM-DD), si no se proporciona usa la fecha actual',
    required: false,
    example: '2026-10-13',
  })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiProperty({
    description: 'Saldo inicial de la caja',
    example: 200,
  })
  @IsNumber()
  saldo_inicial: number;
}
