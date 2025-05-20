import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty({
    example: 'mypassword123',
    description: 'Current password to confirm account deletion',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
