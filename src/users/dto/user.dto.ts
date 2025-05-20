import { Exclude, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/interfaces/user.interface';

export class UserDto implements User {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'John', type: String, nullable: true })
  firstName: string;

  @ApiProperty({ example: 'Doe', type: String, nullable: true })
  lastName: string;

  @ApiProperty({ example: 'John Doe', type: String, nullable: true })
  @Transform(({ value }) => value.trim())
  fullName: string | null;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', nullable: true })
  image: string | null;

  @ApiProperty({ example: true })
  isEmailVerified: boolean;

  @ApiProperty({ example: 'user' })
  role: 'admin' | 'user';

  @ApiProperty({ type: Date, example: new Date() })
  createdAt: Date;

  @ApiProperty({ type: Date, example: new Date() })
  updatedAt: Date;

  @Exclude()
  password: string;

  @Exclude()
  deletedAt: Date | null;
}
