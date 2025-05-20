import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/user.decorator';
import { User } from '../../database/schema/users.schema';
import { CreateVoteDto } from '../dto';
import { VoteService } from '../services/vote.service';

@ApiTags('Votes')
@Controller('votes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  @Post()
  @ApiOperation({ summary: 'Cast a vote in a competition' })
  @ApiResponse({
    status: 201,
    description: 'The vote has been successfully cast',
  })
  async create(@Body() createVoteDto: CreateVoteDto, @GetUser() user: User) {
    return this.voteService.create(createVoteDto, user);
  }

  @Get('my-votes')
  @ApiOperation({ summary: 'Get all votes cast by the current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns all votes cast by the current user',
  })
  async getMyVotes(@GetUser() user: User) {
    return this.voteService.getMyVotes(user);
  }

  @Get('competition/:competitionId')
  @ApiOperation({ summary: 'Get vote results for a competition' })
  @ApiParam({ name: 'competitionId', description: 'Competition ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns vote results for the competition',
  })
  async getVotesByCompetition(@Param('competitionId') competitionId: string, @GetUser() user: User) {
    return this.voteService.getVotesByCompetition(competitionId, user);
  }
}
