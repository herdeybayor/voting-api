import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateCompetitionDto {
  @ApiProperty({
    description: 'The title of the competition',
    example: 'Best Movie 2024',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'The description of the competition',
    example: 'Vote for the best movie of 2024',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'The end date of the competition in ISO format',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}
