import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNewsletterDto {
  @ApiProperty({
    example: true,
    description: 'Newsletter subscription status',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isSubscribed?: boolean;

  @ApiProperty({
    example: false,
    description: 'Marketing consent status',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  marketingConsent?: boolean;
}
