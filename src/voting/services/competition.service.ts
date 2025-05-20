import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompetitionDto, UpdateCompetitionDto } from '../dto';
import { DrizzleService } from '../../database/drizzle.service';
import { Competition, NewCompetition, competitions, options, votes } from '../../database/schema/voting.schema';
import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { User } from '../../database/schema/users.schema';

@Injectable()
export class CompetitionService {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(createCompetitionDto: CreateCompetitionDto, user: User): Promise<Competition> {
    const newCompetition: NewCompetition = {
      title: createCompetitionDto.title,
      description: createCompetitionDto.description,
      endDate: new Date(createCompetitionDto.endDate),
      creatorId: user.id,
    };

    const [created] = await this.drizzle.db.insert(competitions).values(newCompetition).returning();

    return created;
  }

  async findAll(includeSoftDeleted = false): Promise<Competition[]> {
    if (includeSoftDeleted) {
      return await this.drizzle.db.select().from(competitions).orderBy(desc(competitions.createdAt));
    }

    return await this.drizzle.db
      .select()
      .from(competitions)
      .where(isNull(competitions.deletedAt))
      .orderBy(desc(competitions.createdAt));
  }

  async findOne(id: string, includeSoftDeleted = false): Promise<Competition> {
    let result;

    if (includeSoftDeleted) {
      result = await this.drizzle.db.select().from(competitions).where(eq(competitions.id, id));
    } else {
      result = await this.drizzle.db
        .select()
        .from(competitions)
        .where(and(eq(competitions.id, id), isNull(competitions.deletedAt)));
    }

    const competition = result[0];

    if (!competition) {
      throw new NotFoundException(`Competition with ID "${id}" not found`);
    }

    return competition;
  }

  async findOneWithOptions(id: string): Promise<Competition & { options: any[] }> {
    const competition = await this.findOne(id);

    const optionsWithVoteCounts = await this.drizzle.db
      .select({
        id: options.id,
        title: options.title,
        description: options.description,
        competitionId: options.competitionId,
        createdAt: options.createdAt,
        updatedAt: options.updatedAt,
        voteCount: count(votes.userId).mapWith(Number),
      })
      .from(options)
      .leftJoin(votes, eq(options.id, votes.optionId))
      .where(eq(options.competitionId, id))
      .groupBy(
        options.id,
        options.title,
        options.description,
        options.competitionId,
        options.createdAt,
        options.updatedAt,
      );

    return {
      ...competition,
      options: optionsWithVoteCounts,
    };
  }

  async update(id: string, updateCompetitionDto: UpdateCompetitionDto, user: User): Promise<Competition> {
    const competition = await this.findOne(id);

    if (user.role !== 'admin' && competition.creatorId !== user.id) {
      throw new ForbiddenException('You do not have permission to update this competition');
    }

    const [updated] = await this.drizzle.db
      .update(competitions)
      .set({
        ...(updateCompetitionDto.title && { title: updateCompetitionDto.title }),
        ...(updateCompetitionDto.description && {
          description: updateCompetitionDto.description,
        }),
        ...(updateCompetitionDto.endDate && {
          endDate: new Date(updateCompetitionDto.endDate),
        }),
        updatedAt: new Date(),
      })
      .where(eq(competitions.id, id))
      .returning();

    return updated;
  }

  async remove(id: string, user: User): Promise<{ success: boolean }> {
    const competition = await this.findOne(id);

    // Check if user has permission (creator or admin)
    if (user.role !== 'admin' && competition.creatorId !== user.id) {
      throw new ForbiddenException('You do not have permission to delete this competition');
    }

    // If admin is deleting, perform a hard delete
    if (user.role === 'admin') {
      await this.drizzle.db.delete(competitions).where(eq(competitions.id, id));
    } else {
      // Soft delete for regular users
      await this.drizzle.db
        .update(competitions)
        .set({
          deletedAt: new Date(),
        })
        .where(eq(competitions.id, id));
    }

    return { success: true };
  }
}
