import { IsEmail, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address for password reset',
    maxLength: 255,
  })
  @IsEmail()
  @MaxLength(255)
  email: string;
}
