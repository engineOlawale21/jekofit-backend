import { ApiProperty } from '@nestjs/swagger';

export class EmailVerificationDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID',
  })
  userId: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: true,
    description: 'Email verification status',
  })
  isEmailVerified: boolean;

  @ApiProperty({
    example: '2026-08-23T12:00:00.000Z',
    description: 'Email verification timestamp (if verified)',
    required: false,
  })
  verifiedAt?: Date;
}
