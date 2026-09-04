import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListOrdersDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}
