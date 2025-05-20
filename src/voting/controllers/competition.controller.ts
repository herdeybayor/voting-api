import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorators/user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SerializeInterceptor } from '../../common/interceptors/serialize.interceptor';
import { User } from '../../database/schema/users.schema';
import { CompetitionResponseDto, CreateCompetitionDto, UpdateCompetitionDto } from '../dto';
import { CompetitionService } from '../services/competition.service';

@ApiTags('Competitions')
@Controller('competitions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CompetitionController {
  constructor(private readonly competitionService: CompetitionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new competition' })
  @ApiResponse({
    status: 201,
    description: 'The competition has been successfully created',
    type: CompetitionResponseDto,
  })
  @UseInterceptors(new SerializeInterceptor(CompetitionResponseDto))
  async create(@Body() createCompetitionDto: CreateCompetitionDto, @GetUser() user: User) {
    return this.competitionService.create(createCompetitionDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all competitions' })
  @ApiResponse({
    status: 200,
    description: 'Returns all competitions',
    type: [CompetitionResponseDto],
  })
  @UseInterceptors(new SerializeInterceptor(CompetitionResponseDto))
  async findAll(@GetUser() user: User) {
    // If user is admin, include soft-deleted competitions
    const includeSoftDeleted = user.role === 'admin';
    return this.competitionService.findAll(includeSoftDeleted);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a competition by ID' })
  @ApiParam({ name: 'id', description: 'Competition ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the competition with options',
    type: CompetitionResponseDto,
  })
  @UseInterceptors(new SerializeInterceptor(CompetitionResponseDto))
  async findOne(@Param('id') id: string) {
    return this.competitionService.findOneWithOptions(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a competition' })
  @ApiParam({ name: 'id', description: 'Competition ID' })
  @ApiResponse({
    status: 200,
    description: 'The competition has been successfully updated',
    type: CompetitionResponseDto,
  })
  @UseInterceptors(new SerializeInterceptor(CompetitionResponseDto))
  async update(@Param('id') id: string, @Body() updateCompetitionDto: UpdateCompetitionDto, @GetUser() user: User) {
    return this.competitionService.update(id, updateCompetitionDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a competition' })
  @ApiParam({ name: 'id', description: 'Competition ID' })
  @ApiResponse({
    status: 200,
    description: 'The competition has been successfully deleted',
  })
  async remove(@Param('id') id: string, @GetUser() user: User) {
    return this.competitionService.remove(id, user);
  }
}
