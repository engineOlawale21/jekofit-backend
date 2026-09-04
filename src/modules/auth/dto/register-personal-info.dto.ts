import { IsString, IsNotEmpty, IsEmail, MinLength, Matches, MaxLength, IsNumber, IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterPersonalInfoDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'User phone number',
    maxLength: 20,
    required: false,
  })
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiProperty({
    example: '123 Main St',
    description: 'User address',
    maxLength: 255,
    required: false,
  })
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty({
    example: 'USA',
    description: 'User country',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiProperty({
    example: 'California',
    description: 'User state',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiProperty({
    example: 'Los Angeles',
    description: 'User city',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiProperty({
    example: '90001',
    description: 'User zip code',
    maxLength: 20,
    required: false,
  })
  @IsString()
  @MaxLength(20)
  zipCode?: string;

  @ApiProperty({
    example: 'Female',
    description: 'User gender',
    maxLength: 50,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  gender?: string;

  @ApiProperty({
    example: 70.5,
    description: 'User weight in kg',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiProperty({
    example: 175.2,
    description: 'User height in cm',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  height?: number;

  @ApiProperty({
    example: 10000,
    description: 'User daily active goal',
    required: false,
  })
  @IsInt()
  @IsOptional()
  dailyGoal?: number;
}
