import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../../database/drizzle.service';
import { CreateOptionDto, UpdateOptionDto } from '../dto';
import { Option, NewOption, options, competitions } from '../../database/schema/voting.schema';
import { and, eq, isNull } from 'drizzle-orm';
import { User } from '../../database/schema/users.schema';

@Injectable()
export class OptionService {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(createOptionDto: CreateOptionDto, user: User): Promise<Option> {
    // Check if competition exists and user has permission
    const competition = await this.drizzle.db
      .select()
      .from(competitions)
      .where(and(eq(competitions.id, createOptionDto.competitionId), isNull(competitions.deletedAt)))
      .then((res) => res[0]);

    if (!competition) {
      throw new NotFoundException(`Competition with ID "${createOptionDto.competitionId}" not found`);
    }

    // Only the creator of the competition can add options
    if (competition.creatorId !== user.id) {
      throw new ForbiddenException('You do not have permission to add options to this competition');
    }

    const newOption: NewOption = {
      title: createOptionDto.title,
      description: createOptionDto.description,
      competitionId: createOptionDto.competitionId,
    };

    const [created] = await this.drizzle.db.insert(options).values(newOption).returning();

    return created;
  }

  async findAll(competitionId: string): Promise<Option[]> {
    return await this.drizzle.db.select().from(options).where(eq(options.competitionId, competitionId));
  }

  async findOne(id: string): Promise<Option> {
    const option = await this.drizzle.db
      .select()
      .from(options)
      .where(eq(options.id, id))
      .then((res) => res[0]);

    if (!option) {
      throw new NotFoundException(`Option with ID "${id}" not found`);
    }

    return option;
  }

  async update(id: string, updateOptionDto: UpdateOptionDto, user: User): Promise<Option> {
    const option = await this.findOne(id);

    // Get the competition to check permissions
    const competition = await this.drizzle.db
      .select()
      .from(competitions)
      .where(eq(competitions.id, option.competitionId))
      .then((res) => res[0]);

    if (!competition) {
      throw new NotFoundException(`Competition not found for this option`);
    }

    // Check if user has permission (creator or admin)
    if (user.role !== 'admin' && competition.creatorId !== user.id) {
      throw new ForbiddenException('You do not have permission to update this option');
    }

    const [updated] = await this.drizzle.db
      .update(options)
      .set({
        ...(updateOptionDto.title && { title: updateOptionDto.title }),
        ...(updateOptionDto.description && { description: updateOptionDto.description }),
        updatedAt: new Date(),
      })
      .where(eq(options.id, id))
      .returning();

    return updated;
  }

  async remove(id: string, user: User): Promise<{ success: boolean }> {
    const option = await this.findOne(id);

    // Get the competition to check permissions
    const competition = await this.drizzle.db
      .select()
      .from(competitions)
      .where(eq(competitions.id, option.competitionId))
      .then((res) => res[0]);

    if (!competition) {
      throw new NotFoundException(`Competition not found for this option`);
    }

    // Check if user has permission (creator or admin)
    if (user.role !== 'admin' && competition.creatorId !== user.id) {
      throw new ForbiddenException('You do not have permission to delete this option');
    }

    await this.drizzle.db.delete(options).where(eq(options.id, id));

    return { success: true };
  }
}
