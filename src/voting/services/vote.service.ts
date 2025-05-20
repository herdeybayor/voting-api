import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../../database/drizzle.service';
import { CreateVoteDto } from '../dto';
import { Vote, NewVote, votes, options, competitions } from '../../database/schema/voting.schema';
import { and, count, eq, isNull } from 'drizzle-orm';
import { User } from '../../database/schema/users.schema';

@Injectable()
export class VoteService {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(createVoteDto: CreateVoteDto, user: User): Promise<{ success: boolean }> {
    // Check if competition exists and is not ended
    const competition = await this.drizzle.db
      .select()
      .from(competitions)
      .where(and(eq(competitions.id, createVoteDto.competitionId), isNull(competitions.deletedAt)))
      .then((res) => res[0]);

    if (!competition) {
      throw new NotFoundException(`Competition with ID "${createVoteDto.competitionId}" not found`);
    }

    // Check if competition has ended
    if (new Date(competition.endDate) < new Date()) {
      throw new BadRequestException('This competition has ended');
    }

    // Check if option exists and belongs to the competition
    const option = await this.drizzle.db
      .select()
      .from(options)
      .where(and(eq(options.id, createVoteDto.optionId), eq(options.competitionId, createVoteDto.competitionId)))
      .then((res) => res[0]);

    if (!option) {
      throw new NotFoundException(`Option with ID "${createVoteDto.optionId}" not found in this competition`);
    }

    try {
      // Create vote
      const newVote: NewVote = {
        userId: user.id,
        optionId: createVoteDto.optionId,
        competitionId: createVoteDto.competitionId,
      };

      await this.drizzle.db.insert(votes).values(newVote);

      return { success: true };
    } catch (error) {
      // Handle unique constraint violation (user already voted in this competition)
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new BadRequestException('You have already voted in this competition');
      }
      throw error;
    }
  }

  async getMyVotes(user: User): Promise<Vote[]> {
    return await this.drizzle.db.select().from(votes).where(eq(votes.userId, user.id));
  }

  async getVotesByCompetition(competitionId: string, user: User): Promise<any> {
    // Check if competition exists
    const competition = await this.drizzle.db
      .select()
      .from(competitions)
      .where(and(eq(competitions.id, competitionId), isNull(competitions.deletedAt)))
      .then((res) => res[0]);

    if (!competition) {
      throw new NotFoundException(`Competition with ID "${competitionId}" not found`);
    }

    // Check if user is the creator of the competition or an admin
    // This is to prevent users from seeing vote results before the competition ends
    const isCreatorOrAdmin = user.role === 'admin' || competition.creatorId === user.id;

    const hasEnded = new Date(competition.endDate) < new Date();

    if (!isCreatorOrAdmin && !hasEnded) {
      throw new ForbiddenException('You can only view vote results after the competition has ended');
    }

    // Get all options with vote counts
    const optionsWithVotes = await this.drizzle.db
      .select({
        optionId: options.id,
        optionTitle: options.title,
        optionDescription: options.description,
        voteCount: count(votes.userId).mapWith(Number),
      })
      .from(options)
      .leftJoin(votes, eq(options.id, votes.optionId))
      .where(eq(options.competitionId, competitionId))
      .groupBy(options.id, options.title, options.description);

    return {
      competitionId,
      competitionTitle: competition.title,
      competitionEndDate: competition.endDate,
      hasEnded,
      options: optionsWithVotes,
    };
  }
}
