import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { OptionResponseDto } from './option-response.dto';

export class CompetitionResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The unique identifier of the competition',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'The title of the competition',
    example: 'Best Movie 2024',
  })
  title: string;

  @Expose()
  @ApiProperty({
    description: 'The description of the competition',
    example: 'Vote for the best movie of 2024',
  })
  description: string;

  @Expose()
  @ApiProperty({
    description: 'The end date of the competition',
    example: '2024-12-31T23:59:59.999Z',
  })
  endDate: string;

  @Expose()
  @ApiProperty({
    description: 'The ID of the user who created the competition',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  creatorId: string;

  @Expose()
  @ApiProperty({
    description: 'When the competition was created',
    example: '2024-01-01T12:00:00.000Z',
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    description: 'When the competition was last updated',
    example: '2024-01-02T14:30:00.000Z',
  })
  updatedAt: Date;

  @Expose()
  @ApiProperty({
    description: 'The options/candidates in the competition',
    type: [OptionResponseDto],
    isArray: true,
  })
  @Type(() => OptionResponseDto)
  options?: OptionResponseDto[];
}
