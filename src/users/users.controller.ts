import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Patch,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Serialize } from 'src/common/interceptors/serialize.interceptor';
import { FileValidationPipe } from 'src/common/pipes/file-validation.pipe';
import RequestWithUser from '../auth/request-with-user.interface';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UpdateUserDto, UploadProfileImageDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { UsersService } from './services/users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    type: UserDto,
  })
  @Serialize(UserDto)
  async getCurrentUser(@Req() req: RequestWithUser) {
    return await this.usersService.findById(req.user.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid old password' })
  @ApiResponse({ status: 403, description: 'Email already taken' })
  @Serialize(UserDto)
  async updateSelf(@Req() req: RequestWithUser, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateSelf(req.user.id, updateUserDto);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    type: UserDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  async deleteSelf(@Req() req: RequestWithUser, @Body() deleteAccountDto: DeleteAccountDto) {
    return this.usersService.deleteSelf(req.user.id, deleteAccountDto.password);
  }

  @Patch('me/profile-image')
  @ApiOperation({ summary: 'Upload profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Profile image uploaded successfully',
    type: UserDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @UseInterceptors(FileInterceptor('file'))
  @Serialize(UserDto)
  async uploadProfileImage(
    @Req() req: RequestWithUser,
    @Body() _: UploadProfileImageDto,
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
  ) {
    return await this.usersService.uploadProfileImage(req.user.id, file);
  }
}
