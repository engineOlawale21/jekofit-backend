import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSupportTicketDto {
  @IsEmail() @MaxLength(254) email: string;
  @IsOptional() @IsString() @MaxLength(120) subject?: string;
  @IsString() @IsNotEmpty() @MaxLength(4000) message: string;
}
