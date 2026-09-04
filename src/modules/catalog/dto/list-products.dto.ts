import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListProductsDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  query?: string;

  @IsOptional()
  @IsIn(['newest', 'name', 'price_asc', 'price_desc'])
  sort: 'newest' | 'name' | 'price_asc' | 'price_desc' = 'newest';

  @IsOptional() @IsString() @MaxLength(48)
  colour?: string;

  @IsOptional() @IsString() @MaxLength(24)
  size?: string;

  @IsOptional() @IsString() @MaxLength(64)
  tag?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  minPrice?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  maxPrice?: number;

  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @Max(48)
  limit = 24;
}
