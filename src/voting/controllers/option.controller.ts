import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../../auth/decorators/user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SerializeInterceptor } from '../../common/interceptors/serialize.interceptor';
import { User } from '../../database/schema/users.schema';
import { CreateOptionDto, OptionResponseDto, UpdateOptionDto } from '../dto';
import { OptionService } from '../services/option.service';

@ApiTags('Options')
@Controller('options')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OptionController {
  constructor(private readonly optionService: OptionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new option/candidate' })
  @ApiResponse({
    status: 201,
    description: 'The option has been successfully created',
    type: OptionResponseDto,
  })
  @UseInterceptors(new SerializeInterceptor(OptionResponseDto))
  async create(@Body() createOptionDto: CreateOptionDto, @GetUser() user: User) {
    return this.optionService.create(createOptionDto, user);
  }

  @Get('competition/:competitionId')
  @ApiOperation({ summary: 'Get all options for a competition' })
  @ApiParam({ name: 'competitionId', description: 'Competition ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all options for the competition',
    type: [OptionResponseDto],
  })
  @UseInterceptors(new SerializeInterceptor(OptionResponseDto))
  async findAll(@Param('competitionId') competitionId: string) {
    return this.optionService.findAll(competitionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an option by ID' })
  @ApiParam({ name: 'id', description: 'Option ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the option',
    type: OptionResponseDto,
  })
  @UseInterceptors(new SerializeInterceptor(OptionResponseDto))
  async findOne(@Param('id') id: string) {
    return this.optionService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an option' })
  @ApiParam({ name: 'id', description: 'Option ID' })
  @ApiResponse({
    status: 200,
    description: 'The option has been successfully updated',
    type: OptionResponseDto,
  })
  @UseInterceptors(new SerializeInterceptor(OptionResponseDto))
  async update(@Param('id') id: string, @Body() updateOptionDto: UpdateOptionDto, @GetUser() user: User) {
    return this.optionService.update(id, updateOptionDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an option' })
  @ApiParam({ name: 'id', description: 'Option ID' })
  @ApiResponse({
    status: 200,
    description: 'The option has been successfully deleted',
  })
  async remove(@Param('id') id: string, @GetUser() user: User) {
    return this.optionService.remove(id, user);
  }
}
