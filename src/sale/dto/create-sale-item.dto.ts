// src/sale/dto/create-sale-item.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateSaleItemDto {
  @IsInt()
  @IsPositive()
  @ApiProperty()
  id_product: number;

  @IsInt()
  @IsPositive()
  @ApiProperty()
  quantity: number;
}
