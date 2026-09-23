import { PartialType } from '@nestjs/swagger';
import { CreateSaleDetailDto } from './create-sale-detail.dto';

export class UpdateSaleDetailDto extends PartialType(CreateSaleDetailDto) {}
