import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class OptionResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The unique identifier of the option',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'The title of the option/candidate',
    example: 'Candidate A',
  })
  title: string;

  @Expose()
  @ApiProperty({
    description: 'The description of the option/candidate',
    example: 'Description of Candidate A',
    nullable: true,
  })
  description?: string;

  @Expose()
  @ApiProperty({
    description: 'The ID of the competition this option belongs to',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  competitionId: string;

  @Expose()
  @ApiProperty({
    description: 'The total number of votes for this option',
    example: 42,
  })
  voteCount?: number;

  @Expose()
  @ApiProperty({
    description: 'When the option was created',
    example: '2024-01-01T12:00:00.000Z',
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    description: 'When the option was last updated',
    example: '2024-01-02T14:30:00.000Z',
  })
  updatedAt: Date;
}
