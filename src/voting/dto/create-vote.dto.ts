import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateVoteDto {
  @ApiProperty({
    description: 'The ID of the option/candidate being voted for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID(4)
  optionId: string;

  @ApiProperty({
    description: 'The ID of the competition being voted in',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsNotEmpty()
  @IsUUID(4)
  competitionId: string;
}
