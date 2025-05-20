import { Injectable, Logger, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../../database/drizzle.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { users } from 'src/database/schema';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly drizzle: DrizzleService) {}

  async findById(id: string) {
    const user = await this.drizzle.db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.drizzle.db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });
  }

  async updateSelf(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(userId);

    // If updating password, verify old password
    if (updateUserDto.password) {
      if (!updateUserDto.oldPassword) {
        throw new UnauthorizedException('Old password is required to update password');
      }

      const isPasswordValid = await bcrypt.compare(updateUserDto.oldPassword, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid old password');
      }

      // Hash new password
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Remove oldPassword from the update data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { oldPassword, ...updateData } = updateUserDto;

    // If email is being updated, check if it's already taken
    if (updateData.email) {
      const existingUser = await this.findByEmail(updateData.email);
      if (existingUser && existingUser.id !== userId) {
        throw new ForbiddenException('Email already taken');
      }
    }

    const [updatedUser] = await this.drizzle.db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  async deleteSelf(userId: string, password: string) {
    const user = await this.findById(userId);

    // Verify password before deletion
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const [deletedUser] = await this.drizzle.db
      .update(users)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    this.logger.log(`User ${userId} has been soft deleted`);
    return deletedUser;
  }
}
