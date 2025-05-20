import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Serialize } from 'src/common/interceptors/serialize.interceptor';
import { UserDto } from '../users/dto/user.dto';
import { Public } from './decorators/public.decorator';
import {
  AuthResponseDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  VerifyEmailDto,
  VerifyTokenDto,
} from './dto/auth.dto';
import RequestWithUser from './request-with-user.interface';
import { AuthService } from './services/auth.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Serialize(AuthResponseDto)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Serialize(AuthResponseDto)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('verify-email')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with OTP' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Email verified successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @Serialize(UserDto)
  async verifyEmail(@Req() req: RequestWithUser, @Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(req.user.id, req.user.email, verifyEmailDto.otp);
  }

  @Post('resend-verification')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend email verification OTP' })
  @ApiResponse({
    status: 200,
    description: 'Verification code sent',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Verification code sent' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async resendVerification(@Req() req: RequestWithUser) {
    return this.authService.resendVerificationEmail(req.user.id, req.user.email);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      properties: {
        accessToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  @ApiResponse({ status: 302, description: 'Redirects to Google' })
  googleAuth() {
    this.logger.debug('Initiating Google OAuth flow');
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({
    status: 200,
    description: 'OAuth successful',
    type: AuthResponseDto,
  })
  @Serialize(AuthResponseDto)
  async googleAuthCallback(@Req() req: RequestWithUser): Promise<AuthResponseDto> {
    this.logger.log(`Google OAuth successful for user: ${req.user.id}`);
    const tokens = await this.authService.generateTokens(req.user.id);
    this.logger.log(`Tokens generated for user: ${req.user.id}`);
    return {
      user: req.user,
      tokens,
    };
  }

  @Public()
  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  @ApiOperation({ summary: 'Initiate Apple OAuth flow' })
  @ApiResponse({ status: 302, description: 'Redirects to Apple' })
  appleAuth() {
    this.logger.debug('Initiating Apple OAuth flow');
  }

  @Public()
  @Post('apple/callback')
  @UseGuards(AuthGuard('apple'))
  @ApiOperation({ summary: 'Apple OAuth callback' })
  @ApiResponse({ status: 200, description: 'OAuth successful' })
  @Serialize(AuthResponseDto)
  async appleAuthCallback(@Req() req: RequestWithUser): Promise<AuthResponseDto> {
    this.logger.log(`Apple OAuth successful for user: ${req.user?.id}`);
    const tokens = await this.authService.generateTokens(req.user.id);
    this.logger.log(`Tokens generated for user: ${req.user.id}`);
    return {
      user: req.user,
      tokens,
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logged out successfully' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Body() body: RefreshTokenDto) {
    return this.authService.revokeRefreshToken(body.refreshToken);
  }

  @Public()
  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP' })
  @ApiResponse({
    status: 200,
    description: 'Password reset instructions sent',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Password reset instructions sent',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async requestPasswordReset(@Body() { email }: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using OTP' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
    schema: {
      properties: {
        message: { type: 'string', example: 'Password reset successful' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.email, resetPasswordDto.otp, resetPasswordDto.newPassword);
  }

  @Public()
  @Post('verify-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify access token validity' })
  @ApiResponse({
    status: 200,
    description: 'Token verification result',
    schema: {
      properties: {
        valid: { type: 'boolean', example: true },
        payload: {
          type: 'object',
          properties: {
            sub: { type: 'string', example: 'user-id-123' },
            iat: { type: 'number', example: 1626361234 },
            exp: { type: 'number', example: 1626364834 },
          },
        },
      },
    },
  })
  async verifyToken(@Body() verifyTokenDto: VerifyTokenDto) {
    return this.authService.verifyToken(verifyTokenDto.accessToken);
  }
}
