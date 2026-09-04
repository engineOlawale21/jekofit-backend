import { IsString, IsNotEmpty, IsOptional, MaxLength, IsDateString, IsNumber, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PersonalInfoRequestDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class PersonalInfoDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  lastName: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'User phone number',
  })
  phoneNumber: string;

  @ApiProperty({
    example: '123 Main St',
    description: 'User address',
  })
  address: string;

  @ApiProperty({
    example: 'USA',
    description: 'User country',
  })
  country: string;

  @ApiProperty({
    example: 'California',
    description: 'User state',
  })
  state: string;

  @ApiProperty({
    example: 'Los Angeles',
    description: 'User city',
  })
  city: string;

  @ApiProperty({
    example: '90001',
    description: 'User zip code',
  })
  zipCode: string;

  @ApiProperty({ example: '1995-08-23', required: false })
  dateOfBirth: Date;

  @ApiProperty({ example: 'Female', required: false })
  gender: string;

  @ApiProperty({ example: 70.5, required: false, description: 'Weight in kg' })
  weight: number;

  @ApiProperty({ example: 175.2, required: false, description: 'Height in cm' })
  height: number;

  @ApiProperty({ example: 10000, required: false, description: 'Daily active goal' })
  dailyGoal: number;

  @ApiProperty({
    example: false,
    description: 'Email verification status',
  })
  isEmailVerified: boolean;

  @ApiProperty({
    example: 'local',
    description: 'Authentication provider',
  })
  provider: string;

  @ApiProperty({
    example: '2026-08-22T23:36:09.000Z',
    description: 'Account creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2026-08-22T23:36:09.000Z',
    description: 'Last update date',
  })
  updatedAt: Date;
}

export class PersonalInfoUpdateResponseDto {
  @ApiProperty({
    description: 'Current user information before update',
    type: PersonalInfoDto,
  })
  current: PersonalInfoDto;

  @ApiProperty({
    description: 'Updated user information after update',
    type: PersonalInfoDto,
  })
  updated: PersonalInfoDto;
}

export class UpdatePersonalInfoDto {
  @ApiProperty({
    example: 'John',
    description: 'User first name',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'User phone number',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiProperty({
    example: '123 Main St',
    description: 'User address',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @ApiProperty({
    example: 'USA',
    description: 'User country',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @ApiProperty({
    example: 'California',
    description: 'User state',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  state?: string;

  @ApiProperty({
    example: 'Los Angeles',
    description: 'User city',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiProperty({
    example: '90001',
    description: 'User zip code',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  zipCode?: string;

  @ApiProperty({ example: '1995-08-23', required: false })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ example: 'Female', required: false, maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  gender?: string;

  @ApiProperty({ example: 70.5, required: false, description: 'Weight in kg' })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiProperty({ example: 175.2, required: false, description: 'Height in cm' })
  @IsNumber()
  @IsOptional()
  height?: number;

  @ApiProperty({ example: 10000, required: false, description: 'Daily active goal' })
  @IsInt()
  @IsOptional()
  dailyGoal?: number;
}
