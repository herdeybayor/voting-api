import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateOptionDto {
  @ApiPropertyOptional({
    description: 'The title of the option/candidate',
    example: 'Updated Candidate A',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'The description of the option/candidate',
    example: 'Updated description of Candidate A',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
