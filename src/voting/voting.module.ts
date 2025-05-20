import { Module } from '@nestjs/common';
import { CompetitionService } from './services/competition.service';
import { OptionService } from './services/option.service';
import { VoteService } from './services/vote.service';
import { CompetitionController } from './controllers/competition.controller';
import { OptionController } from './controllers/option.controller';
import { VoteController } from './controllers/vote.controller';

@Module({
  controllers: [CompetitionController, OptionController, VoteController],
  providers: [CompetitionService, OptionService, VoteService],
  exports: [CompetitionService, OptionService, VoteService],
})
export class VotingModule {}
