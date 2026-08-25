import { ApiProperty } from '@nestjs/swagger';

export class NewsletterStatusDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID',
  })
  userId: string;

  @ApiProperty({
    example: true,
    description: 'Newsletter subscription status',
  })
  isSubscribed: boolean;

  @ApiProperty({
    example: false,
    description: 'Marketing consent status',
  })
  marketingConsent: boolean;

  @ApiProperty({
    example: '2026-08-23T12:00:00.000Z',
    description: 'Subscription timestamp',
    required: false,
  })
  subscribedAt?: Date;

  @ApiProperty({
    example: '2026-08-23T12:00:00.000Z',
    description: 'Consent given timestamp',
    required: false,
  })
  consentGivenAt?: Date;
}
