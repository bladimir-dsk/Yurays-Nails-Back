import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  code?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  description?: string;

  @IsNumber()
  @ApiProperty()
  price: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  stock?: number;

  @IsInt()
  @ApiProperty()
  id_category: number;
}
