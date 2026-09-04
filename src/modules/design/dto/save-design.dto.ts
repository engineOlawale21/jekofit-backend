import { IsBoolean, IsHexColor, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
export class SaveDesignDto {
  @IsString() @MaxLength(80) name: string;
  @IsOptional() @IsString() @MaxLength(80) productName?: string;
  @IsHexColor() garmentColour: string;
  @IsOptional() @IsObject() canvas?: Record<string, unknown>;
  @IsOptional() @IsBoolean() isFavourite?: boolean;
}
