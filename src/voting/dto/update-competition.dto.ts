import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateCompetitionDto {
  @ApiPropertyOptional({
    description: 'The title of the competition',
    example: 'Best Movie 2024 (Updated)',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'The description of the competition',
    example: 'Vote for the best movie of 2024 (Updated)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'The end date of the competition in ISO format',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
