import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsISO31661Alpha2, IsOptional, IsPhoneNumber, IsString, Length, MaxLength } from 'class-validator';

export class CreateDeliveryAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;

  @IsString()
  @MaxLength(80)
  firstName: string;

  @IsString()
  @MaxLength(80)
  lastName: string;

  @IsPhoneNumber()
  phoneNumber: string;

  @IsString()
  @MaxLength(160)
  addressLine1: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  addressLine2?: string;

  @IsString()
  @MaxLength(80)
  city: string;

  @IsString()
  @MaxLength(80)
  state: string;

  @IsString()
  @Length(2, 20)
  postalCode: string;

  @Transform(({ value }) => typeof value === 'string' ? value.toUpperCase() : value)
  @IsISO31661Alpha2()
  countryCode: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateDeliveryAddressDto extends PartialType(CreateDeliveryAddressDto) {}
