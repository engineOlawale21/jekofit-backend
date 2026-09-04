import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCheckoutDetailsDto {
  @IsEmail()
  @MaxLength(254)
  contactEmail: string;

  @IsString() @IsNotEmpty() @MaxLength(80)
  firstName: string;

  @IsString() @IsNotEmpty() @MaxLength(80)
  lastName: string;

  @IsString() @IsNotEmpty() @MaxLength(160)
  addressLine1: string;

  @IsOptional() @IsString() @MaxLength(160)
  addressLine2?: string;

  @IsString() @IsNotEmpty() @MaxLength(80)
  city: string;

  @IsString() @IsNotEmpty() @MaxLength(80)
  state: string;

  @IsString() @IsNotEmpty() @MaxLength(2)
  country: string;

  @IsString() @IsNotEmpty() @MaxLength(20)
  phoneNumber: string;

  @IsIn(['home_delivery', 'store_pickup'])
  shippingMethod: 'home_delivery' | 'store_pickup';
}
