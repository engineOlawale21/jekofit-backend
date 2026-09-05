import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSupportReplyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message: string;
}
