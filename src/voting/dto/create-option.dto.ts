import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOptionDto {
  @ApiProperty({
    description: 'The title of the option/candidate',
    example: 'Candidate A',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'The description of the option/candidate',
    example: 'Description of Candidate A',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'The ID of the competition this option belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID(4)
  competitionId: string;
}
