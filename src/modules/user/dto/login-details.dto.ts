import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDetailsRequestDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class LoginDetailsDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: '********',
    description: 'Masked password for display',
  })
  password: string;

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
